import { Request, Response } from "express";
import Strategy from "../../models/strategy.model";
import { RolloverQueueManager } from "../../queue/RolloverQueueManager";

export const rollover = async (req: Request, res: Response) => {
  try {
    const { strategyId } = req.params;

    if (!strategyId) {
      return res.status(400).json({ message: "Missing strategyId in request parameters" });
    }

    // Fetch the strategy by ID
    const strategy = await Strategy.findById(strategyId);
    if (!strategy) {
      return res.status(404).json({ message: "Strategy not found" });
    }

    // Get the rollover queue manager instance
    const rolloverQueueManager = RolloverQueueManager.getInstance();

    // Add the rollover job to the queue
    const job = await rolloverQueueManager.addRolloverJob({
      strategy: {
        _id: strategy._id.toString(),
        name: strategy.name,
        symbol: strategy.symbol.toString()
      }
    });

    return res.status(200).json({
      message: "Rollover job added to queue",
      jobId: job.id
    });
  } catch (error) {
    console.error("Error processing rollover request:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};
