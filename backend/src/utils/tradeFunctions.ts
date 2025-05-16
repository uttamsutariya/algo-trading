import { mongo } from "mongoose";
import { FyersBroker } from "../brokersApi/FyersBroker";
import Instrument from "../models/instruments.model";
import Strategy from "../models/strategy.model";
import mongoose from "mongoose";

/**
/**
 * Fetch open positions for a given strategy's symbol
 */
export async function getOpenOrders(broker: FyersBroker, strategyId: string) {
  try {
    // 1. Find the strategy
    const strategy = await Strategy.findById(strategyId);
    if (!strategy) {
      console.log(`Strategy with ID ${strategyId} not found.`);
      return [];
    }

    // 2. Find the instrument (symbol object) from strategy
    const symbolObject = await Instrument.findById(strategy.symbol);
    if (!symbolObject) {
      console.log(`Symbol Object ID ${strategy.symbol} not found in Instrument table.`);
      return [];
    }

    // ✅ Ensure brokerSymbols and fyres exist
    if (!symbolObject.brokerSymbols || !symbolObject.brokerSymbols.fyers) {
      return [];
    }

    const fyresSymbol = symbolObject.brokerSymbols.fyers;

    // 3. Fetch all open orders from the external order book API
    const response = await broker.getOrderBook(); // Replace with actual API
    if (response.s !== "ok") {
      console.error("Error fetching order book:", response.message);
      return [];
    }

    const openPositions = response.orderBook; // Extract order book from API response

    // 4. Filter open positions based on brokerSymbols.fyres match
    const filteredPositions = openPositions?.filter((position: any) => {
      if (!position.symbol) return false;

      // Compare `orderBook[].symbol` with `brokerSymbols.fyres`
      return position.symbol === fyresSymbol;
    });

    console.log(`Filtered ${filteredPositions.length} positions matching brokerSymbols.fyres: ${fyresSymbol}`);

    return filteredPositions;
  } catch (error) {
    console.error("Error in getOpenOrders:", error);
    return [];
  }
}

/**
 * Close all open positions before rollover for a specific symbol
 */
export async function closeAllPositions(broker: FyersBroker, openPositions: any[], strategyId: string): Promise<void> {
  // 1. Fetch the correct symbol from the Instrument table using strategyId
  const strategy = await Strategy.findById(strategyId);
  if (!strategy) {
    console.error(`Strategy with ID ${strategyId} not found.`);
    return;
  }

  const symbolObject = await Instrument.findById(strategy.symbol);

  if (!symbolObject || !symbolObject.brokerSymbols || !symbolObject.brokerSymbols.fyers) {
    console.error(`Broker symbol (fyres) not found for strategy ID: ${strategyId}`);
    return;
  }

  const fyresSymbol = symbolObject.brokerSymbols.fyers;

  // 2. Filter positions based on brokerSymbols.fyres instead of direct symbol
  const positionsToClose = openPositions.filter((position) => position.symbol === fyresSymbol);
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
 * Get the next contract based on the current contract's expiry month for a particular symbol
 */
export async function findNextContract(
  currentSymbol: mongoose.Types.ObjectId
): Promise<{ nextSymbol: mongoose.Types.ObjectId | null; message: string }> {
  const currentInstrument = await Instrument.findOne({ _id: currentSymbol });

  if (!currentInstrument) {
    return { nextSymbol: null, message: "Current instrument not found" };
  }

  // Find all contracts for the same underlying and exchange
  const availableContracts = await Instrument.find({
    underlying: currentInstrument.underlying,
    exchange: currentInstrument.exchange
  }).sort({ expiry: 1 });

  if (availableContracts.length === 0) {
    return { nextSymbol: null, message: "No contracts available for this instrument" };
  }

  // Get unique expiry months from the contracts
  const uniqueExpiryMonths = [
    ...new Set(
      availableContracts.map((contract) => new Date(contract.expiry).toLocaleString("en-US", { month: "short" }))
    )
  ];
  // Get the next expiry after the current one
  for (let i = 0; i < availableContracts.length - 1; i++) {
    if (availableContracts[i]._id.equals(currentSymbol)) {
      return {
        nextSymbol: availableContracts[i + 1]._id,
        message: `Next contract foun}`
      };
    }
  }
  // If no next contract, return available months
  return {
    nextSymbol: null,
    message: `No next symbol available. Available expiries: ${uniqueExpiryMonths.join(", ")}`
  };
}
/**
 * Open new positions with the new contract after rollover for a specific symbol
 */
export async function openNewPositions(
  broker: FyersBroker,
  previousPositions: any[],
  nextSymbolId: mongoose.Types.ObjectId | null
): Promise<void> {
  // Prevent execution if `nextSymbolId` is null
  if (!nextSymbolId) {
    console.error(` Cannot open new positions: No next contract available.`);
    return;
  }

  // 1. Fetch new contract details from Instrument table
  const newSymbol = await Instrument.findById(nextSymbolId);
  if (!newSymbol || !newSymbol.brokerSymbols || !newSymbol.brokerSymbols.fyers) {
    return;
  }

  const fyresSymbol = newSymbol.brokerSymbols.fyers;

  for (const position of previousPositions) {
    const openResponse = await broker.placeOrder({
      symbol: fyresSymbol,
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

/**
 * Update strategy with the new symbol ID
 */
export const updateStrategySymbol = async (id: string, newSymbolId: mongoose.Types.ObjectId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid strategy ID.");
  }

  const updatedStrategy = await Strategy.findByIdAndUpdate(
    id,
    { symbol: newSymbolId },
    { new: true, runValidators: true }
  );

  if (!updatedStrategy) {
    throw new Error("Strategy not found.");
  }

  return updatedStrategy;
};
