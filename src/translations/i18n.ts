import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from './locales/mr.json';
import gu from "./locales/gu.json";
// import bn from "./locales/bn.json";

const LANGUAGE_KEY = "APP_LANGUAGE";

const resources = {
  en: {
    translation: en,
  },
  hi: {
    translation: hi,
  },
  mr: {
    translation: mr,
  },
  gu: {
    translation: gu,
  },
};

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  resources,
  lng: "en",
  fallbackLng: "en",

  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = async (lang: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
};

export const loadLanguage = async () => {
  try {
    const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);

    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  } catch (error) {
    console.log("Language Load Error", error);
  }
};

export default i18n;