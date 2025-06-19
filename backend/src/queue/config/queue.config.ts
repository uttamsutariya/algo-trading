import { QueueOptions, WorkerOptions } from "bullmq";
import redisConfig from "../../config/redis.config.js";

// Common queue options
export const defaultQueueOptions: QueueOptions = {
  connection: redisConfig.redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000
    },
    removeOnComplete: {
      age: 24 * 3600, // keep completed jobs for 24 hours
      count: 1000 // keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // keep failed jobs for 7 days
      count: 5000 // keep last 5000 failed jobs
    }
  }
};

// Common worker options
export const defaultWorkerOptions: WorkerOptions = {
  connection: redisConfig.redis,
  concurrency: 5,
  limiter: {
    max: 100,
    duration: 1000
  }
};

// Queue-specific configurations
export const queueConfigs = {
  trade: {
    name: "trade-queue",
    options: {
      ...defaultQueueOptions,
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        priority: 1 // Higher priority for trade jobs
      }
    },
    workerOptions: {
      ...defaultWorkerOptions,
      concurrency: 3 // Lower concurrency for trade jobs
    }
  },
  rollover: {
    name: "rollover-queue",
    options: {
      ...defaultQueueOptions,
      defaultJobOptions: {
        ...defaultQueueOptions.defaultJobOptions,
        priority: 2 // Lower priority for rollover jobs
      }
    },
    workerOptions: {
      ...defaultWorkerOptions,
      concurrency: 2 // Lower concurrency for rollover jobs
    }
  }
};
