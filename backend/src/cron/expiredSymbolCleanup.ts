import cron from "node-cron";
import Instrument from "../models/instruments.model";

// Schedule the cron job to run daily at 6 AM
cron.schedule("0 6 * * *", async () => {
  try {
    console.log("Running cron job to delete expired symbols...");

    // Step 1: Get all expired symbols (based on the expiry date)
    const expiredSymbols = await Instrument.find({
      expiryDate: { $lt: new Date() } // Filter symbols with expiry dates in the past
    });

    if (expiredSymbols.length === 0) {
      console.log("No expired symbols found.");
      return; // Exit if no expired symbols are found
    }

    // Step 2: Delete expired symbols from the Instrument table
    const expiredSymbolIds = expiredSymbols.map((symbol) => symbol._id);
    await Instrument.deleteMany({ _id: { $in: expiredSymbolIds } });

    console.log(`Deleted ${expiredSymbols.length} expired symbols from the database.`);
  } catch (error) {
    console.error("Error running cron job to delete expired symbols:", error);
  }
});
