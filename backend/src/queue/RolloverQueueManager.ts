import { Job } from "bullmq";
import { BaseQueueManager } from "./BaseQueueManager";
import { queueConfigs } from "./config/queue.config";
import { Types } from "mongoose";
import {
  getOpenOrders,
  closeAllPositions,
  findNextContract,
  openNewPositions,
  updateStrategySymbol
} from "../utils/tradeFunctions";
import Strategy from "../models/strategy.model";

export interface RolloverJobData {
  strategy: {
    _id: string;
    name: string;
    symbol: string;
  };
}

export class RolloverQueueManager extends BaseQueueManager {
  private static instance: RolloverQueueManager;

  private constructor() {
    super(queueConfigs.rollover.name, queueConfigs.rollover.options, queueConfigs.rollover.workerOptions);
  }

  public static getInstance(): RolloverQueueManager {
    if (!RolloverQueueManager.instance) {
      RolloverQueueManager.instance = new RolloverQueueManager();
    }
    return RolloverQueueManager.instance;
  }

  protected async processJob(job: Job<RolloverJobData>): Promise<void> {
    const { strategy } = job.data;

    if (!strategy) {
      throw new Error("No strategy data found in job");
    }

    console.log(`Executing rollover job for strategy: ${strategy.name}`);

    const nextSymbol = await findNextContract(new Types.ObjectId(strategy.symbol));
    if (!nextSymbol.nextSymbol) {
      throw new Error(`No next contract found for strategy ${strategy.name}, Symbol: ${strategy.symbol}`);
    }

    const openPositions = await getOpenOrders(strategy._id);
    if (!openPositions.length) {
      console.log(`No open positions found for strategy ${strategy.name}`);
      await job.updateProgress(100);
      return;
    }

    await closeAllPositions(openPositions, strategy._id);

    await openNewPositions(openPositions, nextSymbol.nextSymbol, strategy._id);
    console.log(`Rollover completed successfully for strategy: ${strategy.name}`);

    const updatedStrategy = await updateStrategySymbol(strategy._id, nextSymbol.nextSymbol);
    console.log(`Strategy ${strategy.name} updated with new symbol ID: ${updatedStrategy.symbol}`);

    await Strategy.findByIdAndUpdate(strategy._id, {
      rollOverOn: null
    });

    await job.updateProgress(100);
  }

  public async addRolloverJob(data: RolloverJobData, options?: any): Promise<Job<RolloverJobData>> {
    return this.queue.add("rollover", data, {
      ...options,
      priority: 2 // Lower priority for rollover jobs
    });
  }

  public async scheduleRolloverJob(
    data: RolloverJobData,
    scheduleTime: Date,
    options?: any
  ): Promise<Job<RolloverJobData>> {
    return this.queue.add("rollover", data, {
      ...options,
      priority: 2,
      delay: scheduleTime.getTime() - Date.now()
    });
  }
}
