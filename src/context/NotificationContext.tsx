import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { getNotifications } from "../api/notifications";
import { getToken } from "../utils/storage";
import { registerForPushNotificationsAsync } from "../utils/pushNotifications";

interface NotificationContextValue {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  refreshUnreadCount: async () => {},
});

export const useNotificationContext = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const receivedListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await getNotifications();
      if (res?.success) {
        setUnreadCount(res.unreadCount ?? 0);
      }
    } catch {
      // Silent — the bell icon just won't show an updated badge this cycle.
    }
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) return;
      // Registers/refreshes this device's push token with the backend, and
      // fetches the current unread count for the bell badge.
      await registerForPushNotificationsAsync();
      await refreshUnreadCount();
    })();

    // A push notification arrived while the app was in the foreground —
    // refresh the badge so it's accurate without waiting for a manual pull.
    receivedListener.current = Notifications.addNotificationReceivedListener(() => {
      refreshUnreadCount();
    });

    // The user tapped a notification (from the tray, or a foreground
    // banner) — take them straight to the relevant order if we have one.
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as
        | { orderNumber?: string }
        | undefined;
      if (data?.orderNumber) {
        router.push(`/order/orderDetails?id=${data.orderNumber}`);
      } else {
        router.push("/notifications");
      }
    });

    return () => {
      receivedListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [refreshUnreadCount]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}