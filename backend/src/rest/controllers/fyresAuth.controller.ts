// controllers/fyers.controller.ts
import { Request, Response } from "express";
import axios from "axios";
import BrokerModel from "../../models/broker.model";
import { generateAppIdHash, getBrokerCredentials } from "../../utils/helperFunction";
import { FyersCredentials } from "../../models/broker.model";

require("dotenv").config();

const redirect_url = process.env.FYERS_REDIRECT_URL!;
const FYERS_BASE_URL = "https://api-t1.fyers.in/api/v3";

export const fyersLogin = async (req: Request, res: Response) => {
  try {
    const { broker_id } = req.body;
    if (!broker_id) {
      return res.status(400).send("Error: Missing broker_id");
    }

    // Get broker credentials
    const brokerCredentialsInfo = await getBrokerCredentials(broker_id);
    const { client_id } = brokerCredentialsInfo.credentials as FyersCredentials;

    const state = Buffer.from(JSON.stringify({ broker_id })).toString("base64");
    const authUrl = `${FYERS_BASE_URL}/generate-authcode?client_id=${client_id}&redirect_uri=${redirect_url}&response_type=code&state=${state}`;

    return res.status(200).json({ authUrl });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const fyersCallback = async (req: Request, res: Response) => {
  const { auth_code, state } = req.query;

  if (!auth_code || !state || typeof state !== "string") {
    return res.status(400).send("Missing auth_code or state");
  }

  const decodedState = Buffer.from(state, "base64").toString("utf-8");
  const { broker_id } = JSON.parse(decodedState);

  if (!broker_id) {
    return res.status(400).send("Missing broker_id in state");
  }

  let broker = await BrokerModel.findOne({ _id: broker_id });

  if (!broker) {
    return res.status(400).send("Broker not found");
  }

  try {
    // Get credentials dynamically using broker_id
    const { client_id, secret_key } = broker.credentials as FyersCredentials;

    if (!client_id || !secret_key) {
      return res.status(400).send("Missing client_id or secret_key");
    }

    // Step 1: Exchange auth_code for access_token
    const tokenResponse = await axios.post(
      `${FYERS_BASE_URL}/validate-authcode`,
      {
        grant_type: "authorization_code",
        appIdHash: generateAppIdHash(client_id, secret_key),
        code: auth_code
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    if (!access_token) {
      throw new Error("Failed to retrieve access token");
    }

    // Step 2: Fetch profile
    const profileResponse = await axios.get(`${FYERS_BASE_URL}/profile`, {
      headers: {
        Authorization: `${client_id}:${access_token}`
      }
    });

    const brokerProfile = profileResponse.data.data;
    const fy_id = brokerProfile.fy_id;
    const issuedAt = new Date();

    if (!fy_id) {
      throw new Error("Failed to retrieve fy_id from profile");
    }

    broker.credentials = {
      fy_id,
      access_token,
      refresh_token,
      client_id,
      secret_key
    };
    broker.token_issued_at = issuedAt;
    broker.is_active = true;
    await broker.save();

    return res.redirect(process.env.FRONTEND_URL || "http://localhost:3000");
  } catch (error) {
    console.error("Callback error:", error);
    res.status(500).json({ error: "Failed to complete authentication" });
  }
};
