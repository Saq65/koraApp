import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../../src/theme/ThemeProvider";
import { getProfile } from "../../src/services/customer";
import { apiClient } from "../../src/api/client";

const normalizeIndianPhone = (rawPhone: string): string => {
  const digitsOnly = rawPhone.replace(/\D/g, "");
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) return `+${digitsOnly}`;
  if (digitsOnly.length === 10) return `+91${digitsOnly}`;
  if (digitsOnly.length > 10) return `+91${digitsOnly.slice(-10)}`;
  return rawPhone.trim();
};

export default function CompleteProfileScreen() {
  const { theme, isDarkMode } = useTheme();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingMobile, setSavingMobile] = useState(false);

  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");

  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const refreshProfileAndRedirectIfDone = async () => {
    const profileRes = await getProfile();
    const profile = profileRes?.data;
    if (profile?.mobile) {
      // Clear the whole pre-login/onboarding stack so back-navigation from
      // home can't walk backward into login/onboarding screens.
      if (router.canDismiss()) router.dismissAll();
      router.replace("/(tabs)/home"); // ✅ go to home after completion
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("userToken");
        if (!storedToken) {
          router.replace("/(auth)/email-login");
          return;
        }

        const profileRes = await getProfile();
        const profile = profileRes?.data;

        // ✅ If already has mobile, skip to home
        if (profile?.mobile) {
          if (router.canDismiss()) router.dismissAll();
          router.replace("/(tabs)/home");
          return;
        }

        // Prefill if backend already has phone field (maybe from previous attempt)
        if (profile?.phone && !phone) {
          setPhone(profile.phone);
        }
      } catch (e) {
        router.replace("/(auth)/email-login");
      } finally {
        setLoadingProfile(false);
      }
    };

    run();
  }, []);

  const requestMobileOtp = async () => {
    setServerMessage(null);

    const normalized = normalizeIndianPhone(phone);
    const phoneRegex = /^\+91\d{10}$/;
    if (!phoneRegex.test(normalized)) {
      setServerMessage("Enter valid phone number (e.g. +91XXXXXXXXXX)");
      return;
    }

    setSavingMobile(true);
    try {
      await apiClient(
        "/customers/profile/request-mobile-otp",
        "POST",
        { newMobile: normalized },
        undefined
      );

      setStep("otp");
    } catch (e: any) {
      setServerMessage(e?.message || "Failed to request OTP");
    } finally {
      setSavingMobile(false);
    }
  };

  const verifyMobileOtp = async () => {
    setServerMessage(null);

    const normalized = normalizeIndianPhone(phone);
    const phoneRegex = /^\+91\d{10}$/;
    if (!phoneRegex.test(normalized)) {
      setServerMessage("Enter valid phone number");
      return;
    }

    if (otp.replace(/\D/g, "").length !== 6) {
      setServerMessage("Enter 6 digit OTP");
      return;
    }

    setSavingMobile(true);
    try {
      await apiClient(
        "/customers/profile/verify-mobile-otp",
        "POST",
        { newMobile: normalized, otp },
        undefined
      );

      await refreshProfileAndRedirectIfDone();
    } catch (e: any) {
      setServerMessage(e?.message || "OTP verification failed");
    } finally {
      setSavingMobile(false);
    }
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.container, { backgroundColor: theme.background }]}> 
        <Text style={[styles.title, { color: theme.text }]}>Complete your profile</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>Enter your phone number so we can contact you.</Text>

        {step === "phone" ? (
          <>
            <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: theme.card }]}> 
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="+91XXXXXXXXXX"
                placeholderTextColor={theme.subText}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                editable={!savingMobile}
              />
            </View>

            {serverMessage ? <Text style={styles.error}>{serverMessage}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, savingMobile && { opacity: 0.7 }]}
              onPress={requestMobileOtp}
              disabled={savingMobile}
            >
              <Text style={styles.buttonText}>{savingMobile ? "Sending..." : "Send OTP"}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: theme.card }]}> 
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter 6 digit OTP"
                placeholderTextColor={theme.subText}
                keyboardType="numeric"
                value={otp}
                onChangeText={setOtp}
                editable={!savingMobile}
              />
            </View>

            {serverMessage ? <Text style={styles.error}>{serverMessage}</Text> : null}

            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.primary }, savingMobile && { opacity: 0.7 }]}
              onPress={verifyMobileOtp}
              disabled={savingMobile}
            >
              <Text style={styles.buttonText}>{savingMobile ? "Verifying..." : "Verify & Continue"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.link}
              onPress={() => {
                setStep("phone");
                setOtp("");
              }}
              disabled={savingMobile}
            >
              <Text style={[styles.linkText, { color: theme.primary }]}>Change phone</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 30,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "800" },
  subtitle: { marginTop: 8, fontSize: 13, lineHeight: 18 },
  inputWrap: {
    marginTop: 18,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  input: { height: 44, fontSize: 16 },
  button: {
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  error: { marginTop: 12, color: "#d00", fontSize: 13 },
  link: { marginTop: 14, alignItems: "center" },
  linkText: { color: "#1a7a6e", fontWeight: "700" },
});