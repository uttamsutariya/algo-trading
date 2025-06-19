import { OrderRequest, OrderResponse } from "../types/broker.types.js";

export abstract class BaseBroker {
  abstract placeOrder(request: OrderRequest): Promise<OrderResponse>;
  abstract initialize(): Promise<void>;
  abstract getProfile(): Promise<any>;
  abstract getFunds(): Promise<any>;
}
