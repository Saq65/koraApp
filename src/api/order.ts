import { apiClient } from "./client";
import { getToken } from "../utils/storage";

export interface OrderPayload {
items: {
    serviceId: string;
    categoryName: string;
    subCategoryName: string;
    quantity: number;
  }[];

  pickupAddress: {
    address: string;
    coordinates?: number[];
  };

  deliveryAddress: {
    address: string;
    coordinates?: number[];
  };

  paymentMethod: "cash" | "upi" | "card";
}

export const getActiveOrder = async () => {
  const token = await getToken();

  return apiClient(
    "/orders/active",
    "GET",
    undefined,
    token || undefined
  );
};

export const getRecentOrders = async () => {
  const token = await getToken();

  return apiClient(
    "/orders/recent",
    "GET",
    undefined,
    token || undefined
  );
};

export const createOrder = async (
  payload: OrderPayload
) => {
  const token = await getToken();

  return apiClient(
    "/orders",
    "POST",
    payload,
    token || undefined
  );
};
export const getOrderHistory = async () => {
  const token = await getToken();
  return apiClient("/orders/history", "GET", undefined, token || undefined);
};

export const getOrderDetails = async (orderId: string) => {
  const token = await getToken();
  return apiClient(`/orders/${orderId}`, "GET", undefined, token || undefined);
};


export const cancelOrder = async (orderId: string) => {
  const token = await getToken();
  return apiClient(
    `/orders/${orderId}/status`,
    "PUT",
    { status: "cancelled" },
    token || undefined
  );
};