import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
    Alert,
     KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { forgotPassword } from "../../src/api/auth";
import { SafeAreaView } from "react-native-safe-area-context";
const logoImage = require("../../assets/images/kora-logo.png");

export default function ForgotPasswordScreen() {
    const { theme } = useTheme();
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
            setError("Please enter a valid 10-digit mobile number");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const fullPhone = `+91${mobile}`;
            const data = await forgotPassword(fullPhone);
            // forgotPassword already throws on error (if your apiClient does)
            // If it returns a response object with ok, handle accordingly
            if (data.error) throw new Error(data.error);

            // Navigate to OTP verification screen, pass mobile
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
           
           <KeyboardAvoidingView
             style={{ flex: 1 }}
             behavior={Platform.OS === "ios" ? "padding" : "height"}
             keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
           >
             <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
               <ScrollView
                 contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
                 keyboardShouldPersistTaps="handled"
                 showsVerticalScrollIndicator={false}
               >
            <View style={styles.logoContainer}>
                <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
                <Text style={[styles.logoText, { color: theme.primary }]}>KORA</Text>
                <Text style={[styles.subTitle, { color: theme.subText }]}>
                    Premium Laundry Service
                </Text>
            </View>

            <Text style={[styles.title, { color: theme.text }]}>Forgot Password?</Text>
            <Text style={[styles.description, { color: theme.subText }]}>
                Don't worry! Enter your phone number and we'll send you a code to reset your password.
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
                    placeholder="Phone Number"
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
                        {loading ? "Sending..." : "Send Reset Code"}
                    </Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/(auth)/email-login")}>
                <Text style={[styles.emailLink, { color: theme.primary }]}>
                    Use Email instead
                </Text>
            </TouchableOpacity>
        </ScrollView>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
            </SafeAreaView>
        
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: "center" },
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