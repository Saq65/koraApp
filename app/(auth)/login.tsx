import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { setToken } from "../../src/utils/storage";
import { sendOtp, verifyOtp } from "../../src/api/auth";

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

  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);

  const inputs = useRef<TextInput[]>([]);

  // ✅ OTP input handler (auto focus next)
  const handleOtpChange = (text: string, index: number) => {
    if (!/^[0-9]?$/.test(text)) return;

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  // ✅ MAIN AUTH FUNCTION
  const handleAuth = async () => {
    try {
      setError("");

      if (!phone || phone.length < 10) {
        setError("Enter valid phone number");
        return;
      }

      setLoading(true);

      // 📤 SEND OTP
      if (!showOtp) {
        await sendOtp({
          mobile: phone,
          role: "customer", // ✅ REQUIRED
        });

        setShowOtp(true);
        setOtp(["", "", "", ""]);
        return;
      }

      // 📥 VERIFY OTP
      const enteredOtp = otp.join("");

      if (enteredOtp.length !== 4) {
        setError("Enter complete OTP");
        return;
      }

      const res = await verifyOtp({
        mobile: phone,
        otp: enteredOtp,
        role: "customer", // ✅ REQUIRED
      });

      console.log("LOGIN SUCCESS:", res);

      if (res?.token) {
        await setToken(res.token);
      }

      router.replace("/(tabs)");
    } catch (err: any) {
      console.log("AUTH ERROR:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ SAFE ARRAY (prevents crash)
  const otpArray = Array.isArray(otp) ? otp : ["", "", "", ""];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* LOGO */}
      <View style={styles.logoContainer}>
        <View
          style={[
            styles.logoBox,
            { backgroundColor: theme.primary },
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

      {/* TITLE */}
      <Text style={[styles.title, { color: theme.text }]}>
        Welcome Back
      </Text>

      <Text style={[styles.subTitle, { color: theme.subText }]}>
        Login with OTP
      </Text>

      {/* PHONE INPUT */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.card },
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
        />
      </View>

      {/* OTP INPUT */}
      {showOtp && (
        <View style={styles.otpContainer}>
          {otpArray.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                if (ref) inputs.current[index] = ref;
              }}
              style={[
                styles.otpBox,
                {
                  borderColor: digit
                    ? theme.primary
                    : theme.border || "#ddd",
                  color: theme.text,
                  backgroundColor: theme.card,
                },
              ]}
              maxLength={1}
              keyboardType="numeric"
              value={digit}
              onChangeText={(text) =>
                handleOtpChange(text, index)
              }
            />
          ))}
        </View>
      )}

      {/* ERROR */}
      {error ? (
        <Text style={{ color: "red", marginTop: 10 }}>
          {error}
        </Text>
      ) : null}

      {/* BUTTON */}
      <TouchableOpacity onPress={handleAuth} disabled={loading}>
        <LinearGradient
          colors={theme.gradient || [theme.primary, theme.primary]}
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

      {/* SIGNUP */}
      <View style={styles.bottomContainer}>
        <Text style={{ color: theme.subText }}>
          Don’t have an account?{" "}
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
  },

  otpBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    textAlign: "center",
    fontSize: 20,
    borderWidth: 2,
  },

  button: {
    marginTop: 20,
    padding: 15,
    alignItems: "center",
    borderRadius: 14,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },

  bottomContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
});