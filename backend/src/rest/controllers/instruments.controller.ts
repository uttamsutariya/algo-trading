import { Request, Response } from "express";
import Instrument from "../../models/instruments.model.js";
import { triggerManualUpdate } from "../../cron/instrumentsUpdate.js";

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

// Add new controller to manually trigger instruments update
export const updateInstruments = async (req: Request, res: Response) => {
  try {
    await triggerManualUpdate();
    return res.status(200).json({ message: "Instruments update triggered successfully" });
  } catch (error) {
    console.error("Error triggering instruments update:", error);
    return res.status(500).json({ message: "Failed to trigger instruments update", error: String(error) });
  }
};
