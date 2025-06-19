import { BaseBroker } from "./BaseBroker.js";
import { OrderRequest, OrderResponse } from "../types/broker.types.js";
import axios, { AxiosInstance } from "axios";
import brokerConfig from "../config/broker.config.js";
import { generateAppIdHash } from "../utils/helperFunction.js";
import BrokerModel, { FyersCredentials } from "../models/broker.model.js";

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

export interface OredrBook {
  symbol: string;
  status: number;
  orderId: string;
  qty: number;
}

interface FyersProfileResponse {
  s: string;
  code: number;
  message: string;
  data?: {
    name: string;
    image: string;
    display_name: string;
    email_id: string;
    PAN: string;
    fy_id: string;
    pin_change_date: string;
    mobile_number: string;
    totp: boolean;
    pwd_change_date: string;
    pwd_to_expire: number;
    ddpi_enabled: boolean;
    mtf_enabled: boolean;
  };
}

interface FyersFundsResponse {
  s: string;
  code: number;
  message: string;
  fund_limit: Array<{
    id: number;
    title: string;
    equityAmount: number;
    commodityAmount: number;
  }>;
}

/**
 * FyersBroker class for interacting with Fyers API
 *
 * This class initializes using a broker's _id from the MongoDB database,
 * removing the need to pass appId and accessToken directly to the constructor.
 *
 * @example
 * ```typescript
 * // Method 1: Using static factory method (recommended)
 * const broker = await FyersBroker.create("64a1b2c3d4e5f6789012345a");
 * const orderBook = await broker.getOrderBook();
 *
 * // Method 2: Manual initialization
 * const broker = new FyersBroker("64a1b2c3d4e5f6789012345a");
 * await broker.initialize();
 * const orderBook = await broker.getOrderBook();
 *
 * // Place an order
 * const orderResult = await broker.placeOrder({
 *   symbol: "NSE:SBIN-EQ",
 *   qty: 10,
 *   side: "buy",
 *   validity: "DAY"
 * });
 *
 * // Refresh access token
 * const newToken = await broker.getNewToken();
 * ```
 */
export class FyersBroker extends BaseBroker {
  private readonly baseUrl = brokerConfig.fyers.apiBaseUrl;
  private readonly brokerId: string;
  private isInitialized = false;

  // These will be set during initialization
  private appId!: string;
  private accessToken!: string;
  private appIdHash!: string;
  private authToken!: string;
  private axiosInstance!: AxiosInstance;
  private brokerData!: FyersCredentials;

  constructor(brokerId: string) {
    super();
    if (!brokerId) {
      throw new Error("Broker ID is required");
    }
    this.brokerId = brokerId;
  }

  public async initialize(): Promise<void> {
    try {
      // Fetch broker data from database
      const broker = await BrokerModel.findById(this.brokerId);
      if (!broker) {
        throw new Error(`Broker with ID ${this.brokerId} not found`);
      }

      if (broker.broker_name !== "fyers") {
        throw new Error(`Invalid broker type: ${broker.broker_name}. Expected 'fyers'`);
      }

      if (!broker.is_active) {
        throw new Error("Broker is not active");
      }

      // Cast credentials to FyersCredentials
      this.brokerData = broker.credentials as FyersCredentials;

      // Validate required credentials
      if (!this.brokerData.client_id || !this.brokerData.access_token) {
        throw new Error("Missing required Fyers credentials: client_id or access_token");
      }

      // Set properties
      this.appId = this.brokerData.client_id;
      this.accessToken = this.brokerData.access_token;
      this.authToken = `${this.appId}:${this.accessToken}`;
      this.appIdHash = generateAppIdHash(this.appId, "L61G56ATOR");

      console.log("appIdHash", this.appIdHash);

      // Create axios instance with default config
      this.axiosInstance = axios.create({
        baseURL: this.baseUrl,
        headers: {
          Authorization: this.authToken,
          "Content-Type": "application/json"
        }
      });

      // Validate credentials by fetching profile
      const response = await this.axiosInstance.get<FyersProfileResponse>("/profile");
      if (response.data.s !== "ok") {
        throw new Error(`Failed to initialize: ${response.data.message}`);
      }

      this.isInitialized = true;
      console.log("FyersBroker initialized successfully");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to initialize Fyers broker: ${error.response?.data?.message || error.message}`);
      }
      throw new Error(`Failed to initialize Fyers broker: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error("Broker not initialized. Call initialize() first.");
    }
  }

  public async getOrderBook(): Promise<OredrBook[]> {
    this.ensureInitialized();

    try {
      const response = await this.axiosInstance.get<FyersOrderResponse>("/orders");

      if (response.data.s === "ok") {
        return response.data.orderBook || [];
      } else {
        console.error("Error fetching orders:", response.data.message);
        return [];
      }
    } catch (error) {
      console.error("Error fetching order book from Fyers:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch order book: ${error.response?.data?.message || error.message}`);
      }
      throw new Error("Failed to fetch order book from Fyers API");
    }
  }

  public async placeOrder(request: OrderRequest): Promise<OrderResponse> {
    this.ensureInitialized();

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

  public async getNewToken(refresh_token?: string): Promise<string> {
    this.ensureInitialized();

    console.log("getting new access token");

    // Use the stored refresh token if not provided
    const refreshToken = refresh_token || this.brokerData.refresh_token;
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(`${brokerConfig.fyers.apiBaseUrl}/validate-refresh-token`, {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      appIdHash: this.appIdHash,
      pin: "5555"
    });

    if (!response.data.access_token) {
      throw new Error(`Failed to refresh token for appId: ${this.appId}`);
    }

    const newAccessToken = response.data.access_token;

    // Update the database with the new access token
    try {
      await BrokerModel.findByIdAndUpdate(this.brokerId, {
        $set: {
          "credentials.access_token": newAccessToken,
          token_issued_at: new Date()
        }
      });

      // Update instance properties
      this.accessToken = newAccessToken;
      this.brokerData.access_token = newAccessToken;
      this.authToken = `${this.appId}:${this.accessToken}`;

      // Update axios instance headers
      this.axiosInstance.defaults.headers["Authorization"] = this.authToken;

      console.log("Access token refreshed and updated successfully");
    } catch (error) {
      console.error("Failed to update access token in database:", error);
      throw new Error("Failed to update access token in database");
    }

    return newAccessToken;
  }

  public async getFunds(): Promise<any> {
    this.ensureInitialized();
    const response = await this.axiosInstance.get<FyersFundsResponse>("/funds");
    return response.data;
  }

  public async getProfile(): Promise<any> {
    this.ensureInitialized();
    const response = await this.axiosInstance.get<FyersProfileResponse>("/profile");
    return response.data;
  }

  // Helper methods
  public getBrokerId(): string {
    return this.brokerId;
  }

  public getAppId(): string {
    this.ensureInitialized();
    return this.appId;
  }

  public getBrokerCredentials(): FyersCredentials {
    this.ensureInitialized();
    return this.brokerData;
  }

  public getInitializationStatus(): boolean {
    return this.isInitialized;
  }

  // Static factory method for easier initialization
  public static async create(brokerId: string): Promise<FyersBroker> {
    const broker = new FyersBroker(brokerId);
    await broker.initialize();
    return broker;
  }

  private mapToFyersRequest(request: OrderRequest): Record<string, any> {
    return {
      symbol: request.symbol,
      qty: request.qty,
      type: 2, // Market order
      side: request.side === "buy" ? 1 : -1,
      productType: "MARGIN",
      limitPrice: 0,
      stopPrice: 0,
      validity: request.validity || "DAY",
      disclosedQty: 0,
      offlineOrder: false,
      stopLoss: 0,
      takeProfit: 0
    };
  }
}
