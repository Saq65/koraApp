import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good Morning", emoji: "🌅" };
  if (hour < 17) return { text: "Good Afternoon", emoji: "☀️" };
  // For 17:00 onwards (including night), always show "Good Evening"
  return { text: "Good Evening", emoji: "🌙" };
}

export default function Header({ theme, onMenuPress, userName }: any) {
  const { text, emoji } = getGreeting();

  // Dynamic styles based on theme
  const styles = getStyles(theme);

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
            {userName || "Guest"}
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

const getStyles = (theme: any) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 4,
      height: 60,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.card,  // matches card background like other screens
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconButton: {
      padding: 6,
      borderRadius: 8,
      backgroundColor: theme.primaryLight,  // consistent with icon backgrounds elsewhere
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