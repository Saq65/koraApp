import { Stack } from "expo-router";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../src/translations/i18n";

import AsyncStorage from "@react-native-async-storage/async-storage";
// import "../src/translations/i18n";
import { loadLanguage } from "../src/translations/i18n";
import { useEffect } from "react";
import i18n from "../src/translations/i18n";
export default function RootLayout() {
useEffect(() => {
  loadLanguage();
}, []);

  useEffect(() => {
    const loadLanguage = async () => {
      const savedLanguage = await AsyncStorage.getItem("selectedLanguage");

      if (savedLanguage) {
        i18n.changeLanguage(savedLanguage);
      }
    };

    loadLanguage();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack
          screenOptions={{ headerShown: false }}
          initialRouteName="index"
        />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}