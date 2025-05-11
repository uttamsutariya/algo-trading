import { Request, Response } from "express";
import Strategy from "../../models/strategy.model";
import { findNextContract, updateStrategySymbol } from "../../utils/tradeFunctions";

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

    // Find the next contract
    const { nextSymbol, message } = await findNextContract(strategy.symbol);
    if (!nextSymbol) {
      console.log(`No next contract found for strategy ${strategy.name}`);
      return res.status(404).json({ message });
    }

    console.log(`Next contract found for strategy ${strategy.name}`, nextSymbol);

    // Update the strategy with the new symbol ID
    try {
      const updatedStrategy = await updateStrategySymbol(strategy._id.toString(), nextSymbol);
      console.log(`Strategy ${strategy.name} updated with new symbol ID: ${updatedStrategy.symbol}`);
      return res.status(200).json({ message: "Rollover successful", updatedStrategy });
    } catch (error) {
      console.error("Failed to update strategy with new symbol ID:", error);
      return res.status(500).json({ message: "Failed to update strategy", error });
    }
  } catch (error) {
    console.error("Internal server error:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};
