import { QueueClient } from "./QueueClient";
import { QueueTask } from "../types/queue.types";
import Strategy from "../models/strategy.model";
import Instrument from "../models/instruments.model";
import { getBrokerInstance } from "../utils/broker";

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
    }, 1000);

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
      // Step 1: Fetch Strategy based on the task's strategy ID

      const strategy = await Strategy.findById(task.data.strategyId);
      if (!strategy) {
        throw new Error(`Strategy not found: ${task.data.strategyId}`);
      }

      // Step 2: Fetch the updated symbol after rollover
      const symbol = await Instrument.findById(strategy.symbol);
      if (!symbol) {
        throw new Error(`Symbol not found: ${strategy.symbol}`);
      }

      const broker = await getBrokerInstance(strategy._id.toString());
      if (!broker) {
        throw new Error("Failed to get broker instance");
      }

      // Step 4: Place order using the broker's API
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

      // Step 5: Mark the task as complete
      await this.queueClient.completeTask(task.id);
      console.log(`Order placed successfully: ${orderResponse.orderId}`);
    } catch (error) {
      // Step 6: Handle errors and mark the task as failed
      if (error instanceof Error) {
        await this.queueClient.completeTask(task.id, error.message);
      } else {
        await this.queueClient.completeTask(task.id, "Unknown error");
      }
      throw error;
    }
  }
}
