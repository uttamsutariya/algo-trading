import { Router, Request, Response } from "express";
import axios from "axios";
const FyersAPI = require("fyers-api-v3").fyersModel; // Ensure this is placed correctly at the top
import BrokerModel from "../../models/broker.model"; // MongoDB Model

require("dotenv").config();

// Load environment variables
const client_id = process.env.FYERS_CLIENT_ID;
const redirect_url = process.env.FYERS_REDIRECT_URL;
const secret_key = process.env.FYERS_SECRET_ID;
const router = Router();

// Step 1: Redirect to Fyers login page
router.get("/login", (req: Request, res: Response) => {
  const authUrl = `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${client_id}&redirect_uri=${redirect_url}&response_type=code&state=sample_state`;
  console.log("Generated Auth URL:", authUrl);

  res.redirect(authUrl); // Redirect the user to the Fyers login page
});

// Step 2: Handle the callback after login
router.get("/callback", async (req: Request, res: Response) => {
  console.log("Callback route hit!");
  console.log("Query params:", req.query);
  const { auth_code } = req.query;
  console.log(auth_code, "auth_code");

  if (!auth_code) {
    return res.status(400).send("Error: Missing auth_code");
  }

  try {
    // Step 3: Exchange auth_code for access_token
    const tokenResponse = await axios.post(
      "https://api-t1.fyers.in/api/v3/validate-authcode",
      {
        grant_type: "authorization_code",
        appIdHash: "a8e137c770319f6bafdf760e1881f57c56c40815e652574ad37578c1fcd90b7c",
        code: auth_code
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Token response:", tokenResponse.data);
    const { access_token, refresh_token } = tokenResponse.data;

    if (!access_token) {
      throw new Error("Failed to retrieve access token");
    }

    // Step 4: Fetch Fyers Profile
    const app_id = client_id; // Use your Fyers App ID
    const profileResponse = await axios.get("https://api-t1.fyers.in/api/v3/profile", {
      headers: {
        Authorization: `${app_id}:${access_token}`
      }
    });
    console.log("Profile response:", profileResponse.data);

    if (!profileResponse.data || profileResponse.data.s !== "ok") {
      throw new Error("Failed to fetch broker profile");
    }

    //Correctly extract profile data
    const brokerProfile = profileResponse.data.data;
    const fy_id = brokerProfile.fy_id;

    if (!fy_id) {
      throw new Error("Failed to retrieve fy_id from profile");
    }

    console.log("Broker Profile Fetched Successfully:", brokerProfile);

    // Step 5: Save Credentials to MongoDB (Prevent Duplicates)
    let broker = await BrokerModel.findOne({ "credentials.fy_id": fy_id });

    const issuedAt = new Date(); // Correctly set the token issued timestamp

    if (broker) {
      // Update existing broker credentials
      broker.credentials = {
        fy_id,
        access_token,
        refresh_token,
        client_id: client_id as string,
        secret_key: secret_key as string
      };
      broker.token_issued_at = issuedAt;
      await broker.save();
    } else {
      // Create a new broker entry

      const broker_name = "fyers";
      broker = new BrokerModel({
        broker_name,
        is_active: true,
        credentials: {
          fy_id,
          access_token,
          refresh_token,
          client_id,
          secret_key: secret_key
        },
        token_issued_at: issuedAt
      });
      broker.token_issued_at = issuedAt;

      await broker.save();
    }

    console.log("Broker credentials saved successfully!");

    // Step 6: Redirect to Dashboard after successful DB save
    res.redirect("http://localhost:3000");
  } catch (error) {
    console.error("Error during token exchange or profile fetch:", error);
    res.status(500).json({ error: "Failed to retrieve broker profile" });
  }
});

export default router;
