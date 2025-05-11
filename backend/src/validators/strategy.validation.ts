import { StrategyStatus, BrokersAvailable } from "../types/enums";
import { IStrategyInput } from "../rest/controllers/strategy.controller";
import mongoose from "mongoose";
import Instrument from "../models/instruments.model";
import Strategy from "../models/strategy.model";

type ValidationResult = {
  isValid: boolean;
  error?: string;
  validatedData: Partial<IStrategyInput>;
};

// Helper function for common validations
const validateSymbolAndRollOver = async (
  symbol: mongoose.Types.ObjectId,
  rollOverOn: Date | null | undefined
): Promise<{ isValid: boolean; error?: string; instrumentData?: any }> => {
  // Validate symbol
  if (!mongoose.Types.ObjectId.isValid(symbol)) {
    return {
      isValid: false,
      error: "Invalid input: 'symbol' must be a valid instrument ID."
    };
  }

  // Fetch and validate instrument
  const instrumentData = await Instrument.findById(symbol);
  if (!instrumentData) {
    return {
      isValid: false,
      error: "Invalid input: The specified instrument does not exist."
    };
  }

  // Validate rollOverOn if provided
  if (rollOverOn) {
    const parsedRollOverOn = new Date(rollOverOn);
    if (isNaN(parsedRollOverOn.getTime())) {
      return {
        isValid: false,
        error: "Invalid date format for 'rollOverOn'. Use YYYY-MM-DD format or null to disable rollover."
      };
    }

    const expiryDate = new Date(instrumentData.expiry);
    const currentDate = new Date();

    // Check if rollover date is in the past
    if (parsedRollOverOn < currentDate) {
      return {
        isValid: false,
        error: "Roll over date cannot be in the past."
      };
    }

    // Check if rollover date is after expiry
    if (parsedRollOverOn >= expiryDate) {
      return {
        isValid: false,
        error: "Roll over date must be before the instrument's expiry date."
      };
    }
  }

  return { isValid: true, instrumentData };
};

// Validation for creating a new strategy
export const validateCreateStrategy = async (data: IStrategyInput): Promise<ValidationResult> => {
  const validatedData: Partial<IStrategyInput> = {};

  // Required fields check
  if (!data.name || typeof data.name !== "string") {
    return {
      isValid: false,
      error: "Invalid input: 'name' is required and must be a string.",
      validatedData
    };
  }
  validatedData.name = data.name;

  if (!data.description || typeof data.description !== "string") {
    return {
      isValid: false,
      error: "Invalid input: 'description' is required and must be a string.",
      validatedData
    };
  }
  validatedData.description = data.description;

  if (!data.symbol) {
    return {
      isValid: false,
      error: "Invalid input: 'symbol' is required.",
      validatedData
    };
  }

  // Validate symbol and rollover
  const symbolValidation = await validateSymbolAndRollOver(data.symbol, data.rollOverOn);
  if (!symbolValidation.isValid) {
    return {
      isValid: false,
      error: symbolValidation.error,
      validatedData
    };
  }

  validatedData.symbol = new mongoose.Types.ObjectId(data.symbol);
  validatedData.rollOverOn = data.rollOverOn || null;

  // Validate broker
  if (!data.broker || !Object.values(BrokersAvailable).includes(data.broker)) {
    return {
      isValid: false,
      error: `Invalid broker. Allowed values: ${Object.values(BrokersAvailable).join(", ")}.`,
      validatedData
    };
  }
  validatedData.broker = data.broker;

  return { isValid: true, validatedData };
};

// Validation for updating an existing strategy
export const validateUpdateStrategy = async (
  data: Partial<IStrategyInput>,
  id: mongoose.Types.ObjectId
): Promise<ValidationResult> => {
  const validatedData: Partial<IStrategyInput> = {};

  // Check if strategy exists before validation
  const existingStrategy = await Strategy.findById(id);
  if (!existingStrategy) {
    return {
      isValid: false,
      error: "Strategy not found. Please provide a valid strategy ID.",
      validatedData
    };
  }

  // Validate optional fields if provided
  if (data.name !== undefined) {
    if (typeof data.name !== "string" || !data.name.trim()) {
      return {
        isValid: false,
        error: "Invalid input: 'name' must be a non-empty string.",
        validatedData
      };
    }
    validatedData.name = data.name;
  }

  if (data.description !== undefined) {
    if (typeof data.description !== "string" || !data.description.trim()) {
      return {
        isValid: false,
        error: "Invalid input: 'description' must be a non-empty string.",
        validatedData
      };
    }
    validatedData.description = data.description;
  }

  // Validate symbol and rollover if either is provided
  if (data.symbol !== undefined || data.rollOverOn !== undefined) {
    let symbolToValidate: mongoose.Types.ObjectId;

    if (data.symbol) {
      symbolToValidate = new mongoose.Types.ObjectId(data.symbol);
    } else {
      // Get the existing strategy's symbol if not provided in update
      const existingStrategy = await Strategy.findById(id);
      if (!existingStrategy) {
        return {
          isValid: false,
          error: "Strategy not found",
          validatedData
        };
      }
      symbolToValidate = existingStrategy.symbol;
    }

    const symbolValidation = await validateSymbolAndRollOver(symbolToValidate, data.rollOverOn);
    if (!symbolValidation.isValid) {
      return {
        isValid: false,
        error: symbolValidation.error,
        validatedData
      };
    }

    if (data.symbol) {
      validatedData.symbol = symbolToValidate;
    }
    if (data.rollOverOn !== undefined) {
      validatedData.rollOverOn = data.rollOverOn;
    }
  }

  // Validate status if provided
  if (data.status !== undefined) {
    if (!Object.values(StrategyStatus).includes(data.status)) {
      return {
        isValid: false,
        error: `Invalid status. Allowed values: ${Object.values(StrategyStatus).join(", ")}.`,
        validatedData
      };
    }
    validatedData.status = data.status;
  }

  // Validate broker if provided
  if (data.broker !== undefined) {
    if (!Object.values(BrokersAvailable).includes(data.broker)) {
      return {
        isValid: false,
        error: `Invalid broker. Allowed values: ${Object.values(BrokersAvailable).join(", ")}.`,
        validatedData
      };
    }
    validatedData.broker = data.broker;
  }

  return { isValid: true, validatedData };
};
