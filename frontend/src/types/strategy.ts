export enum SymbolType {
  FUTURE = "Future",
  OPTION = "Option"
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  status: "running" | "stopped";
  symbol: { name: string; _id: string };
  rollOverOn: Date | undefined;
  createdAt: Date;
  updatedAt: Date;
}
