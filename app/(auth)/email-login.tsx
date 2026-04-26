import { useState } from "react"; // add useState
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

// Import your logo
const logoImage = require("../../assets/images/kora-logo.png");

export default function EmailLoginScreen() {
  const { theme } = useTheme();
  const [secureTextEntry, setSecureTextEntry] = useState(true); // state for password visibility
  const [focusedInput, setFocusedInput] = useState(null);
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

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

      {/* Email Input */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor:
              focusedInput === "email"
                ? theme.primary
                : theme.border || "#ddd",
          },
        ]}
      >
        <Ionicons name="mail-outline" size={18} color={theme.subText} />
        <TextInput
          placeholder="Email Address"
          placeholderTextColor={theme.subText}
          style={[styles.input, { color: theme.text }]}
          onFocus={() => setFocusedInput("email")}
          onBlur={() => setFocusedInput(null)}
        />
      </View>

      {/* Password Input with working eye toggle */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.card,
            borderWidth: 1,
            borderColor:
              focusedInput === "password"
                ? theme.primary
                : theme.border || "#ddd",
          },
        ]}
      >
        <Ionicons name="lock-closed-outline" size={18} color={theme.subText} />
        <TextInput
          placeholder="Password"
          placeholderTextColor={theme.subText}
          secureTextEntry={secureTextEntry}
          style={[styles.input, { color: theme.text }]}
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

      {/* Sign In Button */}
      <TouchableOpacity style={styles.buttonWrapper}>
        <LinearGradient
          colors={[theme.primary, theme.secondary || theme.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Sign In</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={[styles.line, { backgroundColor: theme.border || "#ddd" }]} />
        <Text style={[styles.orText, { color: theme.subText }]}>
          or continue with
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
  container: { flex: 1, padding: 20, justifyContent: "center" },
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
  input: { flex: 1, marginLeft: 10 },
  buttonWrapper: { marginTop: 20, borderRadius: 14, overflow: "hidden" },
  button: { padding: 15, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 25 },
  line: { flex: 1, height: 1 },
  orText: { marginHorizontal: 10, fontSize: 12 },
  googleBtn: { padding: 15, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  googleText: { fontWeight: "500" },
  phoneBtn: { marginTop: 20, padding: 15, alignItems: "center" },
  bottomContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
});