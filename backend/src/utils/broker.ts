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

    if (!brokerDoc.is_active) {
      console.error(`Broker with ID ${strategy.broker} is not active.`);
      return null;
    }

    // Use the new FyersBroker initialization pattern
    return await FyersBroker.create((brokerDoc._id as string).toString());
  } catch (error) {
    console.error("Error creating broker instance:", error);
    return null;
  }
}
