import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  FlatList,
} from "react-native";
import { sendOtp, verifyOtp } from "../../src/api/auth";
// Remove: import { setToken } from "../../src/utils/storage";
import { handleSuccessfulLogin } from "../../src/utils/authHelpers"; // ✅ ADD THIS
import { useTheme } from "../../src/theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { useTranslation } from "react-i18next";
import i18n from "../../src/translations/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState<number | null>(null);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const logoImage = require("../../assets/images/kora-logo.png");

  const otpRefs = useRef([]);

  // Language options
  const languages = [
    { code: "en", label: "English", nativeLabel: "English" },
    { code: "hi", label: "हिन्दी", nativeLabel: "हिन्दी" },
    { code: "mr", label: "मराठी", nativeLabel: "मराठी" },
    { code: "gu", label: "ગુજરાતી", nativeLabel: "ગુજરાતી" },
  ];

  const currentLanguageLabel = languages.find(l => l.code === i18n.language)?.nativeLabel || "English";

  const changeLanguage = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    await AsyncStorage.setItem("app-language", langCode);
    setShowLanguageDropdown(false);
  };

  useEffect(() => {
    if (showOtp && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [showOtp]);

  const handleOtpChange = (text:any, index:any) => {
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
          setError(t("validation.valid_phone"));
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
        setError(t("auth.enter_complete_otp"));
        setLoading(false);
        return;
      }

      const normalizedPhone = normalizeIndianPhone(phone);
      const res = await verifyOtp(normalizedPhone, enteredOtp);
      console.log("LOGIN SUCCESS:", res);

      if (res?.token) {
        // ✅ REPLACE direct setToken with the helper
        await handleSuccessfulLogin(res.token, res.role);
      }
      router.replace("/(tabs)/home");
    } catch (err) {
      console.log("AUTH ERROR:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // The rest of the component (JSX) stays exactly the same
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
            {/* Language Selector - Dropdown */}
            <View style={styles.languageRow}>
              <TouchableOpacity
                style={[
                  styles.languageBtn,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border || "#ddd",
                  },
                ]}
                onPress={() => setShowLanguageDropdown(true)}
              >
                <Ionicons name="language-outline" size={18} color={theme.primary} />
                <Text style={[styles.languageBtnText, { color: theme.primary }]}>
                  {currentLanguageLabel}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
              <Text style={[styles.logoText, { color: theme.primary }]}>{t("app_name")}</Text>
              <Text style={[styles.subText, { color: theme.subText }]}>
                {t("branding.your_care")}
              </Text>
            </View>

            {/* Welcome */}
            <Text style={[styles.title, { color: theme.text }]}>{t("auth.welcome_back")}</Text>
            <Text style={[styles.subText, { color: theme.subText }]}>
              {t("auth.sign_in_continue")}
            </Text>

            {/* Phone Input */}
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
                placeholder={t("auth.phone_number")}
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

            <TouchableOpacity
              onPress={() => router.push("/(auth)/ForgotPasswordScreen")}
              style={styles.forgotLink}
            >
              <Text style={[styles.forgotText, { color: theme.primary }]}>
                {t("auth.forgot_password")}
              </Text>
            </TouchableOpacity>

            {/* Button */}
            <TouchableOpacity onPress={handleAuth} disabled={loading}>
              <LinearGradient
                colors={theme.gradient || [theme.primary, theme.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {loading ? t("auth.please_wait") : showOtp ? t("auth.verify_otp") : t("auth.send_otp")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.line, { backgroundColor: theme.border || "#ddd" }]} />
              <Text style={[styles.orText, { color: theme.subText }]}>{t("auth.or_continue_with")}</Text>
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
                {t("auth.continue_google")}
              </Text>
            </TouchableOpacity>

            {/* Email */}
            <Text
              style={[styles.emailText, { color: theme.primary }]}
              onPress={() => router.push("/(auth)/email-login")}
            >
              {t("auth.use_email")}
            </Text>

            <View style={styles.bottomContainer}>
              <Text style={{ color: theme.subText }}>{t("auth.dont_have_account")} </Text>
              <Text
                style={{ color: theme.primary, fontWeight: "600" }}
                onPress={() => router.push("/(auth)/register")}
              >
                {t("auth.sign_up")}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </AppBackground>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageDropdown(false)}
        >
          <View
            style={[
              styles.dropdownContainer,
              {
                backgroundColor: theme.card,
                borderColor: theme.border || "#ddd",
              },
            ]}
          >
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => changeLanguage(item.code)}
                >
                  <Text style={[styles.dropdownItemText, { color: theme.text }]}>
                    {item.nativeLabel}
                  </Text>
                  {i18n.language === item.code && (
                    <Ionicons name="checkmark" size={18} color={theme.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logoImage: { width: 70, height: 70, marginBottom: 10 },
  logoText: { fontSize: 28, fontWeight: "700" },
  subText: { fontSize: 14, marginTop: 5 },
  title: { fontSize: 26, fontWeight: "700", marginTop: 10 },
  forgotLink: { alignSelf: "flex-end", marginTop: 12, marginBottom: 8 },
  forgotText: { fontSize: 14, fontWeight: "500" },
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
  languageRow: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  languageBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  languageBtnText: {
    marginHorizontal: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownContainer: {
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 16,
  },
});