import React, { useState, useRef, useEffect } from "react";
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
    ActivityIndicator,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { useTranslation } from "react-i18next";
import { forgotPassword, verifyResetOtp } from "../../src/api/auth";

const logoImage = require("../../assets/images/kora-logo.png");

export default function ForgotPasswordScreen() {
    const { theme ,isDarkMode} = useTheme();
    const { t } = useTranslation();

    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [focusedOtpIndex, setFocusedOtpIndex] = useState<number | null>(null);
    const [isIdentifierFocused, setIsIdentifierFocused] = useState(false);

    const otpRefs = useRef<(TextInput | null)[]>([]);

    useEffect(() => {
        if (showOtp && otpRefs.current[0]) {
            otpRefs.current[0]?.focus();
        }
    }, [showOtp]);

    const getRawMobile = (input: string): string => {
        const digits = input.replace(/\D/g, "");
        if (digits.length >= 10) return digits.slice(-10);
        return digits;
    };

    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
        return emailRegex.test(email);
    };

    const isValidMobile = (mobile: string): boolean => {
        const digits = mobile.replace(/\D/g, "");
        return digits.length === 10;
    };

    const handleSendCode = async () => {
        setError("");
        const trimmed = identifier.trim();
        if (!trimmed) {
            setError(t("auth.enter_email_or_phone"));
            return;
        }

        let processedIdentifier = trimmed;
        const isEmail = trimmed.includes("@");

        if (isEmail) {
            if (!isValidEmail(trimmed)) {
                setError(t("auth.valid_email"));
                return;
            }
        } else {
            const rawMobile = getRawMobile(trimmed);
            if (!isValidMobile(rawMobile)) {
                setError(t("validation.valid_phone"));
                return;
            }
            processedIdentifier = rawMobile;
        }

        setLoading(true);
        try {
            await forgotPassword(processedIdentifier);
            setShowOtp(true);
            setOtp(["", "", "", "", "", ""]);
        } catch (err: any) {
            console.error("Forgot password error:", err);
            const serverMsg = err.response?.data?.error || err.message;
            setError(serverMsg || t("auth.send_otp_failed"));
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (text: string, index: number) => {
        if (text.length > 1) {
            const digits = text.split("").slice(0, 6);
            const newOtp = [...otp];
            digits.forEach((digit, i) => {
                if (i < 6) newOtp[i] = digit;
            });
            setOtp(newOtp);
            const lastFilledIndex = Math.min(digits.length - 1, 5);
            if (lastFilledIndex < 5 && otpRefs.current[lastFilledIndex + 1]) {
                otpRefs.current[lastFilledIndex + 1]?.focus();
            } else if (lastFilledIndex === 5) {
                otpRefs.current[5]?.blur();
            }
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text.length === 1 && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && index > 0 && !otp[index]) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const enteredOtp = otp.join("");
        if (enteredOtp.length !== 6) {
            setError(t("auth.enter_complete_otp"));
            return;
        }

        let processedIdentifier = identifier.trim();
        const isEmail = processedIdentifier.includes("@");
        if (!isEmail) {
            processedIdentifier = getRawMobile(processedIdentifier);
        }

        setLoading(true);
        try {
            const response = await verifyResetOtp(processedIdentifier, enteredOtp);
            const resetToken = response.resetToken;
            if (!resetToken) throw new Error("No reset token received");
            router.push({
                pathname: "/(auth)/ResetPasswordScreen",
                params: { resetToken }
            });
        } catch (err: any) {
            const serverMsg = err.response?.data?.error || err.message;
            setError(serverMsg || t("auth.invalid_otp"));
        } finally {
            setLoading(false);
        }
    };

    const handleBackToIdentifier = () => {
        setShowOtp(false);
        setOtp(["", "", "", "", "", ""]);
        setError("");
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
                        contentContainerStyle={{ flexGrow: 1, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 30 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.backRow}>
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={[styles.backButton, { backgroundColor: theme.card }]}
                            >
                                <Ionicons name="arrow-back" size={20} color={theme.primary} />
                            </TouchableOpacity>
                            <Text style={[styles.backButtonText, { color: theme.primary }]}>
                                {t("auth.go_back")}
                            </Text>
                        </View>

                        <View style={styles.logoContainer}>
                            <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
                            <Text style={[styles.logoText, { color: theme.primary }]}>{t("app_name")}</Text>
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

                        {!showOtp ? (
                            <>
                                <View
                                    style={[
                                        styles.inputContainer,
                                        {
                                            backgroundColor: theme.inputBg || theme.card,
                                            borderColor: isIdentifierFocused ? theme.primary : "transparent",
                                            borderWidth: isIdentifierFocused ? 2 : 1,
                                        },
                                    ]}
                                >
                                    <Ionicons name="mail-outline" size={18} color={theme.subText} />
                                    <TextInput
                                        placeholder={t("auth.email_or_phone")}
                                        placeholderTextColor={theme.subText}
                                        style={[styles.input, { color: theme.text }]}
                                        value={identifier}
                                        onChangeText={setIdentifier}
                                        keyboardType="default"
                                        autoCapitalize="none"
                                        editable={!loading}
                                        onFocus={() => setIsIdentifierFocused(true)}
                                        onBlur={() => setIsIdentifierFocused(false)}
                                    />
                                </View>

                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                <TouchableOpacity onPress={handleSendCode} disabled={loading}>
                                    <LinearGradient
                                        colors={theme.gradient || [theme.primary, theme.primary]}
                                        style={styles.button}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.buttonText}>{t("auth.send_reset_code")}</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={styles.otpContainer}>
                                    {otp.map((digit, index) => (
                                        <TextInput
                                            key={index}
                                            ref={(el) => (otpRefs.current[index] = el)}
                                            style={[
                                                styles.otpBox,
                                                {
                                                    borderColor:
                                                        focusedOtpIndex === index
                                                            ? theme.primary
                                                            : digit.length > 0
                                                                ? theme.primary
                                                                : theme.border || "#ddd",
                                                    color: theme.text,
                                                    backgroundColor: theme.inputBg || theme.card,
                                                },
                                            ]}
                                            maxLength={6}
                                            keyboardType="numeric"
                                            value={digit}
                                            onChangeText={(text) => handleOtpChange(text, index)}
                                            onKeyPress={(e) => handleKeyPress(e, index)}
                                            editable={!loading}
                                            onFocus={() => setFocusedOtpIndex(index)}
                                            onBlur={() => setFocusedOtpIndex(null)}
                                        />
                                    ))}
                                </View>

                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                <TouchableOpacity onPress={handleVerifyOtp} disabled={loading}>
                                    <LinearGradient
                                        colors={theme.gradient || [theme.primary, theme.primary]}
                                        style={styles.button}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.buttonText}>{t("auth.verify_otp")}</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity onPress={handleBackToIdentifier} style={styles.backLink}>
                                    <Text style={[styles.backLinkText, { color: theme.primary }]}>
                                        {t("auth.change_identifier")}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity onPress={() => router.push("/(auth)/email-login")}>
                            <Text style={[styles.emailLink, { color: theme.primary }]}>
                                {t("auth.back_to_login")}
                            </Text>
                        </TouchableOpacity>
                    </ScrollView>
                </KeyboardAvoidingView>
            </AppBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    logoContainer: { alignItems: "center", marginBottom: 40 }, // reduced from 40
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
    otpContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 8 },
    otpBox: {
        flex: 1,
        height: 55,
        borderRadius: 12,
        textAlign: "center",
        fontSize: 20,
        fontWeight: "600",
        borderWidth: 2,
        marginHorizontal: 2,
    },
    backLink: { marginTop: 20, alignItems: "center" },
    backLinkText: { fontSize: 14, fontWeight: "500" },
    backRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 30,
        backgroundColor: "transparent", // will be overridden by theme.card
        marginRight: 8,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: "500",
    },
});