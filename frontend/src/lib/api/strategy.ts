import axiosClient from "../axios";

export const strategyApi = {
  createStrategy: async (strategyData: {
    name: string;
    description: string;
    symbol: {
      name: string;
      _id: string;
    };
    broker: string;
    rollOverOn: Date | undefined;
  }) => {
    try {
      const payload = {
        name: strategyData.name,
        description: strategyData.description,
        symbol: strategyData.symbol._id,
        broker: strategyData.broker,
        rollOverOn: strategyData.rollOverOn
          ? `${strategyData.rollOverOn.getFullYear()}-${String(strategyData.rollOverOn.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(strategyData.rollOverOn.getDate()).padStart(2, "0")}`
          : undefined
      };
      const response = await axiosClient.post("/strategies/create", payload);
      return response.data;
    } catch (error) {
      console.error("Error creating strategy:", error);
      throw error;
    }
  },

  getStrategies: async () => {
    try {
      const response = await axiosClient.get("/strategies/view");
      return response.data;
    } catch (error) {
      console.error("Error fetching strategies:", error);
      throw error;
    }
  },

  getStrategy: async (id: string) => {
    try {
      const response = await axiosClient.get(`/strategies/view/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching strategy with ID ${id}:`, error);
      throw error;
    }
  },

  updateStrategy: async (id: string, strategyData: any) => {
    try {
      const payload = {
        name: strategyData?.name,
        description: strategyData?.description,
        symbol: strategyData?.symbol?._id,
        broker: strategyData?.broker,
        rollOverOn: strategyData?.rollOverOn
          ? `${strategyData.rollOverOn.getFullYear()}-${String(strategyData.rollOverOn.getMonth() + 1).padStart(
              2,
              "0"
            )}-${String(strategyData.rollOverOn.getDate()).padStart(2, "0")}`
          : undefined,
        status: strategyData?.status
      };
      const response = await axiosClient.put(`/strategies/update/${id}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error updating strategy with ID ${id}:`, error);
      throw error;
    }
  },

  deleteStrategy: async (id: string) => {
    try {
      const response = await axiosClient.delete(`/strategies/delete/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting strategy with ID ${id}:`, error);
      throw error;
    }
  }
};
