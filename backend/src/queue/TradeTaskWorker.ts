import { QueueClient } from "./QueueClient";
import { QueueTask } from "../types/queue.types";
import Strategy from "../models/strategy.model";
import { FyersBroker } from "../brokersApi/FyersBroker";
import config from "../config/broker.config";
import Instrument from "../models/instruments.model";

import { fetchOpenPositions, getNextContract, closeAllPositions, openNewPositions } from "../utils/trade";

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

      // Step 2: Check if it's time to roll over
      const today = new Date();
      const rolloverDate = strategy.rollOverOn ? new Date(strategy.rollOverOn) : null;

      if (rolloverDate && today.toDateString() === rolloverDate.toDateString()) {
        console.log(`Rollover required for strategy: ${strategy._id}`);

        // Step 3: Initialize broker (Fyers API)
        const broker = FyersBroker.getInstance({
          appId: config.fyers.appId,
          accessToken: config.fyers.accessToken,
          redirectUrl: config.fyers.redirectUrl
        });
        await broker.initialize();

        // Step 4: Fetch all open positions
        const openPositions = await fetchOpenPositions(broker);
        if (openPositions.length > 0) {
          // Step 5: Close all open positions
          await closeAllPositions(broker, openPositions);

          // Step 6: Get new symbol for next contract
          const newSymbol = await getNextContract(strategy.symbol.toString());
          if (!newSymbol) {
            throw new Error("Next contract symbol not found");
          }

          // Step 7: Open all same positions with the new symbol
          await openNewPositions(broker, openPositions, newSymbol);

          // Step 8: Update strategy with the new symbol ID
          strategy.symbol = newSymbol._id;
          await strategy.save();

          console.log(`Rollover complete. Strategy updated to new symbol: ${newSymbol.exSymName}`);
        }
      } else {
        console.log("No rollover required or rollover date not set.");
      }

      // Step 9: Fetch the updated symbol after rollover and place order
      const symbol = await Instrument.findById(strategy.symbol);
      if (!symbol) {
        throw new Error(`Symbol not found: ${strategy.symbol}`);
      }

      console.log(`Placing order for symbol: ${symbol?.brokerSymbols?.fyers}`);

      // Step 10: Initialize broker for placing the order
      const broker = FyersBroker.getInstance({
        appId: config.fyers.appId,
        accessToken: config.fyers.accessToken,
        redirectUrl: config.fyers.redirectUrl
      });
      await broker.initialize();

      // Step 11: Place order using the broker's API
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

      // Step 12: Mark the task as complete
      await this.queueClient.completeTask(task.id);
      console.log(`Order placed successfully: ${orderResponse.orderId}`);
    } catch (error) {
      // Step 13: Handle errors and mark the task as failed
      if (error instanceof Error) {
        await this.queueClient.completeTask(task.id, error.message);
      } else {
        await this.queueClient.completeTask(task.id, "Unknown error");
      }
      throw error;
    }
  }
}
