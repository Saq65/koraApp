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
import { Ionicons } from "@expo/vector-icons";
import i18n from "../../src/translations/i18n";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";

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
    const { theme, isDarkMode } = useTheme();
    const { t } = useTranslation();
    const [selected, setSelected] = useState("en");
    const [loading, setLoading] = useState(false);

    const styles = getStyles(theme);

    // Load saved language on mount
    useEffect(() => {
        loadSavedLanguage();
    }, []);

    const loadSavedLanguage = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem("selectedLanguage");
            if (savedLanguage && LANGUAGES.some(lang => lang.code === savedLanguage)) {
                setSelected(savedLanguage);
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
            await AsyncStorage.setItem("selectedLanguage", langCode);
            await AsyncStorage.setItem("app-language", langCode);
            await i18n.changeLanguage(langCode);

            Alert.alert(
                t("language_changed", "Language Changed"),
                t("language_changed_message", "App language has been updated successfully"),
                [{ text: t("ok", "OK") }]
            );

            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (error) {
            console.log("Error changing language:", error);
            Alert.alert(
                t("error", "Error"),
                t("language_change_failed", "Failed to change language. Please try again.")
            );
        }
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <AppBackground>
                <StatusBar
                    barStyle={isDarkMode ? "light-content" : "dark-content"}
                    backgroundColor={theme.background}
                />

                {/* Header with Back Button (matching Cart/Orders) */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="arrow-back" size={22} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {t("select_language", "Select Language")}
                    </Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Logo */}
                <View style={styles.logoContainer}>
                    <Image
                        source={require("../../assets/images/icon.png")}
                        style={styles.logo}
                    />
                    <Text style={[styles.brandName, { color: theme.primary }]}>
                        {t("app_name", "KORA.care")}
                    </Text>
                    <Text style={[styles.tagline, { color: theme.subText }]}>
                        {t("branding.your_care", "Your care, delivered")}
                    </Text>
                </View>

                {/* Title */}
                <View style={styles.titleContainer}>
                    <Text style={styles.globeIcon}>🌐</Text>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {t("choose_language", "Choose Your Language")}
                    </Text>
                </View>
                <Text style={[styles.subtitle, { color: theme.subText }]}>
                    {t("change_language_anytime", "You can change language anytime in settings")}
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
                                { backgroundColor: theme.card, borderColor: "transparent" },
                                selected === lang.code && {
                                    borderColor: theme.primary,
                                    backgroundColor: theme.primaryLight,
                                },
                            ]}
                            onPress={() => handleChangeLanguage(lang.code)}
                            disabled={loading}
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
                                <Text style={[styles.englishText, { color: theme.subText }]}>
                                    {lang.label}
                                </Text>
                            </View>

                            {selected === lang.code && (
                                <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
                                    <Text style={styles.checkMark}>✓</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Info Text */}
                <View style={[styles.infoContainer, { borderTopColor: theme.border }]}>
                    <Text style={[styles.infoText, { color: theme.subText }]}>
                        {t("language_will_change_immediately", "Language will change immediately")}
                    </Text>
                </View>
            </AppBackground>
        </SafeAreaView>
    );
}

const getStyles = (theme: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
        },
        header: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        backBtn: {
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.card,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 4,
            elevation: 2,
        },
        headerTitle: {
            fontSize: 18,
            fontWeight: "700",
            color: theme.text,
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
            paddingHorizontal: 16,
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
            paddingHorizontal: 16,
        },
        listContainer: {
            flex: 1,
            marginBottom: 16,
        },
        languageItem: {
            borderRadius: 12,
            padding: 16,
            marginBottom: 10,
            marginHorizontal: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderWidth: 1.5,
            shadowColor: "#000",
            shadowOpacity: 0.04,
            shadowRadius: 4,
            elevation: 1,
        },
        nativeText: {
            fontSize: 16,
            fontWeight: "600",
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
        infoContainer: {
            paddingVertical: 16,
            alignItems: "center",
            borderTopWidth: 1,
            marginTop: 8,
        },
        infoText: {
            fontSize: 12,
            textAlign: "center",
        },
    });