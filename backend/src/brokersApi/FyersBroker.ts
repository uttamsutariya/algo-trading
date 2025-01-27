import { BaseBroker } from "./BaseBroker";
import { OrderRequest, OrderResponse, BrokerConfig } from "../types/broker.types";
import axios from "axios";

interface FyersOrderResponse {
  s: string;
  code: number;
  message: string;
  id?: string;
}

export class FyersBroker extends BaseBroker {
  private static instance: FyersBroker;
  private config: BrokerConfig;
  private readonly baseUrl = "https://api-t1.fyers.in/api/v3";
  private authToken: string;

  private constructor(config: BrokerConfig) {
    super();
    this.config = config;
    this.authToken = `${config.appId}:${config.accessToken}`;
  }

  public static getInstance(config: BrokerConfig): FyersBroker {
    if (!FyersBroker.instance) {
      FyersBroker.instance = new FyersBroker(config);
    }
    return FyersBroker.instance;
  }

  public async initialize(): Promise<void> {
    // Validate config
    if (!this.config.appId || !this.config.accessToken) {
      throw new Error("Missing Fyers credentials");
    }
  }

  public async placeOrder(request: OrderRequest): Promise<OrderResponse> {
    try {
      const response = await axios.post<FyersOrderResponse>(
        `${this.baseUrl}/orders/sync`,
        this.mapToFyersRequest(request),
        {
          headers: {
            Authorization: this.authToken,
            "Content-Type": "application/json"
          }
        }
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
      if (axios.isAxiosError(error) && error.response?.data) {
        return {
          success: false,
          message: "Order placement failed",
          error: error.response.data.message || error.message
        };
      }
      return {
        success: false,
        message: "Order placement failed",
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
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
