import { OrderRequest, OrderResponse } from "../types/broker.types";

export abstract class BaseBroker {
  abstract placeOrder(request: OrderRequest): Promise<OrderResponse>;
  abstract initialize(): Promise<void>;
}
