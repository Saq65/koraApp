import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Header({ theme, onMenuPress }: any) {
  return (
    <View style={styles.header}>
      {/* LEFT: Menu icon + greeting/name */}
      <View style={styles.left}>
        <TouchableOpacity style={styles.iconButton} onPress={onMenuPress}>
          <Ionicons name="menu" size={24} color={theme.text} />
        </TouchableOpacity>
        <View>
          <Text style={[styles.greeting, { color: theme.subText }]}>
            Good Morning 👋
          </Text>
          <Text style={[styles.name, { color: theme.text }]}>John</Text>
        </View>
      </View>

      {/* RIGHT: Bell icon */}
      <TouchableOpacity style={styles.iconButton}>
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
    paddingTop: 8,
    paddingBottom: 4,
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