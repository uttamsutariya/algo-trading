import cron from "node-cron";
import axios from "axios";
import Instrument from "../models/instruments.model";

const FYERS = {
  NSE_CURRENT_DERIVATIVES_URL: "https://public.fyers.in/sym_details/NSE_CD_sym_master.json",
  NSE_EQUITY_DERIVATIVES_URL: "https://public.fyers.in/sym_details/NSE_FO_sym_master.json",
  NSE_COMMODITY_URL: "https://public.fyers.in/sym_details/NSE_COM_sym_master.json",
  BSE_EQUITY_DERIVATIVES_URL: "https://public.fyers.in/sym_details/BSE_FO_sym_master.json",
  MCX_COMMODITY_URL: "https://public.fyers.in/sym_details/MCX_COM_sym_master.json"
} as const;

interface FyersInstrument {
  fyToken: string;
  exToken: number;
  exSymbol: string;
  exSymName: string;
  exchange: number;
  symTicker: string;
  underSym: string;
  expiryDate: string;
  symDetails: string;
}

const exchangeMap: { [key: number]: string } = {
  10: "NSE",
  11: "MCX",
  12: "BSE"
};

async function cleanupExpiredInstruments() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const result = await Instrument.deleteMany({
      expiry: { $lt: today }
    });
    console.log(`Cleaned up ${result.deletedCount} expired instruments`);
  } catch (error) {
    console.error("Error cleaning up expired instruments:", error);
  }
}

async function fetchAndProcessUrl(urlName: keyof typeof FYERS) {
  const url = FYERS[urlName];
  console.log(`Processing ${urlName} : ${url} ...`);

  try {
    const response = await axios.get(url);
    const instruments: Record<string, FyersInstrument> = response.data;
    let processedCount = 0;
    let futuresCount = 0;

    for (const [symTicker, instrument] of Object.entries(instruments)) {
      if (!isFuture(symTicker)) continue;
      futuresCount++;

      try {
        const instrumentDoc = {
          brokerSymbols: {
            fyers: symTicker
          },
          underlying: instrument.underSym,
          expiry: convertEpochToIST(instrument.expiryDate),
          exToken: instrument.exToken.toString(),
          exchange: exchangeMap[instrument.exchange],
          exSymName: instrument.exSymName
        };

        await Instrument.findOneAndUpdate({ exToken: instrument.exToken.toString() }, instrumentDoc, {
          upsert: true,
          new: true
        });
        processedCount++;
      } catch (error) {
        console.error(`Error processing instrument ${symTicker} (exToken: ${instrument.exToken}):`, error);
      }
    }

    console.log(`${urlName} processing completed:`);
    console.log(`- Total instruments: ${Object.keys(instruments).length}`);
    console.log(`- Futures found: ${futuresCount}`);
    console.log(`- Successfully processed: ${processedCount}`);
  } catch (error) {
    console.error(`Error processing ${urlName}:`, error);
  }
}

function isFuture(symTicker: string): boolean {
  return symTicker.endsWith("FUT");
}

function convertEpochToIST(epoch: string): Date {
  return new Date(parseInt(epoch) * 1000);
}

async function main() {
  console.log("Starting instruments update...");
  const startTime = Date.now();

  try {
    // First cleanup expired instruments
    await cleanupExpiredInstruments();

    // Then process each URL sequentially
    for (const urlName of Object.keys(FYERS) as Array<keyof typeof FYERS>) {
      await fetchAndProcessUrl(urlName);
    }

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Instruments update completed in ${duration.toFixed(2)} seconds`);
  } catch (error) {
    console.error("Error in main execution:", error);
    throw error;
  }
}

// Run daily at 8:00 AM IST (2:30 AM UTC)
cron.schedule("30 2 * * *", async () => {
  try {
    await main();
  } catch (error) {
    console.error("Error in daily symbol update:", error);
  }
});
