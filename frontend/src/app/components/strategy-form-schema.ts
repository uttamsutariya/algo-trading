import * as z from "zod";
import { SymbolType } from "@/types/strategy";

export const strategyFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  symbol: z.object({
    name: z.string(),
    _id: z.string(),
    brokerSymbols: z.object({
      fyers: z.string()
    }),
    underlying: z.string(),
    exchange: z.string()
  }),
  rollOverOn: z.date().optional(),
  broker: z.string().min(1, "Broker is required")
});

export type StrategyFormValues = z.infer<typeof strategyFormSchema>;
