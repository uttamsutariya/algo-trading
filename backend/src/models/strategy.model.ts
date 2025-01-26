import mongoose, { Schema } from "mongoose";
import { BrokersAvailable, StrategyStatus } from "../types/enums";

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
      type: Schema.Types.ObjectId,
      ref: "Instrument",
      required: true
    },
    status: {
      type: String,
      enum: Object.values(StrategyStatus),
      default: StrategyStatus.RUNNING
    },
    rollOverOn: {
      type: Date,
      required: false,
      default: null
    },
    broker: {
      type: String,
      enum: Object.values(BrokersAvailable),
      default: BrokersAvailable.FYERS,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Strategy = mongoose.model("Strategy", strategySchema);

export default Strategy;
