import { useEffect } from "react";
import { router, SplashScreen } from "expo-router";
import { getToken } from "../src/utils/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  useEffect(() => {
    async function initialize() {
      try {
        await SplashScreen.preventAutoHideAsync();

        const [hasSelectedLanguage, termsAccepted] = await Promise.all([
          AsyncStorage.getItem("selectedLanguage"),
          AsyncStorage.getItem("termsAccepted"),
        ]);
        const token = await getToken();

        await new Promise((resolve) => setTimeout(resolve, 50));

        if (!hasSelectedLanguage) {
          router.replace("/(onboarding)/language");
        } else if (!termsAccepted) {
          router.replace("/(onboarding)/terms");
        } else if (token) {
          router.replace("/(tabs)/home"); 
        } else {  
          router.replace("/(auth)/email-login");
        }
      } catch (error) {
        router.replace("/(onboarding)/language");
      } finally {
        setTimeout(() => SplashScreen.hideAsync(), 100);
      }
    }

    initialize();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}