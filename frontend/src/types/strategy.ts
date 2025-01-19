export enum SymbolType {
  FUTURE = "Future",
  OPTION = "Option"
}

export enum Symbol {
  NIFTY = "NIFTY",
  BANKNIFTY = "BANKNIFTY",
  FINNIFTY = "FINNIFTY"
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  status: "running" | "stopped";
  symbol: Symbol;
  symbolType: SymbolType;
  nextExpiry: Date;
  rollOverStatus: "enabled" | "disabled";
  rollOverOn: Date;
  rollOverBeforeDays: number;
  createdAt: Date;
  updatedAt: Date;
}
