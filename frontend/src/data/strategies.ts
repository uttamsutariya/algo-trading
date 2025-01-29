import { Strategy, SymbolType } from "@/types/strategy";

export const mockStrategies: Strategy[] = [
  {
    id: "1",
    name: "NIFTY Momentum Strategy",
    description: "Captures intraday momentum in NIFTY futures",
    status: "running",
    symbol: { name: "NIFTY", _id: "1" },
    symbolType: SymbolType.FUTURE,
    rollOverOn: new Date("2024-04-23"),
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01")
  },
  {
    id: "2",
    name: "BANKNIFTY Options Strategy",
    description: "Weekly options selling strategy for BANKNIFTY",
    status: "stopped",
    symbol: { name: "BANKNIFTY", _id: "2" },
    symbolType: SymbolType.OPTION,
    rollOverOn: new Date("2024-04-17"),
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01")
  },
  {
    id: "3",
    name: "FINNIFTY Scalping Strategy",
    description: "High-frequency scalping strategy for FINNIFTY futures",
    status: "running",
    symbol: { name: "FINNIFTY", _id: "2" },
    symbolType: SymbolType.FUTURE,
    rollOverOn: new Date("2024-04-28"),
    createdAt: new Date("2024-03-05"),
    updatedAt: new Date("2024-03-05")
  },
  {
    id: "4",
    name: "NIFTY Iron Condor",
    description: "Monthly options iron condor strategy for consistent premium collection",
    status: "running",
    symbol: { name: "NIFTY", _id: "1" },
    symbolType: SymbolType.OPTION,

    rollOverOn: new Date("2024-04-20"),
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-10")
  },
  {
    id: "5",
    name: "BANKNIFTY Trend Following",
    description: "Daily trend following strategy using BANKNIFTY futures",
    status: "stopped",
    symbol: { name: "BANKNIFTY", _id: "2" },
    symbolType: SymbolType.FUTURE,

    rollOverOn: new Date("2024-04-16"),
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-15")
  },
  {
    id: "6",
    name: "FINNIFTY Options Strangle",
    description: "Weekly options strangle strategy for FINNIFTY",
    status: "running",
    symbol: { name: "FINNIFTY", _id: "2" },
    symbolType: SymbolType.OPTION,
    rollOverOn: new Date("2024-04-29"),
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date("2024-03-20")
  },
  {
    id: "7",
    name: "NIFTY Mean Reversion",
    description: "Intraday mean reversion strategy for NIFTY",
    status: "stopped",
    symbol: { name: "NIFTY", _id: "1" },
    symbolType: SymbolType.FUTURE,
    rollOverOn: new Date("2024-04-24"),
    createdAt: new Date("2024-03-22"),
    updatedAt: new Date("2024-03-22")
  },
  {
    id: "8",
    name: "BANKNIFTY Calendar Spread",
    description: "Options calendar spread strategy for BANKNIFTY",
    status: "running",
    symbol: { name: "BANKNIFTY", _id: "2" },
    symbolType: SymbolType.OPTION,
    rollOverOn: new Date("2024-04-15"),
    createdAt: new Date("2024-03-25"),
    updatedAt: new Date("2024-03-25")
  },
  {
    id: "9",
    name: "FINNIFTY Breakout Strategy",
    description: "Breakout trading strategy for FINNIFTY futures",
    status: "running",
    symbol: { name: "FINNIFTY", _id: "2" },
    symbolType: SymbolType.FUTURE,
    rollOverOn: new Date("2024-04-27"),
    createdAt: new Date("2024-03-27"),
    updatedAt: new Date("2024-03-27")
  },
  {
    id: "10",
    name: "NIFTY Butterfly Strategy",
    description: "Options butterfly spread for NIFTY monthly expiry",
    status: "stopped",
    symbol: { name: "NIFTY", _id: "1" },
    symbolType: SymbolType.OPTION,
    rollOverOn: new Date("2024-04-22"),
    createdAt: new Date("2024-03-30"),
    updatedAt: new Date("2024-03-30")
  }
];
