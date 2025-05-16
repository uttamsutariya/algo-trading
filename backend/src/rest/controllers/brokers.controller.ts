import { Request, Response } from "express";

import BrokerModel, { FyersCredentials, IBroker } from "../../models/broker.model";
import { BrokerCredentials } from "../../models/broker.model";

// add brokers

export const addBroker = async (req: Request, res: Response) => {
  try {
    const { name, client_id, secret_key } = req.body;

    if (!name || !client_id || !secret_key) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if broker already exists
    const existingBroker = await BrokerModel.findOne({ "credentials.client_id": client_id });
    if (existingBroker) {
      return res.status(409).json({ error: "Broker with this client ID already exists" });
    }

    // Create new broker
    const newBroker = new BrokerModel({
      broker_name: name,
      is_active: true,
      credentials: {
        client_id: client_id,
        secret_key: secret_key
      }
    });
    await newBroker.save();

    res.status(201).json({ message: "Broker added successfully", newBroker });
  } catch (error) {
    console.error("Error adding broker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//update broker

export const updateBroker = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, client_id, secret_key } = req.body;

    const existingBroker = await BrokerModel.findById(id);
    if (!existingBroker) {
      return res.status(404).json({ error: "Broker not found" });
    }

    const credentialsUpdate: Partial<FyersCredentials> = {};
    if (client_id) credentialsUpdate.client_id = client_id;
    if (secret_key) credentialsUpdate.secret_key = secret_key;

    const updatedBroker = await BrokerModel.findByIdAndUpdate(
      id,
      {
        broker_name: name,
        credentials: credentialsUpdate
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ message: "Broker updated successfully", broker: updatedBroker });
  } catch (error) {
    console.error("Error updating broker:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//view all brokers

export const viewAllFyersBrokers = async (req: Request, res: Response) => {
  try {
    // Fetch only Fyers brokers
    const brokers: IBroker[] = await BrokerModel.find({ broker_name: "fyers" });

    if (!brokers || brokers.length === 0) {
      return res.status(404).json({ message: "No Fyers brokers found." });
    }

    res.status(200).json({
      message: "Fyers brokers fetched successfully",
      brokers
    });
  } catch (error) {
    console.error("Error fetching brokers:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
