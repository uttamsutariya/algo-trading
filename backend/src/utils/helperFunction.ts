import crypto from "crypto";
import BrokerModel from "../models/broker.model";

export function generateAppIdHash(appId: string, secretKey: string): string {
  const combined = `${appId}:${secretKey}`;
  const hash = crypto.createHash("sha256").update(combined).digest("hex");
  return hash;
}

export async function getBrokerCredentials(broker_id: string) {
  const brokerData = await BrokerModel.findById(broker_id);
  if (!brokerData) {
    throw new Error("Broker not found");
  }
  return brokerData;
}
