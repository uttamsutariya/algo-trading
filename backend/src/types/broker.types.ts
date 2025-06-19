export interface OrderRequest {
  symbol: string;
  qty: number;
  side: "buy" | "sell";
  limitPrice?: number;
  stopPrice?: number;
  validity?: string;
}

export interface OrderResponse {
  success: boolean;
  orderId?: string;
  message: string;
  error?: string;
}

export interface BrokerConfig {
  appId: string;
  accessToken: string;
  redirectUrl: string;
}
