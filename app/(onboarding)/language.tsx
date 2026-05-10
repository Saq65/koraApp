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
  const [selected, setSelected] = useState("en");

  async function handleContinue() {
    await AsyncStorage.setItem("selectedLanguage", selected);
    router.replace("/(onboarding)/terms");
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4f3" />

      {/* Logo */}
      <View style={styles.logoContainer}>
        {/* <Image
          source={require("../../assets/icon.png")}
          style={styles.logo}
        /> */}
        <Text style={styles.brandName}>KORA.care</Text>
        <Text style={styles.tagline}>Your care is our priority</Text>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.globeIcon}>🌐</Text>
        <Text style={styles.title}>Choose your language</Text>
      </View>
      <Text style={styles.subtitle}>
        You can change this anytime from your Profile
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
              selected === lang.code && styles.languageItemSelected,
            ]}
            onPress={() => setSelected(lang.code)}
          >
            <View>
              <Text
                style={[
                  styles.nativeText,
                  selected === lang.code && styles.selectedText,
                ]}
              >
                {lang.native}
              </Text>
              <Text style={styles.englishText}>{lang.label}</Text>
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
      <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
        <Text style={styles.continueText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f4f3",
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
    color: "#1a7a6e",
    marginTop: 8,
  },
  tagline: {
    fontSize: 13,
    color: "#888",
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
    color: "#111",
  },
  subtitle: {
    fontSize: 12,
    color: "#999",
    marginBottom: 16,
  },
  listContainer: {
    flex: 1,
    marginBottom: 16,
  },
  languageItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  languageItemSelected: {
    borderColor: "#1a7a6e",
  },
  nativeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
  selectedText: {
    color: "#1a7a6e",
  },
  englishText: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1a7a6e",
    justifyContent: "center",
    alignItems: "center",
  },
  checkMark: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  continueButton: {
    backgroundColor: "#1a7a6e",
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