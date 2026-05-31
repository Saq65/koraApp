import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import i18n from "../../src/translations/i18n";
import AppBackground from "@/components/AppBackground";

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
    const [selected, setSelected] = useState("en");
    const [loading, setLoading] = useState(false);

    // Load saved language on mount
    useEffect(() => {
        loadSavedLanguage();
    }, []);

    const loadSavedLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem("selectedLanguage");
            if (savedLanguage && LANGUAGES.some(lang => lang.code === savedLanguage)) {
                setSelected(savedLanguage);
                // Set i18n language to saved one
                await i18n.changeLanguage(savedLanguage);
            }
        } catch (error) {
            console.log("Error loading language:", error);
        }
    };

    async function handleChangeLanguage(langCode: string) {
        if (langCode === selected) return;

        setSelected(langCode);

        try {
            // Save to AsyncStorage
            await AsyncStorage.setItem("selectedLanguage", langCode);
            await AsyncStorage.setItem("app-language", langCode);

            // Change language instantly
            await i18n.changeLanguage(langCode);

            // Show success message
            Alert.alert(
                t("language_changed") || "Language Changed",
                t("language_changed_message") || "App language has been updated successfully",
                [{ text: "OK" }]
            );

            // Optional: Go back to previous screen after 1 second
            setTimeout(() => {
                router.back();
            }, 1500);

        } catch (error) {
            console.log("Error changing language:", error);
            Alert.alert(
                "Error",
                "Failed to change language. Please try again."
            );
        }
    }

    return (
        <SafeAreaView style={styles.container}>
            <AppBackground>
            <StatusBar barStyle="dark-content" backgroundColor="#f0f4f3" />

            {/* Header with Back Button */}
            {/* <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("select_language") || "Select Language"}</Text>
        <View style={{ width: 40 }} />
      </View> */}

            {/* Logo */}
            <View style={styles.logoContainer}>
                <Image
                    source={require("../../assets/images/icon.png")}
                    style={styles.logo}
                />
                <Text style={styles.brandName}>KORA.care</Text>
                <Text style={styles.tagline}>
                    {t("your_care")}
                </Text>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
                <Text style={styles.globeIcon}>🌐</Text>
                <Text style={styles.title}>
                    {t("choose_language") || "Choose Your Language"}
                </Text>
            </View>
            <Text style={styles.subtitle}>
                {t("change_language_anytime") || "You can change language anytime in settings"}
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
                        onPress={() => handleChangeLanguage(lang.code)}
                        disabled={loading}
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

            {/* Info Text */}
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                    {t("language_will_change_immediately") || "Language will change immediately"}
                </Text>
            </View>
            </AppBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f4f3",
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
    },
    backButton: {
        padding: 8,
        width: 40,
    },
    backButtonText: {
        fontSize: 28,
        color: "#1a7a6e",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1a7a6e",
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
        backgroundColor: "#f0faf8",
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
    infoContainer: {
        paddingVertical: 16,
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        marginTop: 8,
    },
    infoText: {
        fontSize: 12,
        color: "#666",
        textAlign: "center",
    },
});