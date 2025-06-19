import mongoose, { Schema } from "mongoose";
import { SymbolType } from "../types/enums.js";

const instrumentSchema = new Schema(
  {
    brokerSymbols: {
      fyers: {
        type: String,
        unique: true,
        required: true
      }
    },
    underlying: {
      type: String,
      required: true
    },
    expiry: {
      type: Date,
      required: true
    },
    instrumentType: {
      type: String,
      enum: Object.values(SymbolType),
      default: SymbolType.FUTURE
    },
    exToken: {
      type: String,
      required: true,
      unique: true
    },
    exchange: {
      type: String,
      required: true
    },
    exSymName: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const Instrument = mongoose.model("Instrument", instrumentSchema);

export default Instrument;
