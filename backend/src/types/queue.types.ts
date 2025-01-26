export interface TradeTask {
  strategyId: string;
  qty: number;
  side: "buy" | "sell";
  timestamp: string;
}

export interface QueueTask {
  id: string;
  data: TradeTask;
  status: TaskStatus;
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export enum TaskStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed"
}
