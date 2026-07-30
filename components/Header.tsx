import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import LanguageSelector from "./LanguageSelector";


function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "🌅" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "☀️" };
  return { text: "Good Evening", emoji: "🌙" };
}

export default function Header({ theme, onMenuPress, userName }: any) {
  const { text, emoji } = getGreeting();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.background ?? "#fff",
          borderColor: theme.border ?? "#f0f0f0",
        },
      ]}
    >
      {/* LEFT: Menu icon + greeting/name */}
      <View style={styles.left}>
        <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
          <Ionicons name="menu" size={24} color={theme.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.greeting, { color: theme.subText }]}>
            {text} {emoji}
          </Text>
          <Text style={[styles.name, { color: theme.text }]}>
            {userName || "Guest"}
          </Text>
        </View>
      </View>

      {/* RIGHT: Language selector + Bell icon */}
      <View style={styles.right}>
        <LanguageSelector />
        <TouchableOpacity
          onPress={() => router.push("/notifications")}
          style={styles.iconButton}
        >
          <Ionicons name="notifications-outline" size={22} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    height: 60,
    borderBottomWidth: 1,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  greeting: {
    fontSize: 13,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 24,
  },
});