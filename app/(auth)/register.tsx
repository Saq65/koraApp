import React, { useState } from "react";
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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { registerUser } from "../../src/api/auth";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { useTranslation } from "react-i18next";

const logoImage = require("../../assets/images/kora-logo.png");

export default function RegisterScreen() {
    const { theme } = useTheme();
    const { t } = useTranslation(); // ← language hook

    const [form, setForm] = useState({
        username: "",
        password: "",
        mobile: "",
        fullName: "",
        email: "",
        dob: "",
    });

    const [loading, setLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [secureTextEntry, setSecureTextEntry] = useState(true);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (key: string, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
        setError("");
    };

    const handleMobileChange = (value: string) => {
        const onlyNumbers = value.replace(/[^0-9]/g, "");
        handleChange("mobile", onlyNumbers.slice(0, 10));
    };

    const handleDateChange = (_event: any, selectedDate?: Date) => {
        if (Platform.OS === "android") {
            setShowDatePicker(false);
            setFocusedInput(null);
        }
        if (selectedDate) {
            const formattedDate = selectedDate.toISOString().split("T")[0];
            handleChange("dob", formattedDate);
        }
    };

    const handleRegister = async () => {
        try {
            setError("");

            if (!form.username.trim()) {
                setError(t("validation.username_required"));
                return;
            }
            if (!form.password || form.password.length < 6) {
                setError(t("validation.password_min"));
                return;
            }
            if (!form.mobile || form.mobile.length !== 10) {
                setError(t("auth.enter_valid_phone"));
                return;
            }
            if (!form.fullName.trim()) {
                setError(t("validation.fullname_required"));
                return;
            }

            setLoading(true);
            const normalizedMobile = `+91${form.mobile}`;

            const payload = {
                username: form.username,
                password: form.password,
                mobile: normalizedMobile,
                fullName: form.fullName,
                email: form.email || undefined,
                dob: form.dob || undefined,
                role: "customer",
            };

            const res = await registerUser(payload);
            console.log("REGISTER SUCCESS:", res);
            router.replace("/(auth)/login");
        } catch (error: any) {
            console.log("REGISTER ERROR:", error.message);
            setError(error.message || t("validation.registration_failed"));
        } finally {
            setLoading(false);
        }
    };

    const inputBoxStyle = (name: string) => [
        styles.inputContainer,
        {
            backgroundColor: theme.inputBg || theme.card,
            borderColor: focusedInput === name ? theme.primary : theme.border || "#ddd",
            borderWidth: focusedInput === name ? 2 : 1,
        },
    ];

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
            <AppBackground>
                <KeyboardAvoidingView
                    style={{ flex: 1, backgroundColor: theme.background }}
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
                                {t("auth.create_account")}
                            </Text>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <InputField
                            label={`${t("auth.username")} *`}
                            placeholder={t("auth.choose_username")}
                            icon="person-outline"
                            value={form.username}
                            onChangeText={(v: string) => handleChange("username", v)}
                            theme={theme}
                            containerStyle={inputBoxStyle("username")}
                            onFocus={() => setFocusedInput("username")}
                            onBlur={() => setFocusedInput(null)}
                        />

                        <View style={styles.fieldWrapper}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                {`${t("auth.password")} *`}
                            </Text>
                            <View style={inputBoxStyle("password")}>
                                <Ionicons name="lock-closed-outline" size={18} color={theme.subText} />
                                <TextInput
                                    placeholder={t("auth.min_6_characters")}
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

                        <InputField
                            label={`${t("auth.mobile_number")} *`}
                            placeholder={t("auth.phone_number")}
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

                        <InputField
                            label={`${t("auth.full_name")} *`}
                            placeholder={t("auth.full_name_placeholder")}
                            icon="person-circle-outline"
                            value={form.fullName}
                            onChangeText={(v: string) => handleChange("fullName", v)}
                            theme={theme}
                            containerStyle={inputBoxStyle("fullName")}
                            onFocus={() => setFocusedInput("fullName")}
                            onBlur={() => setFocusedInput(null)}
                        />

                        <InputField
                            label={t("auth.email_optional")}
                            placeholder={t("auth.email_placeholder")}
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

                        <View style={styles.fieldWrapper}>
                            <Text style={[styles.label, { color: theme.text }]}>
                                {t("auth.dob_optional")}
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => {
                                    setFocusedInput("dob");
                                    setShowDatePicker(true);
                                }}
                                style={inputBoxStyle("dob")}
                            >
                                <Ionicons name="calendar-outline" size={18} color={theme.subText} />
                                <Text
                                    style={[
                                        styles.input,
                                        { color: form.dob ? theme.text : theme.subText },
                                    ]}
                                >
                                    {form.dob || t("auth.select_dob")}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={form.dob ? new Date(form.dob) : new Date(2000, 0, 1)}
                                    mode="date"
                                    display={Platform.OS === "ios" ? "spinner" : "default"}
                                    maximumDate={new Date()}
                                    onChange={handleDateChange}
                                />
                            )}
                        </View>

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
                                    {loading ? t("auth.please_wait") : t("auth.create_account_btn")}
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

                        <TouchableOpacity
                            style={[
                                styles.googleBtn,
                                { backgroundColor: theme.card, borderColor: theme.border },
                            ]}
                        >
                            <Text style={styles.googleIcon}>🌐</Text>
                            <Text style={[styles.googleText, { color: theme.text }]}>
                                {t("auth.signup_google")}
                            </Text>
                        </TouchableOpacity>

                        <View style={{ alignItems: "center", marginTop: 20 }}>
                            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                                <Text style={{ color: theme.primary, textAlign: "center" }}>
                                    {t("auth.go_back_login")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </AppBackground>
        </SafeAreaView>
    );
}

// Helper component with translated placeholders
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
});