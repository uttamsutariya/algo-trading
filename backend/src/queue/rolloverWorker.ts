import { Worker } from "bullmq";
import redisConfig from "../config/redis.config";
import {
  getOpenOrders,
  closeAllPositions,
  findNextContract,
  openNewPositions,
  updateStrategySymbol
} from "../utils/tradeFunctions";
import { FyersBroker } from "../brokersApi/FyersBroker";
import brokerConfig from "../config/broker.config";

// Create a FyersBroker instance using credentials
const broker = FyersBroker.getInstance(brokerConfig.fyers);

export class RolloverTaskWorker {
  private worker: Worker;

  constructor() {
    // Initialize the worker
    this.worker = new Worker(
      "rolloverQueue",
      async (job) => {
        try {
          console.log("Job received:", job.data);
          const strategy = job.data.strategy;

          if (!strategy) {
            console.error("No strategy data found in job.");
            return;
          }

          console.log(`Executing rollover job for strategy: ${strategy.name}`);

          // // Fetch open positions
          const openPositions = await getOpenOrders(broker, strategy._id);
          if (!openPositions.length) {
            console.log(`No open positions found for strategy ${strategy.name}`);
            return;
          }

          // // Close positions
          await closeAllPositions(broker, openPositions, strategy._id);

          // Find the next contract
          const nextSymbol = await findNextContract(strategy.symbol);
          if (!nextSymbol) {
            console.log(`No next contract found for strategy ${strategy.name}`);
            return;
          } else {
            console.log(`Next contract found for strategy ${strategy.name}`, nextSymbol);

            // Update the strategy with the new symbol ID
            try {
              const nextSymbolId = nextSymbol.nextSymbol;
              if (nextSymbolId) {
                const updatedStrategy = await updateStrategySymbol(strategy._id, nextSymbolId);
                console.log(`Strategy ${strategy.name} updated with new symbol ID: ${updatedStrategy.symbol}`);
              } else {
                console.log(`No valid next contract found for strategy ${strategy.name}`);
              }
            } catch (error) {
              console.error("Failed to update strategy with new symbol ID:", error);
            }
          }

          // // Reopen positions with the new contract
          const nextSymbolId = nextSymbol.nextSymbol;

          if (nextSymbolId) {
            await openNewPositions(broker, openPositions, nextSymbolId);
            console.log(`Rollover completed successfully for strategy: ${strategy.name}`);
          } else {
            console.log(`No valid next contract found. Skipping position re-opening for strategy: ${strategy.name}`);
          }
        } catch (error) {
          console.error("Error executing rollover job:", error);
        }
      },
      { connection: redisConfig.redis }
    );

    // Handle worker events
    this.worker.on("completed", (job) => {
      console.log(`Job ${job.id} completed successfully.`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });

    this.worker.on("error", (err) => {
      console.error("Worker error:", err);
    });

    console.log("Rollover worker instance created");
  }

  // Start worker (returning a Promise)
  public start(): Promise<void> {
    return new Promise((resolve) => {
      console.log("Rollover worker started and listening for jobs...");
      resolve();
    });
  }

  // Stop worker gracefully
  public async stop() {
    console.log("Stopping rollover worker...");
    await this.worker.close();
    console.log("Rollover worker stopped.");
  }
}
