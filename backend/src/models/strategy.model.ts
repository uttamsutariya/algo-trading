import mongoose, { Schema } from "mongoose";
import { StrategyStatus, RollOverStatus, SymbolType } from "../types/enums";

const strategySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },
    symbol: {
      type: String,
      required: true
    },
    symbolType: {
      type: String,
      enum: Object.values(SymbolType),
      default: SymbolType.FUTURE
    },
    status: {
      type: String,
      enum: Object.values(StrategyStatus),
      default: StrategyStatus.STOPPED
    },
    nextExpiry: {
      type: Date,
      required: true
    },
    rollOverOn: {
      type: Date,
      required: true
    },

    rollOverStatus: {
      type: String,
      enum: Object.values(RollOverStatus),
      default: RollOverStatus.DISABLED
    }
  },
  {
    timestamps: true // This will automatically add createdAt and updatedAt fields
  }
);

const Strategy = mongoose.model("Strategy", strategySchema);

export default Strategy;
