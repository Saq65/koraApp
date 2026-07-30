import React, { useState, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Platform,
    KeyboardAvoidingView,
    Alert,
    ActivityIndicator,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { registerUser, verifyEmail, loginUser, resendVerificationOtp } from "../../src/api/auth";
// import { loginWithGoogle } from "../../src/services/auth0";
import { handleSuccessfulLogin } from "../../src/utils/authHelpers"; // static import
import { registerForPushNotificationsAsync } from "../../src/utils/pushNotifications";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { useTranslation } from "react-i18next";
// import { loginWithGoogle } from "@/src/services/auth0";

import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";

WebBrowser.maybeCompleteAuthSession();

const AUTH0_DOMAIN = process.env.EXPO_PUBLIC_AUTH0_DOMAIN!;
const AUTH0_CLIENT_ID = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!;

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "koraapp",
  path: "callback",
});

const discovery = {
  authorizationEndpoint: `https://${AUTH0_DOMAIN}/authorize`,
  tokenEndpoint: `https://${AUTH0_DOMAIN}/oauth/token`,
};

const logoImage = require("../../assets/images/kora-logo.png");

export default function RegisterScreen() {
    const { theme } = useTheme();
    const { t } = useTranslation();

    // -----------------------------
    // GOOGLE AUTH REQUEST (Auth0) — same setup as email-login.tsx
    // -----------------------------
    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: AUTH0_CLIENT_ID,
            redirectUri,
            responseType: "code",
            usePKCE: true,
            scopes: ["openid", "profile", "email"],
            extraParams: {
                connection: "google-oauth2",
                prompt: "select_account",
            },
        },
        discovery
    );

    // Save the PKCE verifier so callback.tsx can read it after the redirect
    React.useEffect(() => {
        if (!request) return;
        const saveVerifier = async () => {
            if (request.codeVerifier) {
                await AsyncStorage.setItem("auth0_code_verifier", request.codeVerifier);
            }
        };
        saveVerifier();
    }, [request]);

    // NOTE: intentionally no response-handling effect here. The redirect to
    // koraapp://callback is handled exclusively by app/(auth)/callback.tsx —
    // adding a second handler here would race against it the same way
    // email-login.tsx used to (see that file's history). Do not add one.

    // Step: 'register' or 'verify'
    const [step, setStep] = useState<"register" | "verify">("register");

    // Registration form
    const [form, setForm] = useState({
        email: "",
        mobile: "",
        password: "",
        fullName: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // OTP state
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState("");
    const inputRefs = useRef<Array<TextInput | null>>([]);

    // UI state
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [secureTextEntry, setSecureTextEntry] = useState(true);

    // ─── Handlers ──────────────────────────────────────────────

    const handleChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setError("");
    };

    const handleMobileChange = (value: string) => {
        const onlyNumbers = value.replace(/[^0-9]/g, "");
        handleChange("mobile", onlyNumbers.slice(0, 10));
    };

    // ─── Registration submission ──────────────────────────────

    const handleRegister = async () => {
        try {
            setError("");

            // Validation
            if (!form.email.trim()) {
                setError(t("validation.email_required") || "Email is required");
                return;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(form.email.trim())) {
                setError(t("validation.invalid_email") || "Please enter a valid email address");
                return;
            }
            if (!form.password || form.password.length < 6) {
                setError(t("validation.password_min") || "Password must be at least 6 characters");
                return;
            }
            if (!form.mobile || form.mobile.length !== 10) {
                setError(t("validation.valid_phone") || "Please enter a valid 10-digit mobile number");
                return;
            }
            if (!form.fullName.trim()) {
                setError(t("validation.fullname_required") || "Full name is required");
                return;
            }

            setLoading(true);

            const payload = {
                email: form.email.trim().toLowerCase(),
                mobile: form.mobile,
                password: form.password,
                role: "customer",
                fullName: form.fullName.trim(),
            };

            await registerUser(payload);
            // Registration successful – OTP sent to email
            setStep("verify");
            setLoading(false);
            // Pre-focus first OTP box
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } catch (error: any) {
            const msg = error?.message || t("validation.registration_failed");
            setError(msg);
            setLoading(false);
        }
    };

    // ─── OTP verification ──────────────────────────────────────

    const handleOtpChange = (text: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join("");
        if (otpString.length !== 6) {
            setOtpError("Please enter the 6‑digit OTP");
            return;
        }
        setOtpLoading(true);
        setOtpError("");

        try {
            // 1. Verify OTP
            await verifyEmail(form.email, otpString);

            // 2. Auto-login using the same credentials
            const loginRes = await loginUser({
                identifier: form.email,
                password: form.password,
            });

            // 3. Persist session & fetch user profile
            await handleSuccessfulLogin(loginRes.token, loginRes.role);
            // See login.tsx — a fresh login needs its own push-registration call.
            registerForPushNotificationsAsync();

            // 4. Navigate to main app
            // Clear the whole pre-login stack (welcome/login/register/OTP
            // screens) so back-navigation from home can't return to them.
            if (router.canDismiss()) router.dismissAll();
            router.replace("/(tabs)/home");
        } catch (error: any) {
            setOtpError(error?.message || "Invalid OTP or login failed. Please try again.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleResendOtp = async () => {
        try {
            setOtpError("");
            await resendVerificationOtp(form.email);
            Alert.alert("OTP resent", "A new OTP has been sent to your email.");
        } catch (error: any) {
            setOtpError(error?.message || "Failed to resend OTP");
        }
    };

    // ─── Google Login ──────────────────────────────────────────
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            await promptAsync();
        } catch (error: any) {
            Alert.alert('Google Login Failed', error?.message || 'Something went wrong');
        } finally {
            setGoogleLoading(false);
        }
    };
    // ─── Helpers for styles ──────────────────────────────────

    const inputBoxStyle = (name: string) => [
        styles.inputContainer,
        {
            backgroundColor: theme.inputBg || theme.card,
            borderColor: focusedInput === name ? theme.primary : theme.border || "#ddd",
            borderWidth: focusedInput === name ? 2 : 1,
        },
    ];

    // ─── Render ─────────────────────────────────────────────

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <AppBackground>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.logoContainer}>
                            <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
                            <Text style={[styles.logoText, { color: theme.primary }]}>
                                {t("app_name")}
                            </Text>
                            <Text style={[styles.subTitle, { color: theme.subText }]}>
                                {step === "register"
                                    ? t("auth.create_account")
                                    : "Verify your email"}
                            </Text>
                        </View>

                        {/* ─── REGISTRATION STEP ────────────────── */}
                        {step === "register" && (
                            <>
                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                {/* Email */}
                                <InputField
                                    label={`${t("auth.email")} *`}
                                    placeholder={t("auth.email_placeholder") || "your@email.com"}
                                    icon="mail-outline"
                                    value={form.email}
                                    onChangeText={(v: string) => handleChange("email", v)}
                                    theme={theme}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    containerStyle={inputBoxStyle("email")}
                                    onFocus={() => setFocusedInput("email")}
                                    onBlur={() => setFocusedInput(null)}
                                />

                                {/* Mobile */}
                                <InputField
                                    label={`${t("auth.mobile_number")} *`}
                                    placeholder={t("auth.phone_number") || "9876543210"}
                                    icon="call-outline"
                                    value={form.mobile}
                                    onChangeText={handleMobileChange}
                                    theme={theme}
                                    keyboardType="number-pad"
                                    maxLength={10}
                                    containerStyle={inputBoxStyle("mobile")}
                                    onFocus={() => setFocusedInput("mobile")}
                                    onBlur={() => setFocusedInput(null)}
                                />

                                {/* Password */}
                                <View style={styles.fieldWrapper}>
                                    <Text style={[styles.label, { color: theme.text }]}>
                                        {`${t("auth.password")} *`}
                                    </Text>
                                    <View style={inputBoxStyle("password")}>
                                        <Ionicons name="lock-closed-outline" size={18} color={theme.subText} />
                                        <TextInput
                                            placeholder={t("auth.min_6_characters") || "Min. 6 characters"}
                                            placeholderTextColor={theme.subText}
                                            style={[styles.input, { color: theme.text }]}
                                            value={form.password}
                                            onChangeText={(v) => handleChange("password", v)}
                                            secureTextEntry={secureTextEntry}
                                            onFocus={() => setFocusedInput("password")}
                                            onBlur={() => setFocusedInput(null)}
                                        />
                                        <TouchableOpacity onPress={() => setSecureTextEntry(prev => !prev)}>
                                            <Ionicons
                                                name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                                                size={18}
                                                color={theme.subText}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Full Name */}
                                <InputField
                                    label={`${t("auth.full_name")} *`}
                                    placeholder={t("auth.full_name_placeholder") || "John Doe"}
                                    icon="person-circle-outline"
                                    value={form.fullName}
                                    onChangeText={(v: string) => handleChange("fullName", v)}
                                    theme={theme}
                                    containerStyle={inputBoxStyle("fullName")}
                                    onFocus={() => setFocusedInput("fullName")}
                                    onBlur={() => setFocusedInput(null)}
                                />

                                <TouchableOpacity
                                    style={styles.buttonWrapper}
                                    onPress={handleRegister}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={theme.gradient || [theme.primary, theme.primary]}
                                        style={styles.button}
                                    >
                                        <Text style={styles.buttonText}>
                                            {loading
                                                ? t("auth.please_wait") || "Please wait..."
                                                : t("auth.create_account_btn") || "Create Account"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.dividerContainer}>
                                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                                    <Text style={[styles.orText, { color: theme.subText }]}>
                                        {t("auth.or_continue_with")}
                                    </Text>
                                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                                </View>

                                {/* Google Signup Button */}
                                <TouchableOpacity
                                    style={[
                                        styles.googleBtn,
                                        { backgroundColor: theme.card, borderColor: theme.border },
                                    ]}
                                    onPress={handleGoogleLogin}
                                    disabled={googleLoading || !request}
                                >
                                    {googleLoading ? (
                                        <ActivityIndicator color={theme.text} />
                                    ) : (
                                        <>
                                            <Text style={styles.googleIcon}>🌐</Text>
                                            <Text style={[styles.googleText, { color: theme.text }]}>
                                                {t("auth.signup_google") || "Sign up with Google"}
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <View style={{ alignItems: "center", marginTop: 20 }}>
                                    <TouchableOpacity onPress={() => router.push("/(auth)/email-login")}>
                                        <Text style={{ color: theme.primary, textAlign: "center" }}>
                                            {t("auth.go_back_login") || "Already have an account? Login"}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* ─── OTP VERIFICATION STEP ────────────── */}
                        {step === "verify" && (
                            <>
                                <Text style={[styles.otpInfo, { color: theme.text }]}>
                                    We’ve sent a 6‑digit OTP to{"\n"}
                                    <Text style={{ fontWeight: "bold" }}>{form.email}</Text>
                                </Text>

                                {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

                                <View style={styles.otpContainer}>
                                    {otp.map((digit, index) => (
                                        <TextInput
                                            key={index}
                                            ref={(ref: TextInput | null) => {
                                                inputRefs.current[index] = ref;
                                            }}
                                            style={[
                                                styles.otpBox,
                                                {
                                                    backgroundColor: theme.inputBg || theme.card,
                                                    borderColor: otpError ? "red" : theme.border || "#ddd",
                                                    color: theme.text,
                                                },
                                            ]}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            value={digit}
                                            onChangeText={(text) => handleOtpChange(text, index)}
                                            onKeyPress={(e) => handleOtpKeyPress(e, index)}
                                        />
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.buttonWrapper, { marginTop: 10 }]}
                                    onPress={handleVerifyOtp}
                                    disabled={otpLoading}
                                >
                                    <LinearGradient
                                        colors={theme.gradient || [theme.primary, theme.primary]}
                                        style={styles.button}
                                    >
                                        <Text style={styles.buttonText}>
                                            {otpLoading
                                                ? t("auth.verifying") || "Verifying..."
                                                : t("auth.verify_btn") || "Verify OTP"}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ marginTop: 15, alignSelf: "center" }}
                                    onPress={handleResendOtp}
                                    disabled={otpLoading}
                                >
                                    <Text style={{ color: theme.primary }}>
                                        {t("auth.resend_otp") || "Resend OTP"}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ marginTop: 20, alignSelf: "center" }}
                                    onPress={() => {
                                        setStep("register");
                                        setOtp(["", "", "", "", "", ""]);
                                        setOtpError("");
                                    }}
                                >
                                    <Text style={{ color: theme.subText }}>
                                        {t("auth.go_back") || "Go back to registration"}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </AppBackground>
        </SafeAreaView>
    );
}

// ─── Helper InputField component ──────────────────────────────────
function InputField({
    label,
    placeholder,
    icon,
    value,
    onChangeText,
    theme,
    containerStyle,
    onFocus,
    onBlur,
    keyboardType = "default",
    maxLength,
    autoCapitalize = "sentences",
}: any) {
    return (
        <View style={styles.fieldWrapper}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <View style={containerStyle}>
                <Ionicons name={icon} size={18} color={theme.subText} />
                <TextInput
                    placeholder={placeholder}
                    placeholderTextColor={theme.subText}
                    style={[styles.input, { color: theme.text }]}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    keyboardType={keyboardType}
                    maxLength={maxLength}
                    autoCapitalize={autoCapitalize}
                />
            </View>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
    scrollContent: { padding: 20, paddingBottom: 40 },
    logoContainer: { alignItems: "center", marginBottom: 30 },
    logoImage: { width: 80, height: 80, marginBottom: 10 },
    logoText: { fontSize: 26, fontWeight: "700" },
    subTitle: { fontSize: 14 },
    fieldWrapper: { marginBottom: 15 },
    label: { marginBottom: 6, fontSize: 14, fontWeight: "500" },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        height: 50,
        borderRadius: 14,
    },
    input: { flex: 1, marginLeft: 10, fontSize: 15 },
    buttonWrapper: { marginTop: 20, borderRadius: 14, overflow: "hidden" },
    button: { padding: 15, alignItems: "center" },
    buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 25 },
    line: { flex: 1, height: 1 },
    orText: { marginHorizontal: 10, fontSize: 12 },
    googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, borderWidth: 1 },
    googleIcon: { fontSize: 18 },
    googleText: { marginLeft: 10, fontWeight: "500" },
    errorText: { color: "red", textAlign: "center", marginBottom: 10, fontSize: 14 },
    otpInfo: { fontSize: 16, textAlign: "center", marginVertical: 20 },
    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 20,
    },
    otpBox: {
        width: 50,
        height: 55,
        borderRadius: 12,
        borderWidth: 1,
        textAlign: "center",
        fontSize: 22,
        fontWeight: "600",
    },
});