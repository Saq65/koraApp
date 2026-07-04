import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../src/theme/ThemeProvider";
import { useTranslation } from "react-i18next";
import { setInitialMobile } from "../src/services/customer";
import { getUser, setUser } from "../src/utils/storage";

export default function OnboardingMobileScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    const digitsOnly = mobile.replace(/\D/g, "");
    if (digitsOnly.length !== 10) {
      setError(t("validation.valid_phone") || "Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await setInitialMobile({ mobile: digitsOnly });
      const savedMobile = res?.data?.mobile;

      // Keep the locally cached user in sync so the rest of the app
      // (and Header/"Guest" logic) sees the number immediately too.
      const cachedUser = await getUser();
      if (cachedUser) {
        await setUser({ ...cachedUser, mobile: savedMobile });
      }

      router.replace("/(tabs)/home");
    } catch (err: any) {
      setError(err.message || t("validation.something_went_wrong") || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>
          <View style={styles.iconWrap}>
            <Ionicons name="call-outline" size={36} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("onboarding.mobile_title") || "Add your mobile number"}
          </Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            {t("onboarding.mobile_subtitle") ||
              "Riders need this to reach you about your order. This is required to continue."}
          </Text>

          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: theme.card,
                borderColor: theme.border || "#ddd",
              },
            ]}
          >
            <Ionicons name="call-outline" size={18} color={theme.subText} />
            <Text style={[styles.prefix, { color: theme.subText }]}>+91</Text>
            <TextInput
              placeholder={t("auth.phone_number") || "Mobile number"}
              placeholderTextColor={theme.subText}
              style={[styles.input, { color: theme.text }]}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.buttonWrapper}
            onPress={handleContinue}
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
                <Text style={styles.buttonText}>{t("common.continue") || "Continue"}</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24 },
  iconWrap: { alignSelf: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: "center", marginBottom: 28, lineHeight: 20 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  prefix: { fontSize: 16, fontWeight: "600" },
  input: { flex: 1, fontSize: 16 },
  errorText: { color: "red", textAlign: "center", marginTop: 12, fontSize: 13 },
  buttonWrapper: { marginTop: 24, borderRadius: 14, overflow: "hidden" },
  button: { padding: 15, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});