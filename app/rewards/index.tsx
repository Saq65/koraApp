import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";

export default function RewardsScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <AppBackground>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />

        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>
            {t("rewards_page.title")}
          </Text>
        </View>

        <View style={styles.center}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: theme.primaryLight,
                borderColor: theme.border,
              },
            ]}
          >
            <Ionicons
              name="trophy-outline"
              size={42}
              color={theme.primary}
            />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {t("rewards_page.coming_soon")}
          </Text>

          <Text style={[styles.subtitle, { color: theme.subText }]}>
            {t("rewards_page.description")}
          </Text>
        </View>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 36,
    paddingBottom: 40,
  },

  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },

  title: {
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    width: "100%",
    maxWidth: 420,
    fontSize: 13.5,
    lineHeight: 21,
    textAlign: "center",
  },
});