import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { sendOtp, verifyOtp } from "../../src/api/auth";
import { setToken } from "../../src/utils/storage";
import { useTheme } from "../../src/theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function LoginScreen() {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState<number | null>(null);
  const logoImage = require("../../assets/images/kora-logo.png");
  
  const otpRefs = useRef([]);

  useEffect(() => {
    if (showOtp && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [showOtp]);

  const handleOtpChange = (text, index) => {
    if (text.length > 1) {
      const digits = text.split("").slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      const lastFilledIndex = Math.min(digits.length - 1, 5);
      if (lastFilledIndex < 5 && otpRefs.current[lastFilledIndex + 1]) {
        otpRefs.current[lastFilledIndex + 1].focus();
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

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && index > 0 && !otp[index]) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const normalizeIndianPhone = (rawPhone: string): string => {
    let cleaned = rawPhone.trim().replace(/\s/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('91')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+91' + cleaned;
      }
    }
    return cleaned;
  };

  const handleAuth = async () => {
    try {
      setError("");
      setLoading(true);

      if (!showOtp) {
        let normalizedPhone = normalizeIndianPhone(phone);
        const phoneRegex = /^\+91\d{10}$/;
        if (!phoneRegex.test(normalizedPhone)) {
          setError("Please enter a valid 10-digit Indian mobile number");
          setLoading(false);
          return;
        }
        await sendOtp(normalizedPhone);
        setOtp(["", "", "", "", "", ""]);
        setShowOtp(true);
        return;
      }

      const enteredOtp = otp.join("");
      if (enteredOtp.length !== 6) {
        setError("Please enter complete 6-digit OTP");
        setLoading(false);
        return;
      }

      const normalizedPhone = normalizeIndianPhone(phone);
      const res = await verifyOtp(normalizedPhone, enteredOtp);
      console.log("LOGIN SUCCESS:", res);

      if (res?.token) {
        await setToken(res.token);
      }
      router.replace("/(tabs)");
    } catch (err) {
      console.log("AUTH ERROR:", err.message);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
        <Text style={[styles.logoText, { color: theme.primary }]}>KORA</Text>
        <Text style={[styles.subText, { color: theme.subText }]}>
          Your care is our priority/responsibility
        </Text>
      </View>

      {/* Welcome */}
      <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
      <Text style={[styles.subTitle, { color: theme.subText }]}>
        Sign in to continue
      </Text>

      {/* Phone Input with focus border */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBg || theme.card,
            borderWidth: 1,
            borderColor: isPhoneFocused ? theme.primary : "transparent",
          },
        ]}
      >
        <Ionicons name="call-outline" size={18} color={theme.subText} />
        <TextInput
          placeholder="Phone Number"
          placeholderTextColor={theme.subText}
          style={[styles.input, { color: theme.text }]}
          value={phone}
          onChangeText={setPhone}
          keyboardType="numeric"
          editable={!loading}
          onFocus={() => setIsPhoneFocused(true)}
          onBlur={() => setIsPhoneFocused(false)}
        />
      </View>

      {/* OTP Boxes with focus border */}
      {showOtp && (
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
        </>
      )}

      {/* Button */}
      <TouchableOpacity onPress={handleAuth} disabled={loading}>
        <LinearGradient
          colors={theme.gradient || [theme.primary, theme.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {loading ? "Please wait..." : showOtp ? "Verify OTP" : "Send OTP"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={[styles.line, { backgroundColor: theme.border || "#ddd" }]} />
        <Text style={[styles.orText, { color: theme.subText }]}>or continue with</Text>
        <View style={[styles.line, { backgroundColor: theme.border || "#ddd" }]} />
      </View>

      {/* Google Button */}
      <TouchableOpacity
        style={[
          styles.googleBtn,
          {
            backgroundColor: theme.card,
            borderColor: theme.border || "#E5E7EB",
          },
        ]}
      >
        <Text style={{ fontSize: 18 }}>🌐</Text>
        <Text style={[styles.googleText, { color: theme.text }]}>
          Continue with Google
        </Text>
      </TouchableOpacity>

      {/* Email */}
      <Text
        style={[styles.emailText, { color: theme.primary }]}
        onPress={() => router.push("/(auth)/email-login")}
      >
        Use Email instead
      </Text>

      <View style={styles.bottomContainer}>
        <Text style={{ color: theme.subText }}>Don't have an account? </Text>
        <Text
          style={{ color: theme.primary, fontWeight: "600" }}
          onPress={() => router.push("/(auth)/register")}
        >
          Sign Up
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logoBox: { width: 70, height: 70, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 10 },
   logoImage: { width: 70, height: 70, marginBottom: 10 },

  logoText: { fontSize: 28, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "700", marginTop: 10 },
  subText: { fontSize: 14, marginTop: 5 },
  subTitle: { fontSize: 14, marginTop: 5 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 7,
    borderRadius: 14,
    marginTop: 20,
  },
  input: { marginLeft: 10, flex: 1 },
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
  button: { padding: 15, alignItems: "center", borderRadius: 14, marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 25 },
  line: { flex: 1, height: 1 },
  orText: { marginHorizontal: 10, fontSize: 12 },
  googleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, borderWidth: 1 },
  googleText: { marginLeft: 10, fontWeight: "500" },
  emailText: { textAlign: "center", marginTop: 20, fontWeight: "500" },
  bottomContainer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  errorText: { color: "red", textAlign: "center", marginTop: 10, fontSize: 14 },
});