import { Request, Response } from "express";
import Instrument from "../../models/instruments.model";
import BrokerModel, { IBroker } from "../../models/broker.model";

//view all instruments

export const viewAllInstruments = async (req: Request, res: Response) => {
  try {
    const instruments = await Instrument.find();

    // Group instruments by underlying and exchange
    const groupedInstruments = instruments.reduce((acc, instrument) => {
      const underlying = instrument.underlying || "Other";
      const exchange = instrument.exchange || "Other";

      if (!acc[underlying]) {
        acc[underlying] = {};
      }
      if (!acc[underlying][exchange]) {
        acc[underlying][exchange] = [];
      }
      acc[underlying][exchange].push(instrument);
      return acc;
    }, {} as Record<string, Record<string, typeof instruments>>);

    return res.status(200).json(groupedInstruments);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

//view all brokers

export const getFyersBrokers = async (req: Request, res: Response) => {
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
