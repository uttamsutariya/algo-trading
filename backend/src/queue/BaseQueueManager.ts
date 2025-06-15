import { Queue, Worker, Job, QueueOptions, WorkerOptions } from "bullmq";
import { EventEmitter } from "events";
import { defaultQueueOptions, defaultWorkerOptions } from "./config/queue.config";

type JobCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
};

export abstract class BaseQueueManager extends EventEmitter {
  protected queue: Queue;
  protected worker: Worker;
  protected isProcessing: boolean = false;

  constructor(
    queueName: string,
    queueOptions: QueueOptions = defaultQueueOptions,
    workerOptions: WorkerOptions = defaultWorkerOptions
  ) {
    super();

    // Initialize queue
    this.queue = new Queue(queueName, queueOptions);

    // Initialize worker
    this.worker = new Worker(
      queueName,
      async (job: Job) => {
        try {
          await this.processJob(job);
        } catch (error) {
          console.error(`Error processing job ${job.id}:`, error);
          throw error; // Let BullMQ handle the retry logic
        }
      },
      workerOptions
    );

    // Set up event listeners
    this.setupEventListeners();
  }

  protected abstract processJob(job: Job): Promise<void>;

  private setupEventListeners(): void {
    // Queue events
    this.queue.on("error", (error: Error) => {
      console.error(`Queue error:`, error);
      this.emit("error", error);
    });

    // Worker events
    this.worker.on("completed", (job: Job) => {
      console.log(`Job ${job.id} completed successfully`);
      this.emit("jobCompleted", job);
    });

    this.worker.on("failed", (job: Job | undefined, error: Error) => {
      console.error(`Worker failed to process job ${job?.id}:`, error);
      this.emit("jobFailed", job, error);
    });

    this.worker.on("error", (error: Error) => {
      console.error("Worker error:", error);
      this.emit("error", error);
    });
  }

  public async addJob(data: any, options?: any): Promise<Job> {
    return this.queue.add("default", data, options);
  }

  public async getJob(jobId: string): Promise<Job | null> {
    return this.queue.getJob(jobId);
  }

  public async getJobCounts(): Promise<JobCounts> {
    const counts = await this.queue.getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: counts.paused || 0
    };
  }

  public async pause(): Promise<void> {
    await this.queue.pause();
    this.isProcessing = false;
  }

  public async resume(): Promise<void> {
    await this.queue.resume();
    this.isProcessing = true;
  }

  public async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
    this.isProcessing = false;
  }

  public isActive(): boolean {
    return this.isProcessing;
  }
}
