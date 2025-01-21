import { error } from "console";
import Strategy from "../models/strategy.model";
import { StrategyStatus, RollOverStatus, SymbolType } from "../types/enums";
import { validateStrategy } from "../validators/strategy.validation";
import mongoose from "mongoose";

// Interface for Request Body
export interface IStrategy {
  name: string;
  description: string;
  symbol: string;
  symbolType: SymbolType;
  status: StrategyStatus;
  nextExpiry: Date;
  rollOverOn: Date;
  rollOverStatus: RollOverStatus;
}

// Controller Function

//......................  create  strategy ....................................................//

export const createStrategy = async (req: any, res: any) => {
  try {
    // Validate the request body with `isCreate = true`
    const { isValid, error, validatedData } = validateStrategy(req.body, true);

    if (!isValid) {
      // Return the validation error
      res.status(400).json({ error });
      return;
    }

    // Create and save the strategy
    const newStrategy = new Strategy(validatedData);
    const savedStrategy = await newStrategy.save();

    // Respond with the created strategy
    res.status(201).json(savedStrategy);
  } catch (err) {
    const error = err as Error; // Type assertion

    // Handle unexpected errors
    res.status(500).json({ error: "Failed to create strategy", details: error.message });
  }
};

//......................  update strategy ....................................................//

export const updateStrategy = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Validate the request body with `isCreate = false`
    const { isValid, error, validatedData } = validateStrategy(req.body, false);

    if (!isValid) {
      // Return the validation error
      res.status(400).json({ error });
      return;
    }

    // Update the strategy in the database
    const updatedStrategy = await Strategy.findByIdAndUpdate(id, validatedData, { new: true });

    if (!updatedStrategy) {
      res.status(404).json({ error: "Strategy not found." });
      return;
    }

    // Respond with the updated strategy
    res.status(200).json(updatedStrategy);
  } catch (err) {
    const error = err as Error; // Type assertion
    // Handle unexpected errors
    res.status(500).json({ error: "Failed to update strategy", details: error.message });
  }
};

//......................  view strategy ....................................................//

export const viewAllStrategies = async (req: any, res: any) => {
  try {
    // Fetch all strategies from the database
    const strategies = await Strategy.find();

    // If no strategies exist, return a 404 response
    if (strategies.length === 0) {
      return res.status(404).json({ error: "No strategies found." });
    }

    // Respond with the list of strategies
    res.status(200).json(strategies);
  } catch (err) {
    const error = err as Error; // Type assertion
    res.status(500).json({ error: "Failed to retrieve strategies.", details: error.message });
  }
};

//......................  view strategy by id ....................................................//

export const viewStrategy = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid strategy ID." });
    }

    // Fetch the strategy by ID
    const strategy = await Strategy.findById(id);

    // Handle case when the strategy is not found
    if (!strategy) {
      return res.status(404).json({ error: "Strategy not found." });
    }

    // Respond with the found strategy
    res.status(200).json(strategy);
  } catch (err) {
    const error = err as Error; // Type assertion

    res.status(500).json({ error: "Failed to retrieve strategy.", details: error.message });
  }
};

//................... delete strategy by id ................................................//

export const deleteStrategy = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid strategy ID." });
    }

    // Delete the strategy by ID
    const deletedStrategy = await Strategy.findByIdAndDelete(id);

    // Handle case when the strategy is not found
    if (!deletedStrategy) {
      return res.status(404).json({ error: "Strategy not found." });
    }

    // Respond with success message
    res.status(200).json({ message: "Strategy successfully deleted.", strategy: deletedStrategy });
  } catch (err) {
    const error = err as Error; // Type assertion

    res.status(500).json({ error: "Failed to delete strategy.", details: error.message });
  }
};
