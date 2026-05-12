import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { forgotPassword } from "../../src/api/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { useTranslation } from "react-i18next";

const logoImage = require("../../assets/images/kora-logo.png");

export default function ForgotPasswordScreen() {
    const { theme } = useTheme();
    const { t } = useTranslation(); // ← language hook
    const [mobile, setMobile] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [focused, setFocused] = useState(false);

    const normalizeMobile = (text: string) => {
        const digits = text.replace(/\D/g, "").slice(0, 10);
        setMobile(digits);
        setError("");
    };

    const handleSendCode = async () => {
        if (mobile.length !== 10) {
            setError(t("auth.enter_valid_phone")); // ← translated
            return;
        }

        setLoading(true);
        setError("");

        try {
            const fullPhone = `+91${mobile}`;
            const data = await forgotPassword(fullPhone);
            if (data.error) throw new Error(data.error);

            router.push({
                pathname: "/(auth)/VerifyResetOtpScreen",
                params: { mobile: fullPhone },
            });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <AppBackground>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.logoContainer}>
                            <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
                            <Text style={[styles.logoText, { color: theme.primary }]}>
                                {t("app_name")}  {/* "KORA.care" */}
                            </Text>
                            <Text style={[styles.subTitle, { color: theme.subText }]}>
                                {t("branding.your_care")}
                            </Text>
                        </View>

                        <Text style={[styles.title, { color: theme.text }]}>
                            {t("auth.forgot_password_title")}
                        </Text>
                        <Text style={[styles.description, { color: theme.subText }]}>
                            {t("auth.forgot_password_description")}
                        </Text>

                        <View
                            style={[
                                styles.inputContainer,
                                {
                                    backgroundColor: theme.inputBg || theme.card,
                                    borderColor: focused ? theme.primary : "transparent",
                                    borderWidth: focused ? 2 : 1,
                                },
                            ]}
                        >
                            <Ionicons name="call-outline" size={18} color={theme.subText} />
                            <TextInput
                                placeholder={t("auth.phone_number")}
                                placeholderTextColor={theme.subText}
                                style={[styles.input, { color: theme.text }]}
                                value={mobile}
                                onChangeText={normalizeMobile}
                                keyboardType="numeric"
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                            />
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <TouchableOpacity onPress={handleSendCode} disabled={loading}>
                            <LinearGradient
                                colors={theme.gradient || [theme.primary, theme.primary]}
                                style={styles.button}
                            >
                                <Text style={styles.buttonText}>
                                    {loading ? t("auth.please_wait") : t("auth.send_reset_code")}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => router.push("/(auth)/email-login")}>
                            <Text style={[styles.emailLink, { color: theme.primary }]}>
                                {t("auth.use_email")}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </AppBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    logoContainer: { alignItems: "center", marginBottom: 40 },
    logoImage: { width: 80, height: 80, marginBottom: 10 },
    logoText: { fontSize: 28, fontWeight: "700" },
    subTitle: { fontSize: 14, marginTop: 4 },
    title: { fontSize: 24, fontWeight: "700", marginTop: 10 },
    description: { fontSize: 14, marginTop: 8, marginBottom: 24, lineHeight: 20 },
    inputContainer: { flexDirection: "row", alignItems: "center", padding: 3, borderRadius: 14, marginBottom: 12 },
    input: { flex: 1, marginLeft: 10, fontSize: 16 },
    button: { padding: 15, alignItems: "center", borderRadius: 14, marginTop: 10 },
    buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    emailLink: { textAlign: "center", marginTop: 20, fontWeight: "500" },
    errorText: { color: "red", textAlign: "center", marginTop: 8, fontSize: 13 },
});