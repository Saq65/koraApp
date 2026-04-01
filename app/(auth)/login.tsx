import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
export default function LoginScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>💧</Text>
        </View>

        <Text style={[styles.logoText, { color: theme.primary }]}>
          KORA
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

      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: theme.card }]}>
        <Ionicons name="call-outline" size={18} color={theme.subText} />
        <TextInput
          placeholder="Phone Number"
          placeholderTextColor={theme.subText}
          style={[styles.input, { color: theme.text }]}
        />
      </View>

      {/* Gradient Button */}
      <TouchableOpacity
        style={styles.buttonWrapper}
        onPress={() => router.push("/(auth)/otp")}
      >
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Send OTP</Text>
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
          { backgroundColor: theme.card, borderColor: "#E5E7EB" },
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

      {/* Bottom Sign Up */}
      <View style={styles.bottomContainer}>
        <Text style={{ color: theme.subText }}>
          Don’t have an account?{" "}
        </Text>
        <Text style={{ color: theme.primary, fontWeight: "600" }}>
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
    backgroundColor: "#6C63FF",
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

  buttonWrapper: {
    marginTop: 20,
    borderRadius: 14,
    overflow: "hidden",
  },

  button: {
    padding: 15,
    alignItems: "center",
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
});