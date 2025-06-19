import { Request, Response } from "express";
import mongoose from "mongoose";
import Strategy from "../../models/strategy.model";
import { TradeQueueManager } from "../../queue/TradeQueueManager";

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

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    console.log("Webhook received ::", req.body);
    const { isValid, error, validatedData } = await validateWebhookRequest(req.body);

    if (!isValid || !validatedData) {
      return res.status(400).json({ error });
    }

    console.log("Validated data ::", validatedData);

    // Get the trade queue manager instance
    const tradeQueueManager = TradeQueueManager.getInstance();

    // Add the trade job to the queue
    const job = await tradeQueueManager.addTradeJob({
      strategyId: validatedData.strategyId,
      qty: validatedData.qty,
      side: validatedData.side
    });

    console.log("Job added to queue ::", job);

    return res.status(200).json({
      message: "Trade job added to queue",
      jobId: job.id
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
