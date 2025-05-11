import Strategy from "../../models/strategy.model";
import { StrategyStatus, BrokersAvailable } from "../../types/enums";
import { validateCreateStrategy, validateUpdateStrategy } from "../../validators/strategy.validation";
import mongoose from "mongoose";
import { Request, Response } from "express";
import rolloverQueue from "../../queue/rolloverQueue";
// Interface for Request Body
export interface IStrategyInput {
  name: string;
  description: string;
  symbol: mongoose.Types.ObjectId;
  status: StrategyStatus;
  rollOverOn: Date | null;
  broker: BrokersAvailable;
}

//......................  create  strategy ....................................................//

export const createStrategy = async (req: Request, res: Response) => {
  try {
    const { isValid, error, validatedData } = await validateCreateStrategy(req.body);

    if (!isValid) {
      // Return the validation error
      return res.status(400).json({ error });
    }

    // Create and save the strategy
    const newStrategy = new Strategy(validatedData);
    const savedStrategy = await newStrategy.save();
    console.log(savedStrategy, "save strategy");

    // Schedule the rollover job using BullMQ
    if (savedStrategy.rollOverOn) {
      console.log("schedule rollover job");
      await rolloverQueue.add(
        "execute-rollover",
        { strategy: savedStrategy.toObject() },
        { delay: new Date(savedStrategy.rollOverOn).getTime() - Date.now() } // Delay job until rollOverOn date
      );
      console.log("Test job added to queue");
    }
    // Populate the instrument details before sending response
    const populatedStrategy = await savedStrategy.populate("symbol");

    // Respond with the created strategy
    return res.status(201).json(populatedStrategy);
  } catch (err) {
    const error = err as Error; // Type assertion

    // Handle unexpected errors
    return res.status(500).json({ error: "Failed to create strategy", details: error.message });
  }
};

//......................  update strategy ....................................................//

export const updateStrategy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid strategy ID." });
    }

    const { isValid, error, validatedData } = await validateUpdateStrategy(
      req.body,
      id as unknown as mongoose.Types.ObjectId
    );

    if (!isValid) {
      // Return the validation error
      return res.status(400).json({ error });
    }

    // Update and populate the instrument details
    const updatedStrategy = await Strategy.findByIdAndUpdate(id, validatedData, { new: true }).populate("symbol");

    if (!updatedStrategy) {
      return res.status(404).json({ error: "Strategy not found." });
    }

    // Respond with the updated strategy
    return res.status(200).json(updatedStrategy);
  } catch (err) {
    const error = err as Error; // Type assertion
    // Handle unexpected errors
    return res.status(500).json({ error: "Failed to update strategy", details: error.message });
  }
};

//......................  view strategy ....................................................//

export const viewAllStrategies = async (req: Request, res: Response) => {
  try {
    // Fetch all strategies and populate instrument details
    const strategies = await Strategy.find().populate("symbol");

    // Respond with the list of strategies
    return res.status(200).json(strategies);
  } catch (err) {
    const error = err as Error; // Type assertion
    return res.status(500).json({ error: "Failed to retrieve strategies.", details: error.message });
  }
};

//......................  view strategy by id ....................................................//

export const viewStrategy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid strategy ID." });
    }

    // Fetch the strategy and populate instrument details
    const strategy = await Strategy.findById(id).populate("symbol");

    // Handle case when the strategy is not found
    if (!strategy) {
      return res.status(404).json({ error: "Strategy not found." });
    }

    // Respond with the found strategy
    return res.status(200).json(strategy);
  } catch (err) {
    const error = err as Error; // Type assertion

    return res.status(500).json({ error: "Failed to retrieve strategy.", details: error.message });
  }
};

//................... delete strategy by id ................................................//

export const deleteStrategy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid strategy ID." });
    }

    // Check if the strategy exists before deletion
    const existingStrategy = await Strategy.findById(id);
    if (!existingStrategy) {
      return res.status(404).json({ error: "Strategy not found. Please provide a valid strategy ID." });
    }

    // Delete the strategy by ID
    const deletedStrategy = await Strategy.findByIdAndDelete(id);

    // Respond with success message
    return res.status(200).json({ message: "Strategy successfully deleted.", strategy: deletedStrategy });
  } catch (err) {
    const error = err as Error; // Type assertion

    return res.status(500).json({ error: "Failed to delete strategy.", details: error.message });
  }
};
