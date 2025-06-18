import { create } from "zustand";
import { Broker } from "@/lib/api/broker";

interface BrokerState {
  brokers: Broker[];
  loading: boolean;
  error: string | null;
  setBrokers: (brokers: Broker[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addBroker: (broker: Broker) => void;
  updateBroker: (id: string, updatedBroker: Partial<Broker>) => void;
  getActiveBrokers: () => Broker[];
}

export const useBrokerStore = create<BrokerState>((set, get) => ({
  brokers: [],
  loading: false,
  error: null,

  setBrokers: (brokers: Broker[]) => set({ brokers }),

  setLoading: (loading: boolean) => set({ loading }),

  setError: (error: string | null) => set({ error }),

  addBroker: (broker: Broker) =>
    set((state) => ({
      brokers: [...state.brokers, broker]
    })),

  updateBroker: (id: string, updatedBroker: Partial<Broker>) =>
    set((state) => ({
      brokers: state.brokers.map((broker) => (broker._id === id ? { ...broker, ...updatedBroker } : broker))
    })),

  getActiveBrokers: () => get().brokers.filter((broker) => broker.is_active)
}));
