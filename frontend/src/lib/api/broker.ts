import axiosClient from "../axios";

export interface Broker {
  _id: string;
  broker_name: string;
  is_active: boolean;
  credentials: {
    client_id: string;
    secret_key: string;
    fy_id?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BrokersResponse {
  message: string;
  brokers: Broker[];
}

export interface CreateBrokerPayload {
  client_id: string;
  secret_key: string;
}

export const brokerApi = {
  getBrokers: async (): Promise<BrokersResponse> => {
    try {
      const response = await axiosClient.get("/view/brokers");
      return response.data;
    } catch (error) {
      console.error("Error fetching brokers:", error);
      throw error;
    }
  },

  createBroker: async (payload: CreateBrokerPayload) => {
    try {
      const response = await axiosClient.post("/add/brokers", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating broker:", error);
      throw error;
    }
  },

  loginBroker: async (brokerId: string) => {
    try {
      const response = await axiosClient.post("/fyresAuth/login", { broker_id: brokerId });
      return response.data;
    } catch (error) {
      console.error("Error logging in broker:", error);
      throw error;
    }
  }
};
