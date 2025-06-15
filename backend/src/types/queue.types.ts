export interface TradeJobData {
  strategyId: string;
  qty: number;
  side: "buy" | "sell";
}

export interface RolloverJobData {
  strategy: {
    _id: string;
    name: string;
    symbol: string;
  };
}

// Legacy types (to be removed after migration)
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
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}
