import { useQuery } from "@tanstack/react-query";
import axiosClient from "@/lib/axios";

interface BrokerSymbols {
  fyers: string;
}

export interface Instrument {
  _id: string;
  brokerSymbols: BrokerSymbols;
  exToken: string;
  createdAt: string;
  exSymName: string;
  exchange: string;
  expiry: string;
  instrumentType: string;
  underlying: string;
  updatedAt: string;
}

interface Exchange {
  NSE?: Instrument[];
  BSE?: Instrument[];
  MCX?: Instrument[];
}

interface InstrumentsResponse {
  [key: string]: Exchange;
}

export function useInstruments() {
  return useQuery({
    queryKey: ["instruments"],
    queryFn: async () => {
      const response = await axiosClient.get<InstrumentsResponse>("/instruments");
      return response.data;
    }
  });
}
