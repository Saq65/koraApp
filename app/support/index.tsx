import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";

type SupportRow = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle: string;
  onPress: () => void;
};

export default function SupportScreen() {
  const { theme, isDarkMode } = useTheme();

  const rows: SupportRow[] = [
    {
      icon: "book-outline",
      label: "User Guide",
      subtitle: "How to use the app — what to do and what to avoid",
      onPress: () => router.push("/support/guide"),
    },
    {
      icon: "alert-circle-outline",
      label: "Raise a Complaint",
      subtitle: "Report an issue with an order",
      onPress: () => router.push("/profile-page/raiseComplaintScreen"),
    },
    {
      icon: "star-outline",
      label: "Rate Us",
      subtitle: "Tell us how we're doing",
      onPress: () => router.push("/rateus/rateus"),
    },
    {
      icon: "mail-outline",
      label: "Email Support",
      subtitle: "Reach our support team directly",
      onPress: () => Linking.openURL("mailto:support@koraapp.com"),
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <AppBackground>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Support</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {rows.map((row) => (
            <TouchableOpacity
              key={row.label}
              style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={row.onPress}
              activeOpacity={0.75}
            >
              <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name={row.icon} size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: theme.text }]}>{row.label}</Text>
                <Text style={[styles.rowSubtitle, { color: theme.subText }]}>{row.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.subText} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  rowSubtitle: { fontSize: 12.5 },
});