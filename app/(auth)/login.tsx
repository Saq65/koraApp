import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
  
  // Create refs for OTP inputs
  const otpRefs = useRef([]);

  // Auto-focus first OTP input when OTP section appears
  useEffect(() => {
    if (showOtp && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [showOtp]);

  const handleOtpChange = (text, index) => {
    // Handle paste (multiple digits at once)
    if (text.length > 1) {
      const digits = text.split("").slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (i < 6) newOtp[i] = digit;
      });
      setOtp(newOtp);
      
      // Focus on the next empty box or last filled box
      const lastFilledIndex = Math.min(digits.length - 1, 5);
      if (lastFilledIndex < 5 && otpRefs.current[lastFilledIndex + 1]) {
        otpRefs.current[lastFilledIndex + 1].focus();
      } else if (lastFilledIndex === 5) {
        otpRefs.current[5]?.blur();
      }
      return;
    }

    // Handle single digit input
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Move to next input if current is filled and not last
    if (text.length === 1 && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace to move to previous input
    if (e.nativeEvent.key === "Backspace" && index > 0 && !otp[index]) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleAuth = async () => {
    try {
      setError("");
      setLoading(true);

      if (!showOtp) {
        // Send OTP
        if (!phone || phone.length < 10) {
          setError("Please enter a valid phone number");
          setLoading(false);
          return;
        }
        
        await sendOtp(phone);
        setOtp(["", "", "", "", "", ""]);
        setShowOtp(true);
        return;
      }

      // Verify OTP
      const enteredOtp = otp.join("");

      if (enteredOtp.length !== 6) {
        setError("Please enter complete 6-digit OTP");
        setLoading(false);
        return;
      }

      const res = await verifyOtp(phone, enteredOtp);

      console.log("LOGIN SUCCESS:", res);

      // Save token
      if (res?.token) {
        await setToken(res.token);
      }

      // Navigate to dashboard
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
        <View
          style={[
            styles.logoBox,
            { backgroundColor: theme.primaryLight || theme.primary },
          ]}
        >
          <Text style={styles.logoIcon}>💧</Text>
        </View>

        <Text style={[styles.logoText, { color: theme.primary }]}>
          KORA Care
        </Text>

        <Text style={[styles.subTitle, { color: theme.subText }]}>
          Premium Laundry Service
        </Text>
      </View>

      {/* Welcome */}
      <Text style={[styles.title, { color: theme.text }]}>
        Welcome Back
      </Text>

      <Text style={[styles.subTitle, { color: theme.subText }]}>
        Sign in to continue
      </Text>

      {/* Phone Input */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.inputBg || theme.card },
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
        />
      </View>

      {/* OTP Boxes */}
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
                      digit.length > 0
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
              />
            ))}
          </View>
          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}
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
            {loading
              ? "Please wait..."
              : showOtp
              ? "Verify OTP"
              : "Send OTP"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View
          style={[styles.line, { backgroundColor: theme.border || "#ddd" }]}
        />
        <Text style={[styles.orText, { color: theme.subText }]}>
          or continue with
        </Text>
        <View
          style={[styles.line, { backgroundColor: theme.border || "#ddd" }]}
        />
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
        <Text style={{ color: theme.subText }}>
          Don't have an account?{" "}
        </Text>

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
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },

  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  logoIcon: {
    fontSize: 30,
    color: "#fff",
  },

  logoText: {
    fontSize: 28,
    fontWeight: "700",
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 10,
  },

  subTitle: {
    fontSize: 14,
    marginTop: 5,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 14,
    marginTop: 20,
  },

  input: {
    marginLeft: 10,
    flex: 1,
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 8,
  },

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

  button: {
    padding: 15,
    alignItems: "center",
    borderRadius: 14,
    marginTop: 20,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 25,
  },

  line: {
    flex: 1,
    height: 1,
  },

  orText: {
    marginHorizontal: 10,
    fontSize: 12,
  },

  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },

  googleText: {
    marginLeft: 10,
    fontWeight: "500",
  },

  emailText: {
    textAlign: "center",
    marginTop: 20,
    fontWeight: "500",
  },

  bottomContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },

  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
  },
});