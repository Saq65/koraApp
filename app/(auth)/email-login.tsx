import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { loginUser } from "../../src/api/auth";
import AppBackground from "@/components/AppBackground";
import { useTranslation } from "react-i18next";
import { handleSuccessfulLogin } from "../../src/utils/authHelpers";
import i18n from "../../src/translations/i18n";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlatList } from "react-native";


const logoImage = require("../../assets/images/kora-logo.png");

export default function EmailLoginScreen() {
  const { t } = useTranslation();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const { theme ,isDarkMode} = useTheme();

  const languages = [
    { code: "en", label: "English", nativeLabel: "English" },
    { code: "hi", label: "हिन्दी", nativeLabel: "हिन्दी" },
    { code: "mr", label: "मराठी", nativeLabel: "मराठी" },
    { code: "gu", label: "ગુજરાતી", nativeLabel: "ગુજરાતી" },
  ];

  const currentLanguageLabel = languages.find((l) => l.code === i18n.language)?.nativeLabel || "English";

  const changeLanguage = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    await AsyncStorage.setItem("app-language", langCode);
    setShowLanguageDropdown(false);
  };

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError(t("validation.enter_email_or_mobile_and_password") || "Email/mobile and password required");
      return;
    }

    // Normalize phone-like input: if user enters 10 digits, convert to +91XXXXXXXXXX
    const normalizePhoneIfNeeded = (value: string) => {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length === 10) return `+91${digitsOnly}`;
      return value;
    };

    const normalizedIdentifier = normalizePhoneIfNeeded(identifier.trim());


    setLoading(true);
    setError("");

    try {
      const data = await loginUser({ identifier: normalizedIdentifier, password });

      if (!data.token) {
        setError(t("validation.invalid_server_response"));
        return;
      }

      await handleSuccessfulLogin(data.token, data.role);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.log("Login error:", err);
      setError(err.message || t("validation.invalid_credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
       <StatusBar
              barStyle={isDarkMode ? "light-content" : "dark-content"}
              backgroundColor={theme.background}
            />
      <AppBackground>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
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
                <Text style={[styles.languageBtnText, { color: theme.primary }]}
                  >{currentLanguageLabel}</Text>
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


            {/* Title */}
            <Text style={[styles.title, { color: theme.text }]}>
              {t("auth.welcome_back")}
            </Text>
            <Text style={[styles.subText, { color: theme.subText }]}>
              {t("auth.sign_in_continue")}
            </Text>

            {/* Identifier (Email/Mobile) Input */}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.card,
                  borderWidth: 1,
                  borderColor:
                    focusedInput === "identifier" ? theme.primary : theme.border || "#ddd",
                },
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={theme.subText} />
              <TextInput
                placeholder={t("auth.email_or_mobile") || "Email or mobile number"}
                placeholderTextColor={theme.subText}
                style={[styles.input, { color: theme.text }]}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                onFocus={() => setFocusedInput("identifier")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>

            {/* Password Input */}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.card,
                  borderWidth: 1,
                  borderColor:
                    focusedInput === "password" ? theme.primary : theme.border || "#ddd",
                },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={18} color={theme.subText} />
              <TextInput
                placeholder={t("auth.password")}
                placeholderTextColor={theme.subText}
                secureTextEntry={secureTextEntry}
                style={[styles.input, { color: theme.text }]}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
              />
              <TouchableOpacity onPress={() => setSecureTextEntry(!secureTextEntry)}>
                <Ionicons
                  name={secureTextEntry ? "eye-outline" : "eye-off-outline"}
                  size={18}
                  color={theme.subText}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password Link */}
            <View style={styles.forgotRow}>
              <TouchableOpacity onPress={() => router.push("/(auth)/ForgotPasswordScreen")}>
                <Text style={[styles.forgotText, { color: theme.primary }]}>
                  {t("auth.forgot_password")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Sign In Button */}
            <TouchableOpacity
              style={styles.buttonWrapper}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={[theme.primary, theme.secondary || theme.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>{t("auth.sign_in")}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={[styles.line, { backgroundColor: theme.border || "#ddd" }]} />
              <Text style={[styles.orText, { color: theme.subText }]}>
                {t("auth.or_continue_with")}
              </Text>
              <View style={[styles.line, { backgroundColor: theme.border || "#ddd" }]} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={[
                styles.googleBtn,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border || "#ddd",
                },
              ]}
            >
              <Text style={[styles.googleText, { color: theme.text }]}>
                {t("auth.continue_google")}
              </Text>
            </TouchableOpacity>

         

            {/* Sign Up Link */}
            <View style={styles.bottomContainer}>
              <Text style={{ color: theme.subText }}>{t("auth.dont_have_account")}</Text>
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

const styles = StyleSheet.create({
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logoImage: { width: 70, height: 70, marginBottom: 10 },
  logoText: { fontSize: 28, fontWeight: "700" },
  title: { fontSize: 26, fontWeight: "700", marginTop: 10 },
  subText: { fontSize: 14, marginTop: 5 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderRadius: 14,
    marginTop: 15,
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  forgotRow: { alignItems: "flex-end", marginTop: 8, marginBottom: 8 },
  forgotText: { fontSize: 14, fontWeight: "500" },
  buttonWrapper: { marginTop: 20, borderRadius: 14, overflow: "hidden" },
  button: { padding: 15, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 25 },
  line: { flex: 1, height: 1 },
  orText: { marginHorizontal: 10, fontSize: 12 },
  googleBtn: { padding: 15, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  googleText: { fontWeight: "500" },
  phoneBtn: { marginTop: 20, padding: 15, alignItems: "center" },
  bottomContainer: { flexDirection: "row", justifyContent: "center", marginTop: 30 },
  errorText: { color: "red", textAlign: "center", marginTop: 12, fontSize: 13 },
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