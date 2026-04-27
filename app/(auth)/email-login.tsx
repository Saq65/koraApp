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
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context"; // ✅ import
import { useTheme } from "../../src/theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { loginUser } from "../../src/api/auth";
import { setToken } from "../../src/utils/storage";

const logoImage = require("../../assets/images/kora-logo.png");

export default function EmailLoginScreen() {
  const { theme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError("Please enter both email/username and password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await loginUser({ username: username.trim(), password });
      if (data.token) {
        await setToken(data.token);
        router.replace("/(tabs)");
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      console.log("Login error:", err);
      setError(err.message || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoContainer}>
              <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
              <Text style={[styles.logoText, { color: theme.primary }]}>KORA</Text>
              <Text style={[styles.subText, { color: theme.subText }]}>
                Premium Laundry Service
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: theme.text }]}>Welcome Back</Text>
            <Text style={[styles.subText, { color: theme.subText }]}>
              Sign in to continue
            </Text>

            {/* Username/Email Input */}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.card,
                  borderWidth: 1,
                  borderColor:
                    focusedInput === "username" ? theme.primary : theme.border || "#ddd",
                },
              ]}
            >
              <Ionicons name="mail-outline" size={18} color={theme.subText} />
              <TextInput
                placeholder="Email or Username"
                placeholderTextColor={theme.subText}
                style={[styles.input, { color: theme.text }]}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                onFocus={() => setFocusedInput("username")}
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
                placeholder="Password"
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
                  Forgot Password?
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
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
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
                  borderColor: theme.border || "#ddd",
                },
              ]}
            >
              <Text style={[styles.googleText, { color: theme.text }]}>
                Continue with Google
              </Text>
            </TouchableOpacity>

            {/* Use Phone */}
            <TouchableOpacity
              style={[styles.phoneBtn, { borderColor: theme.text }]}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={{ color: theme.primary }}>Use Phone instead</Text>
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View style={styles.bottomContainer}>
              <Text style={{ color: theme.subText }}>Don't have an account? </Text>
              <Text
                style={{ color: theme.primary, fontWeight: "600" }}
                onPress={() => router.push("/(auth)/register")}
              >
                Sign Up
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
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
});