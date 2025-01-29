import { create } from "zustand";
import { Strategy } from "@/types/strategy";
import { mockStrategies } from "@/data/strategies";

type StatusFilter = "all" | "running" | "stopped";

interface StrategyState {
  strategies: Strategy[];
  searchQuery: string;
  statusFilter: StatusFilter;
  addStrategy: (strategy: Omit<Strategy, "id" | "createdAt" | "updatedAt">) => void;
  updateStrategy: (id: string, strategy: Partial<Strategy>) => void;
  deleteStrategy: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: StatusFilter) => void;
}

export const useStrategyStore = create<StrategyState>((set: any) => ({
  strategies: mockStrategies,
  searchQuery: "",
  statusFilter: "all" as StatusFilter,

  addStrategy: (strategy: Omit<Strategy, "id" | "createdAt" | "updatedAt">) =>
    set((state: StrategyState) => ({
      strategies: [
        ...state.strategies,
        {
          ...strategy,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    })),

  updateStrategy: (id: string, updatedStrategy: Partial<Strategy>) =>
    set((state: StrategyState) => ({
      strategies: state.strategies.map((strategy: Strategy) =>
        strategy._id === id ? { ...strategy, ...updatedStrategy, updatedAt: new Date() } : strategy
      )
    })),

  deleteStrategy: (id: string) =>
    set((state: StrategyState) => ({
      strategies: state.strategies.filter((strategy: Strategy) => strategy._id !== id)
    })),

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setStatusFilter: (status: StatusFilter) => set({ statusFilter: status })
}));
