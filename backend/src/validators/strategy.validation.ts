import { StrategyStatus, RollOverStatus } from "../types/enums";
import { IStrategy } from "../controllers/strategy.controller";

export const validateStrategy = (
  { name, description, status, nextExpiry, rollOverStatus, rollOverOn }: Partial<IStrategy>,
  isCreate: boolean = false
): { isValid: boolean; error?: string; validatedData: Partial<IStrategy> } => {
  const validatedData: Partial<IStrategy> = {};

  // Validate `name`
  if (isCreate || name !== undefined) {
    if (!name || typeof name !== "string") {
      return {
        isValid: false,
        error: "Invalid input: 'name' is required and must be a string.",
        validatedData // Ensure this is included
      };
    } else {
      validatedData.name = name;
    }
  }

  // Validate `description`
  if (isCreate || description !== undefined) {
    if (!description || typeof description !== "string") {
      return {
        isValid: false,
        error: "Invalid input: 'description' is required and must be a string.",
        validatedData // Ensure this is included
      };
    } else {
      validatedData.description = description;
    }
  }

  // Validate `status`
  if (status !== undefined) {
    if (!Object.values(StrategyStatus).includes(status)) {
      return {
        isValid: false,
        error: `Invalid status. Allowed values: ${Object.values(StrategyStatus).join(", ")}.`,
        validatedData // Ensure this is included
      };
    } else {
      validatedData.status = status;
    }
  }

  // Validate `rollOverStatus`
  if (rollOverStatus !== undefined) {
    if (!Object.values(RollOverStatus).includes(rollOverStatus)) {
      return {
        isValid: false,
        error: `Invalid rollOverStatus. Allowed values: ${Object.values(RollOverStatus).join(", ")}.`,
        validatedData // Ensure this is included
      };
    } else {
      validatedData.rollOverStatus = rollOverStatus;
    }
  }

  // Validate `nextExpiry`
  if (isCreate || nextExpiry !== undefined) {
    if (!nextExpiry) {
      return { isValid: false, error: "'nextExpiry' is required.", validatedData }; // Ensure this is included
    } else {
      const parsedNextExpiry = new Date(nextExpiry);
      if (isNaN(parsedNextExpiry.getTime())) {
        return {
          isValid: false,
          error: "Invalid date format for 'nextExpiry'. Use YYYY-MM-DD format.",
          validatedData // Ensure this is included
        };
      } else {
        validatedData.nextExpiry = parsedNextExpiry; // Save as Date object
      }
    }
  }

  // Validate `rollOverOn`
  if (isCreate || rollOverOn !== undefined) {
    if (!rollOverOn) {
      return { isValid: false, error: "'rollOverOn' is required.", validatedData }; // Ensure this is included
    } else {
      const parsedRollOverOn = new Date(rollOverOn);
      if (isNaN(parsedRollOverOn.getTime())) {
        return {
          isValid: false,
          error: "Invalid date format for 'rollOverOn'. Use YYYY-MM-DD format.",
          validatedData // Ensure this is included
        };
      } else {
        validatedData.rollOverOn = parsedRollOverOn; // Save as Date object

        // Logical Validation: rollOverOn should be on or before nextExpiry
        if (validatedData.nextExpiry) {
          if (parsedRollOverOn > validatedData.nextExpiry) {
            return {
              isValid: false,
              error: "'rollOverOn' must be on or before 'nextExpiry'.",
              validatedData // Ensure this is included
            };
          }
        }
      }
    }
  }

  return { isValid: true, validatedData };
};
