import { QueueClient } from "./QueueClient";
import { QueueTask } from "../types/queue.types";
import Strategy from "../models/strategy.model";

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
      const strategy = await Strategy.findById(task.data.strategyId).populate("symbol");
      if (!strategy) {
        throw new Error(`Strategy not found: ${task.data.strategyId}`);
      }

      // TODO: Implement actual trade execution logic here
      console.log(`Processing trade for strategy ${strategy.name}:`, {
        symbol: strategy.symbol,
        side: task.data.side,
        qty: task.data.qty
      });

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await this.queueClient.completeTask(task.id);
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
