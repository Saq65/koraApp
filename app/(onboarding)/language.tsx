import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../../src/utils/storage";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/theme/ThemeProvider";
import i18n from "../../src/translations/i18n";
const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "te", label: "Telugu", native: "తెలుగు" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "gu", label: "Gujarati", native: "ગુજરાતી" },
];

export default function LanguageScreen() {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const [selected, setSelected] = useState("en");

  async function handleContinue() {
  await AsyncStorage.setItem("selectedLanguage", selected);

  // change language instantly
  await i18n.changeLanguage(selected);

  router.replace("/(onboarding)/terms");
}

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}> 
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      {/* Logo */}
      <View style={styles.logoContainer}>
         <Image
         source={require("../../assets/images/icon.png")} 
          style={styles.logo}
        /> 
        <Text style={[styles.brandName, { color: theme.text }]}>KORA.care</Text>
        <Text style={[styles.tagline, { color: theme.subText }]}> 
          {t("your_care")}
        </Text>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.globeIcon}>🌐</Text>
        <Text style={[styles.title, { color: theme.text }]}> 
          {t("choose_language")}
        </Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.subText }]}> 
        {t("change_language_anytime")}
      </Text>

      {/* Language List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageItem,
              { backgroundColor: theme.card, borderColor: selected === lang.code ? theme.primary : theme.border },
              selected === lang.code && styles.languageItemSelected,
            ]}
            onPress={() => setSelected(lang.code)}
          >
            <View>
              <Text
                style={[
                  styles.nativeText,
                  { color: selected === lang.code ? theme.primary : theme.text },
                ]}
              >
                {lang.native}
              </Text>
              <Text style={[styles.englishText, { color: theme.subText }]}>{lang.label}</Text>
            </View>

            {selected === lang.code && (
              <View style={styles.checkCircle}>
                <Text style={styles.checkMark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Continue Button */}
      <TouchableOpacity style={[styles.continueButton, { backgroundColor: theme.primary }]} onPress={handleContinue}>
        <Text style={styles.continueText}>
  {t("continue")}
</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    // paddingTop removed — SafeAreaView handles it
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 16,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  tagline: {
    fontSize: 13,
    marginTop: 2,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  globeIcon: {
    fontSize: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
    marginBottom: 16,
  },
  languageItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
  },
  languageItemSelected: {
  },
  nativeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  selectedText: {
  },
  englishText: {
    fontSize: 12,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  checkMark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  continueText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});