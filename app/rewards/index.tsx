import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function RewardsScreen() {
  const { theme, isDarkMode } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <AppBackground>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Rewards</Text>
        </View>

        <View style={styles.center}>
          <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="trophy-outline" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Coming Soon</Text>
          <Text style={[styles.subtitle, { color: theme.subText }]}>
            A rewards program for loyal Kora customers is on its way. We'll let you know the moment it launches.
          </Text>
        </View>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  iconCircle: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  title: { fontSize: 19, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 13.5, textAlign: "center", lineHeight: 20 },
});