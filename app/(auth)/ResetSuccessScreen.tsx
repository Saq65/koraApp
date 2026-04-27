import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { useTheme } from "../../src/theme/ThemeProvider";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";

const logoImage = require("../../assets/images/kora-logo.png");

export default function ResetSuccessScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.logoContainer}>
        <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
        <Text style={[styles.logoText, { color: theme.primary }]}>KORA</Text>
      </View>

      <View style={styles.iconContainer}>
        <Text style={styles.checkmark}>✓</Text>
      </View>

      <Text style={[styles.title, { color: theme.text }]}>Password Reset!</Text>
      <Text style={[styles.description, { color: theme.subText }]}>
        Your password has been changed successfully. You can now sign in with your new password.
      </Text>

      <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
        <LinearGradient
          colors={theme.gradient || [theme.primary, theme.primary]}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Continue to Sign In</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center", alignItems: "center" },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logoImage: { width: 80, height: 80, marginBottom: 10 },
  logoText: { fontSize: 28, fontWeight: "700" },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#4CAF50", justifyContent: "center", alignItems: "center", marginBottom: 24 },
  checkmark: { fontSize: 48, color: "#fff", fontWeight: "bold" },
  title: { fontSize: 24, fontWeight: "700", marginTop: 10, textAlign: "center" },
  description: { fontSize: 14, marginTop: 8, textAlign: "center", marginBottom: 32, lineHeight: 20 },
  button: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 30, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});