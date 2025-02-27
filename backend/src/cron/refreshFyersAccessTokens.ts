import cron from "node-cron";
import axios from "axios";
import BrokerModel from "../models/broker.model";
import { FyersCredentials } from "../models/broker.model"; // 🔹 Import the type

// Function to refresh access token
const refreshAccessToken = async () => {
  try {
    console.log("Running daily access token refresh...");

    // Get all active brokers
    const brokers = await BrokerModel.find({ is_active: true });

    for (const broker of brokers) {
      if (broker.broker_name !== "fyers") continue; // Only process Fyers for now

      // ✅ Type Assertion: Tell TypeScript that these credentials are FyersCredentials
      const fyersCredentials = broker.credentials as FyersCredentials;
      const { refresh_token, fy_id } = fyersCredentials;
      const tokenIssuedAt = new Date(broker.token_issued_at);

      // Calculate how many days have passed since the refresh token was issued
      const daysSinceIssued = (Date.now() - tokenIssuedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceIssued >= 15) {
        console.warn(`Refresh token expired for broker: ${fy_id}. User must reauthenticate.`);

        // Instead of trying to refresh, mark user as inactive and require reauthentication
        broker.is_active = false;
        await broker.save();

        continue; // Skip API call for expired tokens
      }

      try {
        // ✅ Call Fyers API to refresh token ONLY IF within 15 days
        const tokenResponse = await axios.post(
          "https://api.fyers.in/api/v2/token",
          { grant_type: "refresh_token", refresh_token },
          { headers: { "Content-Type": "application/json" } }
        );

        if (!tokenResponse.data.access_token) {
          console.error(`Failed to refresh token for ${fy_id}`);
          continue;
        }

        const { access_token } = tokenResponse.data;

        // ✅ Update access token and reset token issued timestamp in DB
        fyersCredentials.access_token = access_token;
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
