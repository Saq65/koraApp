import { Stack } from "expo-router";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/src/redux/store/store";
import i18n from "../src/translations/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NotificationProvider } from "../src/context/NotificationContext";

export default function RootLayout() {
  useEffect(() => {
    const restoreLanguage = async () => {
      const saved = await AsyncStorage.getItem("app-language");
      if (saved) await i18n.changeLanguage(saved);
    };
    restoreLanguage();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <NotificationProvider>
            <Stack
              screenOptions={{ headerShown: false }}
              initialRouteName="index"
            />
          </NotificationProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}