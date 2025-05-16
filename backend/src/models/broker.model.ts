import mongoose, { Schema, Document } from "mongoose";

// Credential type definitions for each broker
export interface FyersCredentials {
  access_token: string;
  refresh_token: string;
  client_id: string;
  secret_key: string;
  fy_id: string;
}

interface AngelOneCredentials {
  api_key: string;
  api_token?: string;
  app_id?: string;
}

interface ZerodhaCredentials {
  api_key: string;
  api_secret?: string;
  access_token?: string;
  user_id?: string;
}

export type BrokerCredentials = FyersCredentials | AngelOneCredentials | ZerodhaCredentials;

export interface IBroker extends Document {
  broker_name: string;
  is_active: boolean;
  credentials: BrokerCredentials;
  token_issued_at?: Date;
}

const BrokerSchema = new Schema<IBroker>(
  {
    broker_name: {
      type: String,
      required: true,
      enum: ["fyers", "angelone", "zerodha", "other"],
      index: true
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true
    },
    credentials: {
      type: Schema.Types.Mixed,
      required: true
    },
    token_issued_at: {
      type: Date
    }
  },
  {
    timestamps: true,
    strict: true
  }
);

// Validation logic moved to pre('validate') for correct access to broker_name
BrokerSchema.pre("validate", function (next) {
  const broker = this as IBroker;
  const brokerName = broker.broker_name;
  const credentials = broker.credentials as Record<string, any>;

  const validationRules: Record<string, string[]> = {
    fyers: ["fy_id", "access_token", "refresh_token", "client_id", "secret_key"],
    angelone: ["api_key", "api_token", "app_id"],
    zerodha: ["api_key", "api_secret", "access_token", "user_id"]
  };

  if (brokerName === "other") return next(); // skip for 'other'

  const requiredFields = validationRules[brokerName];
  if (!requiredFields) return next(); // skip unknown broker names

  const presentFields = Object.keys(credentials || {});

  // Allow initial save if ONLY client_id and secret_key are present
  if (
    brokerName === "fyers" &&
    presentFields.length === 2 &&
    "client_id" in credentials &&
    "secret_key" in credentials
  ) {
    return next();
  }

  // Allow partial save if no sensitive fields present
  const hasPartialData = requiredFields.some((field) => presentFields.includes(field));
  if (!hasPartialData) return next(); // allow partial save

  // Enforce full validation only if some data is present
  const missingFields = requiredFields.filter(
    (field) => typeof credentials[field] !== "string" || credentials[field].length === 0
  );

  if (missingFields.length > 0) {
    return next(
      new Error(`Invalid credentials format for broker type: ${brokerName}. Missing: ${missingFields.join(", ")}`)
    );
  }

  return next();
});

const BrokerModel = mongoose.model<IBroker>("BrokerCredentials", BrokerSchema, "broker_credentials");
export default BrokerModel;
