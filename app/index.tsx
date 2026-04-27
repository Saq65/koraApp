import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, SplashScreen } from "expo-router";
import { getToken } from "../src/utils/storage";

export default function Index() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // Prevent auto-hide
        await SplashScreen.preventAutoHideAsync();

        const token = await getToken();
        if (token) {
          router.replace("/(tabs)");
        } else {
          router.replace("/(auth)/login");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/(auth)/login");
      } finally {
        setIsReady(true);
        // Hide splash screen after a short delay to ensure the next screen has rendered
        setTimeout(() => {
          SplashScreen.hideAsync();
        }, 100);
      }
    }
    initialize();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}