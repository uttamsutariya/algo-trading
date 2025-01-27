import { QueueClient } from "./QueueClient";
import { QueueTask } from "../types/queue.types";
import Strategy from "../models/strategy.model";
import { FyersBroker } from "../brokersApi/FyersBroker";
import config from "../config/broker.config";
import Instrument from "../models/instruments.model";

export class TradeTaskWorker {
  private queueClient: QueueClient;
  private isProcessing: boolean = false;
  private stopRequested: boolean = false;
  private workerInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.queueClient = QueueClient.getInstance();
  }

  public async start(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.stopRequested = false;

    // Start the worker loop in the background
    this.workerInterval = setInterval(async () => {
      if (!this.stopRequested) {
        try {
          const task = await this.queueClient.getNextTask();
          if (task) {
            await this.processTask(task);
          }
        } catch (error) {
          console.error("Error processing task:", error);
        }
      }
    }, 1000); // Check for new tasks every second

    // Resolve immediately so the server can continue starting
    return Promise.resolve();
  }

  public stop(): void {
    this.stopRequested = true;
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }
    this.isProcessing = false;
  }

  private async processTask(task: QueueTask): Promise<void> {
    try {
      const strategy = await Strategy.findById(task.data.strategyId);
      if (!strategy) {
        throw new Error(`Strategy not found: ${task.data.strategyId}`);
      }

      const symbol = await Instrument.findById(strategy.symbol);

      if (!symbol) {
        throw new Error(`Symbol not found: ${strategy.symbol}`);
      }

      console.log(strategy);
      console.log(symbol?.brokerSymbols?.fyers);

      // Initialize broker based on strategy's broker
      const broker = FyersBroker.getInstance({
        appId: config.fyers.appId,
        accessToken: config.fyers.accessToken,
        redirectUrl: config.fyers.redirectUrl
      });
      await broker.initialize();

      // Place order
      const orderResponse = await broker.placeOrder({
        symbol: symbol?.brokerSymbols?.fyers!,
        qty: task.data.qty,
        side: task.data.side,
        productType: "MARGIN",
        orderTag: `strategy_${strategy._id}`
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || "Order placement failed");
      }

      await this.queueClient.completeTask(task.id);
      console.log(`Order placed successfully: ${orderResponse.orderId}`);
    } catch (error) {
      if (error instanceof Error) {
        await this.queueClient.completeTask(task.id, error.message);
      } else {
        await this.queueClient.completeTask(task.id, "Unknown error");
      }
      throw error;
    }
  }
}
