import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registerPushToken } from "../api/notifications";

// Foreground behavior: show an OS banner + play a sound even while the app
// is open, matching how it behaves when the app is backgrounded/closed.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permission (if not already granted), gets this
 * device's Expo push token, and registers it with the backend against the
 * logged-in customer's account.
 *
 * Safe to call every time the app opens for a logged-in user — it's cheap
 * and keeps the registered token fresh (tokens can rotate).
 *
 * Silently does nothing on a simulator/emulator (push tokens require a
 * physical device) or if the user has denied permission at the OS level.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      // Simulators/emulators can't receive real push notifications.
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      // User denied OS-level permission — nothing more we can do here;
      // the in-app notification history still works regardless.
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const pushToken = tokenResponse.data;

    await registerPushToken(pushToken);

    return pushToken;
  } catch (error) {
    console.log("Push notification registration failed:", error);
    return null;
  }
}