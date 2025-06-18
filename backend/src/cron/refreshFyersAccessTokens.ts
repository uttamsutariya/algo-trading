import cron from "node-cron";
import axios from "axios";
import BrokerModel from "../models/broker.model";
import { FyersCredentials } from "../models/broker.model";
import { FyersBroker } from "../brokersApi/FyersBroker";

// Function to refresh access token

const refreshAccessToken = async () => {
  try {
    console.log("Running daily access token refresh...");

    // Get all active brokers
    const brokers = await BrokerModel.find({ is_active: true });

    for (const broker of brokers) {
      if (broker.broker_name !== "fyers" || !broker.is_active) continue; // Only process Fyers for now

      // Type Assertion: Tell TypeScript that these credentials are FyersCredentials
      const fyersCredentials = broker.credentials as FyersCredentials;
      const { refresh_token, fy_id } = fyersCredentials;
      const tokenIssuedAt = new Date(broker.token_issued_at ?? Date.now());

      // Calculate how many days have passed since the refresh token was issued
      const daysSinceIssued = (Date.now() - tokenIssuedAt.getTime()) / (1000 * 60 * 60 * 24);

      // keeping 1 days buffer
      if (daysSinceIssued >= 14) {
        console.warn(`Refresh token expired for broker: ${fy_id}. User must reauthenticate.`);

        //  mark user as inactive and require reauthentication
        broker.is_active = false;
        await broker.save();

        continue; // Skip API call for expired tokens
      }

      try {
        //Call Fyers API to refresh token ONLY IF within 15 days
        const brokerInstance = new FyersBroker(fyersCredentials.client_id, fyersCredentials.access_token);
        const accessToken = await brokerInstance.getNewToken(refresh_token);
        console.log("accessToken ::", accessToken);

        //Update access token and reset token issued timestamp in DB
        broker.credentials = {
          ...fyersCredentials,
          access_token: accessToken
        };
        broker.is_active = true;
        broker.token_issued_at = new Date(); // Set new issue time
        await broker.save();

        console.log(`Access token refreshed successfully for ${fy_id}`);
      } catch (error) {
        console.error(`Failed to refresh token for ${fy_id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error refreshing access tokens:", error);
  }
};

// Schedule Cron Job to Run Every Day at 2 AM
cron.schedule("0 2 * * *", refreshAccessToken);

export default refreshAccessToken;
