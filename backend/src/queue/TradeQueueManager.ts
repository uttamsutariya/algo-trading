import { Job } from "bullmq";
import { BaseQueueManager } from "./BaseQueueManager";
import { queueConfigs } from "./config/queue.config";
import Strategy from "../models/strategy.model";
import Instrument from "../models/instruments.model";
import { getBrokerInstance } from "../utils/broker";

export interface TradeJobData {
  strategyId: string;
  qty: number;
  side: "buy" | "sell";
}

export class TradeQueueManager extends BaseQueueManager {
  private static instance: TradeQueueManager;

  private constructor() {
    super(queueConfigs.trade.name, queueConfigs.trade.options, queueConfigs.trade.workerOptions);
  }

  public static getInstance(): TradeQueueManager {
    if (!TradeQueueManager.instance) {
      TradeQueueManager.instance = new TradeQueueManager();
    }
    return TradeQueueManager.instance;
  }

  protected async processJob(job: Job<TradeJobData>): Promise<void> {
    const { strategyId, qty, side } = job.data;
    try {
      // Step 1: Fetch Strategy
      const strategy = await Strategy.findById(strategyId);
      if (!strategy) {
        throw new Error(`Strategy not found: ${strategyId}`);
      }

      // Step 2: Fetch the symbol
      const symbol = await Instrument.findById(strategy.symbol);
      if (!symbol) {
        throw new Error(`Symbol not found: ${strategy.symbol}`);
      }

      // Step 3: Get broker instance
      const broker = await getBrokerInstance(strategy._id.toString());
      if (!broker) {
        throw new Error(`Failed to initialize broker instance for strategy: ${strategyId}`);
      }

      // Step 4: Place order
      const orderResponse = await broker.placeOrder({
        symbol: symbol.brokerSymbols?.fyers!,
        qty,
        side
      });

      if (!orderResponse.success) {
        throw new Error(orderResponse.error || "Order placement failed");
      }

      // Update job progress
      await job.updateProgress(100);
      console.log(`Order placed successfully for strategy: ${strategyId} with orderId: ${orderResponse.orderId}`);
    } catch (error) {
      console.error("Error processing trade job:", error);
      await job.moveToFailed(error as Error, strategyId);
    }
  }

  public async addTradeJob(data: TradeJobData, options?: any): Promise<Job<TradeJobData>> {
    return this.queue.add("trade", data, {
      ...options,
      priority: 1 // High priority for trade jobs
    });
  }
}
