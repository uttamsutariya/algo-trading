import { BaseBroker } from "./BaseBroker";
import { OrderRequest, OrderResponse } from "../types/broker.types";
import axios, { AxiosInstance } from "axios";
import brokerConfig from "../config/broker.config";

interface FyersOrderResponse {
  s: string; // Status: "ok" for success, "error" for failure
  code: number; // Error code (if any)
  message: string; // Response message
  id?: string; // Optional: A unique identifier for the request
  orderBook: Array<{
    symbol: string;
    status: number;
    orderId: string;
    qty: number;
  }>;
}

interface FyersProfileResponse {
  s: string;
  code: number;
  message: string;
  data?: {
    name: string;
    email: string;
  };
}

export class FyersBroker extends BaseBroker {
  private readonly baseUrl = brokerConfig.fyers.apiBaseUrl;

  // appId is the client_id that we store in the database
  private readonly appId: string;
  private readonly accessToken: string;

  // authToken is the client_id:access_token
  private readonly authToken: string;
  private readonly axiosInstance: AxiosInstance;

  constructor(appId: string, accessToken: string) {
    super();
    if (!appId || !accessToken) {
      throw new Error("App ID and Access Token are required");
    }
    this.appId = appId;
    this.accessToken = accessToken;
    this.authToken = `${appId}:${accessToken}`;

    // Create axios instance with default config
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: this.authToken,
        "Content-Type": "application/json"
      }
    });
  }

  public async initialize(): Promise<void> {
    try {
      // Validate credentials by fetching profile
      const response = await this.axiosInstance.get<FyersProfileResponse>("/profile");
      if (response.data.s !== "ok") {
        throw new Error(`Failed to initialize: ${response.data.message}`);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to initialize Fyers broker: ${error.response?.data?.message || error.message}`);
      }
      throw new Error("Failed to initialize Fyers broker: Unknown error");
    }
  }

  public async getOrderBook(): Promise<FyersOrderResponse> {
    try {
      const response = await this.axiosInstance.get<FyersOrderResponse>("/orders");

      if (response.data.s === "ok") {
        return response.data;
      } else {
        console.error("Error fetching orders:", response.data.message);
        return {
          s: "error",
          code: response.data.code || 400,
          message: response.data.message,
          orderBook: []
        };
      }
    } catch (error) {
      console.error("Error fetching orders from Fyers:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch orders: ${error.response?.data?.message || error.message}`);
      }
      throw new Error("Failed to fetch orders from Fyers API");
    }
  }

  public async placeOrder(request: OrderRequest): Promise<OrderResponse> {
    try {
      const response = await this.axiosInstance.post<FyersOrderResponse>(
        "/orders/sync",
        this.mapToFyersRequest(request)
      );

      const { data } = response;

      if (data.s === "ok") {
        return {
          success: true,
          orderId: data.id,
          message: data.message
        };
      }

      return {
        success: false,
        message: data.message,
        error: `Order failed with code: ${data.code}`
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          message: "Order placement failed",
          error: error.response?.data?.message || error.message
        };
      }
      return {
        success: false,
        message: "Order placement failed",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }

  public async getNewToken(refresh_token: string): Promise<string> {
    const response = await this.axiosInstance.post("/token", {
      grant_type: "refresh_token",
      refresh_token
    });
    if (!response.data.access_token) {
      console.error(`Failed to refresh token for appId: ${this.appId}`);
      throw new Error(`Failed to refresh token for appId: ${this.appId}`);
    }

    return response.data.access_token;
  }

  private mapToFyersRequest(request: OrderRequest): Record<string, any> {
    return {
      symbol: request.symbol,
      qty: request.qty,
      type: 2, // Market order
      side: request.side === "buy" ? 1 : -1,
      productType: request.productType || "INTRADAY",
      limitPrice: request.limitPrice || 0,
      stopPrice: request.stopPrice || 0,
      validity: request.validity || "DAY",
      disclosedQty: 0,
      offlineOrder: false,
      stopLoss: 0,
      takeProfit: 0,
      orderTag: request.orderTag || "algo_trade"
    };
  }
}
