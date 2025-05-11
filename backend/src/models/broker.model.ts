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
  api_token: string;
  app_id: string;
}

interface ZerodhaCredentials {
  api_key: string;
  api_secret: string;
  access_token: string;
  user_id: string;
}

// Union type for all possible credential types
export type BrokerCredentials = FyersCredentials | AngelOneCredentials | ZerodhaCredentials;

// Main broker interface
export interface IBroker extends Document {
  broker_name: string;
  is_active: boolean;
  credentials: BrokerCredentials;
  token_issued_at: Date;
}

const BrokerSchema = new Schema(
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
      required: true,
      validate: {
        validator: function (this: IBroker, credentials: any): boolean {
          const brokerName = this.broker_name;

          // Validation rules for each broker type
          const validationRules = {
            fyers: ["fy_id", "access_token", "refresh_token", "client_id", "secret_key"],
            angelone: ["api_key", "api_token", "app_id"],
            zerodha: ["api_key", "api_secret", "access_token", "user_id"]
          };

          // Skip validation for 'other' broker type
          if (brokerName === "other") return true;

          const requiredFields = validationRules[brokerName as keyof typeof validationRules];
          if (!requiredFields) return false;

          // Check if all required fields exist and are non-empty strings
          return requiredFields.every(
            (field) => typeof credentials[field] === "string" && credentials[field].length > 0
          );
        },
        message: (props: { value: IBroker }) => {
          const brokerName = (props as any).value.broker_type;
          return `Invalid credentials format for broker type: ${brokerName}`;
        }
      }
    },
    token_issued_at: {
      type: Date,
      required: true
    }
  },

  {
    timestamps: true,
    strict: true
  }
);

// Add type checking middleware
BrokerSchema.pre("save", function (next) {
  const broker = this as IBroker;
  const credentials = broker.credentials;

  switch (broker.broker_name) {
    case "fyers":
      if (!isFyersCredentials(credentials)) {
        return next(new Error("Invalid Fyers credentials format"));
      }
      break;
    case "angelone":
      if (!isAngelOneCredentials(credentials)) {
        return next(new Error("Invalid Angel One credentials format"));
      }
      break;
    case "zerodha":
      if (!isZerodhaCredentials(credentials)) {
        return next(new Error("Invalid Zerodha credentials format"));
      }
      break;
  }
  next();
});

// Type guard functions
function isFyersCredentials(cred: any): cred is FyersCredentials {
  return (
    "fy_id" in cred && "access_token" in cred && "refresh_token" in cred && "client_id" in cred && "secret_key" in cred
  );
}

function isAngelOneCredentials(cred: any): cred is AngelOneCredentials {
  return "api_key" in cred && "api_token" in cred && "app_id" in cred;
}

function isZerodhaCredentials(cred: any): cred is ZerodhaCredentials {
  return "api_key" in cred && "api_secret" in cred && "access_token" in cred && "user_id" in cred;
}

const BrokerModel = mongoose.model<IBroker>("BrokerCredentials", BrokerSchema, "broker_credentials");
export default BrokerModel;
