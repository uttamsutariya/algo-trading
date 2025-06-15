import { FyersBroker } from "../brokersApi/FyersBroker";
import BrokerModel, { FyersCredentials } from "../models/broker.model";
import Strategy from "../models/strategy.model";

/**
 * Factory function to create a broker instance based on strategy ID
 */
export async function getBrokerInstance(strategyId: string): Promise<FyersBroker | null> {
  try {
    const strategy = await Strategy.findById(strategyId);
    if (!strategy) {
      console.error(`Strategy with ID ${strategyId} not found.`);
      return null;
    }

    const brokerDoc = await BrokerModel.findById(strategy.broker);
    if (!brokerDoc) {
      console.error(`Broker with ID ${strategy.broker} not found.`);
      return null;
    }

    if (brokerDoc.broker_name !== "fyers") {
      console.error("Only Fyers broker is supported currently");
      return null;
    }

    const fyersCredentials = brokerDoc.credentials as FyersCredentials;
    return new FyersBroker(fyersCredentials.client_id, fyersCredentials.access_token);
  } catch (error) {
    console.error("Error creating broker instance:", error);
    return null;
  }
}
