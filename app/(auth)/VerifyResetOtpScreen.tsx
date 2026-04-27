import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Image,
      KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { verifyResetOtp, resendResetCode } from "../../src/api/auth";
import { SafeAreaView } from "react-native-safe-area-context";
const logoImage = require("../../assets/images/kora-logo.png");

export default function VerifyResetOtpScreen() {
    const { theme } = useTheme();
    const { mobile } = useLocalSearchParams<{ mobile: string }>();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]); // 6 digits
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const inputs = useRef<any[]>([]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setTimeout(() => setTimer(timer - 1), 1000);
            return () => clearTimeout(interval);
        } else {
            setCanResend(true);
        }
    }, [timer]);

    const handleOtpChange = (text: string, index: number) => {
        if (text.length > 1) {
            const digits = text.split("").slice(0, 6);
            const newOtp = [...otp];
            digits.forEach((d, i) => { if (i < 6) newOtp[i] = d; });
            setOtp(newOtp);
            inputs.current[Math.min(digits.length, 5)]?.focus();
            return;
        }
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);
        if (text && index < 5) inputs.current[index + 1]?.focus();
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join("");
        if (otpString.length !== 6) {
            setError("Please enter the complete 6-digit code");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const data = await verifyResetOtp(mobile, otpString);  // ✅ no .json()
            // If verifyResetOtp throws on error, we don't need response.ok check
            router.push({
                pathname: "/(auth)/ResetPasswordScreen",
                params: { resetToken: data.resetToken },
            });
        } catch (err: any) {
            setError(err.message || "Verification failed");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;
        setLoading(true);
        setError("");
        try {
            await resendResetCode(mobile);   // ✅ uses your apiClient
            setTimer(60);
            setCanResend(false);
            setOtp(["", "", "", "", "", ""]);
            inputs.current[0]?.focus();
        } catch (err: any) {
            setError(err.message || "Failed to resend code");
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
            </View>

            <Text style={[styles.title, { color: theme.text }]}>Enter Verification Code</Text>
            <Text style={[styles.description, { color: theme.subText }]}>
                We've sent a 6-digit code to {mobile}
            </Text>

            <View style={styles.otpContainer}>
                {otp.map((digit, idx) => (
                    <TextInput
                        key={idx}
                        ref={(ref) => (inputs.current[idx] = ref)}
                        style={[
                            styles.otpBox,
                            {
                                borderColor: digit ? theme.primary : theme.border || "#ddd",
                                color: theme.text,
                                backgroundColor: theme.inputBg || theme.card,
                            },
                        ]}
                        maxLength={6}
                        keyboardType="numeric"
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, idx)}
                        onKeyPress={(e) => handleKeyPress(e, idx)}
                    />
                ))}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.verifyButton} onPress={handleVerify} disabled={loading}>
                <LinearGradient
                    colors={theme.gradient || [theme.primary, theme.primary]}
                    style={styles.button}
                >
                    <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify Code"}</Text>
                </LinearGradient>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
                {!canResend ? (
                    <Text style={{ color: theme.subText }}>Resend code in {timer}s</Text>
                ) : (
                    <TouchableOpacity onPress={handleResend}>
                        <Text style={{ color: theme.primary, fontWeight: "500" }}>Didn't get a code? Resend</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
            </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, justifyContent: "center" },
    logoContainer: { alignItems: "center", marginBottom: 30 },
    logoImage: { width: 70, height: 70, marginBottom: 10 },
    logoText: { fontSize: 24, fontWeight: "700" },
    title: { fontSize: 22, fontWeight: "700", marginTop: 10 },
    description: { fontSize: 14, marginTop: 8, marginBottom: 24 },
    otpContainer: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 20 },
    otpBox: { flex: 1, height: 55, borderRadius: 12, textAlign: "center", fontSize: 20, fontWeight: "600", borderWidth: 2, marginHorizontal: 2 },
    verifyButton: { marginTop: 10, borderRadius: 14, overflow: "hidden" },
    button: { padding: 15, alignItems: "center" },
    buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
    resendContainer: { alignItems: "center", marginTop: 20 },
    errorText: { color: "red", textAlign: "center", marginTop: 12, fontSize: 13 },
});