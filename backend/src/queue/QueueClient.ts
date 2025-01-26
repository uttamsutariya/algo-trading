import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { QueueTask, TradeTask, TaskStatus } from "../types/queue.types";
import config from "../config/redis.config";

export class QueueClient {
  private static instance: QueueClient;
  private redis: Redis;
  private readonly queueKey: string = "trade_tasks_queue";
  private readonly processingKey: string = "trade_tasks_processing";
  private readonly completedKey: string = "trade_tasks_completed";

  private constructor() {
    this.redis = new Redis(config.redis);
  }

  public static getInstance(): QueueClient {
    if (!QueueClient.instance) {
      QueueClient.instance = new QueueClient();
    }
    return QueueClient.instance;
  }

  public async addTask(task: TradeTask): Promise<string> {
    const queueTask: QueueTask = {
      id: uuidv4(),
      data: task,
      status: TaskStatus.PENDING,
      createdAt: new Date().toISOString()
    };

    await this.redis.lpush(this.queueKey, JSON.stringify(queueTask));
    return queueTask.id;
  }

  public async getNextTask(): Promise<QueueTask | null> {
    const taskStr = await this.redis.rpoplpush(this.queueKey, this.processingKey);
    if (!taskStr) return null;

    const task: QueueTask = JSON.parse(taskStr);
    task.status = TaskStatus.PROCESSING;
    await this.updateTask(task);
    return task;
  }

  public async completeTask(taskId: string, error?: string): Promise<void> {
    // Get the task data before removing it
    const tasks = await this.redis.lrange(this.processingKey, 0, -1);
    const taskStr = tasks.find((t) => JSON.parse(t).id === taskId);
    if (!taskStr) return;

    // Remove the task
    await this.redis.lrem(this.processingKey, 1, taskStr);

    const task: QueueTask = JSON.parse(taskStr);
    task.status = error ? TaskStatus.FAILED : TaskStatus.COMPLETED;
    task.processedAt = new Date().toISOString();
    if (error) task.error = error;

    await this.redis.lpush(this.completedKey, JSON.stringify(task));
    // Keep only last 1000 completed tasks
    await this.redis.ltrim(this.completedKey, 0, 999);
  }

  private async updateTask(task: QueueTask): Promise<void> {
    const tasks = await this.redis.lrange(this.processingKey, 0, -1);
    const taskIndex = tasks.findIndex((t) => JSON.parse(t).id === task.id);
    if (taskIndex !== -1) {
      await this.redis.lset(this.processingKey, taskIndex, JSON.stringify(task));
    }
  }

  public async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    const queues = [this.queueKey, this.processingKey, this.completedKey];
    for (const queue of queues) {
      const tasks = await this.redis.lrange(queue, 0, -1);
      const task = tasks.find((t) => JSON.parse(t).id === taskId);
      if (task) {
        return JSON.parse(task).status;
      }
    }
    return null;
  }
}
