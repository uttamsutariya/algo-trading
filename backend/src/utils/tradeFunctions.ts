import { FyersBroker } from "../brokersApi/FyersBroker";
import Instrument from "../models/instruments.model";

/**
 * Fetch all open positions for a specific symbol from Fyers
 */
export async function fetchOpenPositions(broker: FyersBroker, symbol: string): Promise<any[]> {
  const positionsResponse = await broker.getOrderBook();

  // If response indicates failure, throw an error
  if (!positionsResponse || positionsResponse.s !== "ok") {
    throw new Error("Failed to fetch open positions from broker");
  }

  // The orderBook is an array of orders, so we filter out orders with status 'OPEN' for the provided symbol
  return positionsResponse.orderBook?.filter((order: any) => order.symbol === symbol && order.status === 2) || [];
}

/**
 * Get the next contract based on the current contract's expiry month for a particular symbol
 */
export async function getNextContract(symbol: string): Promise<any> {
  const expiredSymbol = await Instrument.findOne({ exSymName: symbol });
  if (!expiredSymbol) {
    throw new Error("Expired symbol not found");
  }

  // Extract fixed part of the symbol and expiry month
  const match = expiredSymbol.exSymName.match(/^([A-Z0-9]+)([A-Z]{3})FUT$/);
  if (!match) {
    throw new Error("Invalid symbol format");
  }

  const baseSymbol = match[1]; // Fixed part (e.g., "91DTB25")
  const currentMonth = match[2]; // Current expiry month (e.g., "JAN")

  // Mapping of months for contract rollover
  const monthMap: { [key: string]: string } = {
    JAN: "FEB",
    FEB: "MAR",
    MAR: "APR",
    APR: "MAY",
    MAY: "JUN",
    JUN: "JUL",
    JUL: "AUG",
    AUG: "SEP",
    SEP: "OCT",
    OCT: "NOV",
    NOV: "DEC",
    DEC: "JAN"
  };

  if (!(currentMonth in monthMap)) {
    throw new Error("Invalid month in symbol");
  }

  const nextMonth = monthMap[currentMonth];

  // Find the next contract in the instrument table
  const nextContract = await Instrument.findOne({
    exSymName: `${baseSymbol}${nextMonth}FUT`
  });

  if (!nextContract) {
    throw new Error("Next contract not found in Instrument table");
  }

  return nextContract;
}

/**
 * Close all open positions before rollover for a specific symbol
 */
export async function closeAllPositions(broker: FyersBroker, openPositions: any[], symbol: string): Promise<void> {
  const positionsToClose = openPositions.filter((position) => position.symbol === symbol);

  for (const position of positionsToClose) {
    const closeSide = position.side === "BUY" ? "sell" : "buy"; // Reverse order type
    const closeResponse = await broker.placeOrder({
      symbol: position.symbol,
      qty: position.qty,
      side: closeSide,
      productType: "MARGIN",
      orderTag: "rollover_close"
    });

    if (!closeResponse.success) {
      console.error(`Failed to close position for ${position.symbol}:`, closeResponse.error);
    } else {
      console.log(`Position closed successfully for ${position.symbol}`);
    }
  }
}

/**
 * Open new positions with the new contract after rollover for a specific symbol
 */
export async function openNewPositions(broker: FyersBroker, previousPositions: any[], newSymbol: any): Promise<void> {
  for (const position of previousPositions) {
    const openResponse = await broker.placeOrder({
      symbol: newSymbol.brokerSymbols.fyers,
      qty: position.qty,
      side: position.side,
      productType: "MARGIN",
      orderTag: "rollover_open"
    });

    if (!openResponse.success) {
      console.error(`Failed to open new position for ${newSymbol.exSymName}:`, openResponse.error);
    } else {
      console.log(`New position opened successfully for ${newSymbol.exSymName}`);
    }
  }
}
