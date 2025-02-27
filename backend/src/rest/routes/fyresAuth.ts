import { Router, Request, Response } from "express";
import axios from "axios";
const FyersAPI = require("fyers-api-v3").fyersModel; // Ensure this is placed correctly at the top
import BrokerModel from "../../models/broker.model"; // MongoDB Model

require("dotenv").config();

// Load environment variables
const client_id = process.env.FYERS_CLIENT_ID;
const redirect_uri = process.env.FYERS_REDIRECT_URI;
const applIdHash = process.env.FYERS_APPL_ID_HASH;

const router = Router();

// Step 1: Redirect to Fyers login page
router.get("/login", (req: Request, res: Response) => {
  const authUrl = `https://api.fyers.in/api/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}`;
  res.redirect(authUrl); // Redirect the user to the Fyers login page
});

// Step 2: Handle the callback after login
router.get("/callback", async (req: Request, res: Response) => {
  const { auth_code } = req.query;

  if (!auth_code) {
    return res.status(400).send("Error: Missing auth_code");
  }

  try {
    // Step 3: Exchange auth_code for access_token
    const tokenResponse = await axios.post(
      "https://api.fyers.in/api/v2/auth",
      {
        auth_code: auth_code,
        applIdHash: applIdHash
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    if (!access_token) {
      throw new Error("Failed to retrieve access token");
    }

    // Step 4: Fetch Fyers Profile
    const fyers = new FyersAPI();
    fyers.setAppId(client_id);
    fyers.setRedirectUrl(redirect_uri);
    fyers.setAccessToken(access_token);

    const profileResponse = await fyers.get_profile();

    if (!profileResponse || profileResponse.s !== "ok") {
      throw new Error("Failed to fetch broker profile");
    }

    const brokerProfile = profileResponse.data;
    const fy_id = brokerProfile.fy_id;
    const broker_name = brokerProfile.name; // Extract fy_id from profile data

    if (!fy_id) {
      throw new Error("Failed to retrieve fy_id from profile");
    }

    // Step 5: Save Credentials to MongoDB (Prevent Duplicates)
    let broker = await BrokerModel.findOne({ "credentials.fy_id": fy_id });

    if (broker) {
      // Update existing broker credentials
      broker.credentials = {
        fy_id,
        access_token,
        refresh_token,
        client_id: client_id as string,
        app_hash_id: applIdHash as string
      };
      await broker.save();
    } else {
      // Create a new broker entry
      broker = new BrokerModel({
        broker_name: broker_name,
        is_active: true,
        credentials: {
          fy_id,
          access_token,
          refresh_token,
          client_id,
          app_hash_id: applIdHash
        }
      });
      await broker.save();
    }

    console.log("Broker credentials saved successfully!");

    // Step 6: Return Access Token and Profile to User
    res.json({
      message: "Authentication successful",
      access_token
    });
  } catch (error) {
    console.error("Error during token exchange or profile fetch:", error);
    res.status(500).json({ error: "Failed to retrieve broker profile" });
  }
});

export default router;
