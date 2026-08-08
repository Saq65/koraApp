import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

function getGreeting(t: (key: string) => string) {
  const hour = new Date().getHours();
  if (hour < 12) return { text: t("header.good_morning"), emoji: "🌅" };
  if (hour < 17) return { text: t("header.good_afternoon"), emoji: "☀️" };
  if (hour < 21) return { text: t("header.good_evening"), emoji: "🌆" };
  return { text: t("header.good_night"), emoji: "🌙" };
}

export default function Header({ theme, onMenuPress, userName }: any) {
  const { t } = useTranslation();
  const { text, emoji } = getGreeting(t);

  return (
    <View style={styles.header}>
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
            {userName || t("header.guest")}
          </Text>
        </View>
      </View>

      {/* RIGHT: Bell icon */}
      <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.iconButton}>
        <Ionicons name="notifications-outline" size={22} color={theme.text} />
      </TouchableOpacity>
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
    borderColor: "#f0f0f0",
    borderBottomWidth: 1,
    backgroundColor: "#fff",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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