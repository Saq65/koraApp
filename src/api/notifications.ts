import { apiClient } from "./client";
import { getToken } from "../utils/storage";

export interface NotificationItem {
  _id: string;
  title: string;
  body: string;
  type:
    | "order_placed"
    | "order_accepted"
    | "order_picked_up"
    | "order_at_sp"
    | "order_cleaned"
    | "order_out_for_delivery"
    | "order_delivered"
    | "order_cancelled"
    | "admin_broadcast"
    | "general";
  orderId?: string | null;
  orderNumber?: string | null;
  read: boolean;
  createdAt: string;
}

export const getNotifications = async () => {
  const token = await getToken();
  return apiClient("/notifications", "GET", undefined, token || undefined);
};

export const markNotificationRead = async (id: string) => {
  const token = await getToken();
  return apiClient(`/notifications/${id}/read`, "PATCH", undefined, token || undefined);
};

export const markAllNotificationsRead = async () => {
  const token = await getToken();
  return apiClient("/notifications/read-all", "PATCH", undefined, token || undefined);
};

export const registerPushToken = async (pushToken: string) => {
  const token = await getToken();
  return apiClient("/notifications/push-token", "POST", { pushToken }, token || undefined);
};

export const getNotificationPreference = async () => {
  const token = await getToken();
  return apiClient("/notifications/preference", "GET", undefined, token || undefined);
};

export const updateNotificationPreference = async (enabled: boolean) => {
  const token = await getToken();
  return apiClient("/notifications/preference", "PATCH", { enabled }, token || undefined);
};