import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";
import { clearAll } from "../../src/utils/storage";

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearAll();
          router.replace("/(auth)/email-login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <AppBackground>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Dark mode toggle */}
          <View style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name={isDarkMode ? "moon" : "moon-outline"} size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Dark Mode</Text>
              <Text style={[styles.rowSubtitle, { color: theme.subText }]}>
                {isDarkMode ? "Currently on" : "Currently off"}
              </Text>
            </View>
            <Switch value={isDarkMode} onValueChange={toggleTheme} trackColor={{ true: theme.primary }} />
          </View>

          {/* Language */}
          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/profile-page/language")}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="language-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Language</Text>
              <Text style={[styles.rowSubtitle, { color: theme.subText }]}>Change app language</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          </TouchableOpacity>

          {/* Saved addresses */}
          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push("/profile-page/savedaddress")}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="location-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.text }]}>Saved Addresses</Text>
              <Text style={[styles.rowSubtitle, { color: theme.subText }]}>Manage your pickup/delivery addresses</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.subText} />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrap, { backgroundColor: "#FDEAEA" }]}>
              <Ionicons name="log-out-outline" size={20} color="#E53935" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: "#E53935" }]}>Log Out</Text>
            </View>
          </TouchableOpacity>
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
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  rowSubtitle: { fontSize: 12.5 },
});