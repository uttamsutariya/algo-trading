import { Broker } from "@/lib/api/broker";

export enum SymbolType {
  FUTURE = "Future",
  OPTION = "Option"
}

export interface Strategy {
  _id: string;
  name: string;
  description: string;
  status: "running" | "stopped";
  symbol: {
    brokerSymbols: {
      fyers: string;
    };
    _id: string;
    exToken: string;
    createdAt: string;
    exSymName: string;
    exchange: string;
    expiry: string;
    instrumentType: string;
    underlying: string;
    updatedAt: string;
  };
  rollOverOn: Date | null;
  createdAt: string;
  updatedAt: string;
  broker: Broker;
}
