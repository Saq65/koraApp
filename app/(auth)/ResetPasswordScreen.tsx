import React, { useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { resetPassword } from "../../src/api/auth";
import { SafeAreaView } from "react-native-safe-area-context";

// ...
const logoImage = require("../../assets/images/kora-logo.png");

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const { resetToken } = useLocalSearchParams<{ resetToken: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureNew, setSecureNew] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedNew, setFocusedNew] = useState(false);
  const [focusedConfirm, setFocusedConfirm] = useState(false);

  const handleReset = async () => {
  if (newPassword.length < 6) {
    setError("Password must be at least 6 characters");
    return;
  }
  if (newPassword !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  setLoading(true);
  setError("");
  try {
    await resetPassword(resetToken, newPassword, confirmPassword);
    router.replace("/(auth)/ResetSuccessScreen");
  } catch (err: any) {
    setError(err.message || "Password reset failed");
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

      <Text style={[styles.title, { color: theme.text }]}>Create New Password</Text>
      <Text style={[styles.description, { color: theme.subText }]}>
        Your new password must be different from previously used passwords.
      </Text>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBg || theme.card,
            borderColor: focusedNew ? theme.primary : "transparent",
            borderWidth: focusedNew ? 2 : 1,
          },
        ]}
      >
        <Ionicons name="lock-closed-outline" size={18} color={theme.subText} />
        <TextInput
          placeholder="New Password"
          placeholderTextColor={theme.subText}
          style={[styles.input, { color: theme.text }]}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={secureNew}
          onFocus={() => setFocusedNew(true)}
          onBlur={() => setFocusedNew(false)}
        />
        <TouchableOpacity onPress={() => setSecureNew(!secureNew)}>
          <Ionicons name={secureNew ? "eye-outline" : "eye-off-outline"} size={18} color={theme.subText} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.inputBg || theme.card,
            borderColor: focusedConfirm ? theme.primary : "transparent",
            borderWidth: focusedConfirm ? 2 : 1,
          },
        ]}
      >
        <Ionicons name="lock-closed-outline" size={18} color={theme.subText} />
        <TextInput
          placeholder="Confirm New Password"
          placeholderTextColor={theme.subText}
          style={[styles.input, { color: theme.text }]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={secureConfirm}
          onFocus={() => setFocusedConfirm(true)}
          onBlur={() => setFocusedConfirm(false)}
        />
        <TouchableOpacity onPress={() => setSecureConfirm(!secureConfirm)}>
          <Ionicons name={secureConfirm ? "eye-outline" : "eye-off-outline"} size={18} color={theme.subText} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.hint, { color: theme.subText }]}>Password must be at least 6 characters</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity onPress={handleReset} disabled={loading}>
        <LinearGradient
          colors={theme.gradient || [theme.primary, theme.primary]}
          style={styles.button}
        >
          <Text style={styles.buttonText}>{loading ? "Resetting..." : "Reset Password"}</Text>
        </LinearGradient>
      </TouchableOpacity>
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
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, marginBottom: 12 },
  input: { flex: 1, marginLeft: 10, fontSize: 16 },
  hint: { fontSize: 12, marginTop: 4, marginBottom: 20 },
  button: { padding: 15, alignItems: "center", borderRadius: 14, marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  errorText: { color: "red", textAlign: "center", marginTop: 12, fontSize: 13 },
});