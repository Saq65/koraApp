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

  pickupDay: string;    // "2026-06-28"
  timeSlot: string;
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

// Cancel order via the dedicated, policy-enforced endpoint (Terms §8.1–8.5).
// Handles the free-cancellation window, late fee, and refund automatically
// server-side — response includes a breakdown you can show the user.
export const cancelOrder = async (orderId: string) => {
  const token = await getToken();
  return apiClient(
    `/orders/${orderId}/cancel`,
    "POST",
    undefined,
    token || undefined
  );
};