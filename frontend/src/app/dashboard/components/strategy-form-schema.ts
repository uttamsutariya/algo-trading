import * as z from "zod";
import { Symbol, SymbolType } from "@/types/strategy";

export const strategyFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  symbol: z.nativeEnum(Symbol),
  symbolType: z.nativeEnum(SymbolType),
  nextExpiry: z.date(),
  rollOverStatus: z.enum(["enabled", "disabled"]),
  rollOverOn: z.date(),
  rollOverBeforeDays: z.number().min(1).max(10)
});

export type StrategyFormValues = z.infer<typeof strategyFormSchema>;
