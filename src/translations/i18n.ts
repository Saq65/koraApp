import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";
import gu from "./locales/gu.json";

const initI18n = async () => {
  const savedLang =
    (await AsyncStorage.getItem("app-language")) ||
    (await AsyncStorage.getItem("selectedLanguage"));

  i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
      gu: { translation: gu },
    },
    lng: savedLang || "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
};

initI18n();

export const loadLanguage = async (lang: string) => {
  if (!lang) {
    console.warn("[i18n] loadLanguage called with undefined/null, skipping.");
    return;
  }
  await AsyncStorage.setItem("app-language", lang);
  await AsyncStorage.setItem("selectedLanguage", lang);
  await i18n.changeLanguage(lang);
};

export default i18n;