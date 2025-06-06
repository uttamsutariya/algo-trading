import { Request, Response } from "express";
import mongoose from "mongoose";
import Strategy from "../../models/strategy.model";
import { QueueClient } from "../../queue/QueueClient";
import { TradeTask } from "../../types/queue.types";
import BrokerModel from "../../models/broker.model";

interface WebhookRequest {
  strategyId: string;
  qty: number;
  side: Side;
}

type Side = "buy" | "sell";

const validateWebhookRequest = async (
  data: any
): Promise<{ isValid: boolean; error?: string; validatedData?: WebhookRequest }> => {
  // Check if all required fields are present
  if (!data.strategyId || !data.qty || !data.side) {
    return {
      isValid: false,
      error: "Missing required fields. 'strategyId', 'qty', and 'side' are required."
    };
  }

  // Validate strategyId
  if (!mongoose.Types.ObjectId.isValid(data.strategyId)) {
    return {
      isValid: false,
      error: "Invalid strategyId. Must be a valid MongoDB ObjectId."
    };
  }

  // Check if strategy exists
  const strategy = await Strategy.findById(data.strategyId);
  if (!strategy) {
    return {
      isValid: false,
      error: "Strategy not found"
    };
  }

  // Validate qty
  const quantity = Number(data.qty);
  if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
    return {
      isValid: false,
      error: "Quantity must be a positive integer"
    };
  }

  // Validate side
  const validSides: Side[] = ["buy", "sell"];
  if (!validSides.includes(data.side)) {
    return {
      isValid: false,
      error: "Side must be either 'buy' or 'sell'"
    };
  }

  return {
    isValid: true,
    validatedData: {
      strategyId: data.strategyId,
      qty: quantity,
      side: data.side
    }
  };
};

export const webhookController = async (req: Request, res: Response) => {
  try {
    const validation = await validateWebhookRequest(req.body);

    if (!validation.isValid || !validation.validatedData) {
      return res.status(400).json({
        status: "error",
        error: validation.error
      });
    }

    const { strategyId, qty, side } = validation.validatedData;
    // Create trade task
    const tradeTask: TradeTask = {
      strategyId,
      qty,
      side,
      timestamp: new Date().toISOString()
    };

    // Add task to queue
    const queueClient = QueueClient.getInstance();
    const taskId = await queueClient.addTask(tradeTask);

    return res.status(200).json({
      status: "success",
      message: "Trade task queued successfully",
      data: {
        taskId,
        ...validation.validatedData
      }
    });
  } catch (err) {
    const error = err as Error;
    console.error("Webhook processing error:", error);

    return res.status(500).json({
      status: "error",
      error: "Internal server error",
      details: error.message
    });
  }
};
