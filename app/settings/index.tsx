import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";
import { clearAll } from "../../src/utils/storage";

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const handleLogout = () => {
    Alert.alert(
      t("settings_page.logout"),
      t("settings_page.logout_confirm"),
      [
        {
          text: t("settings_page.cancel"),
          style: "cancel",
        },
        {
          text: t("settings_page.logout"),
          style: "destructive",
          onPress: async () => {
            try {
              await clearAll();
              router.replace("/(auth)/email-login");
            } catch (error) {
              console.log("Logout error:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
      edges={["top"]}
    >
      <AppBackground>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.75}
            style={[
              styles.backBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={theme.text}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {t("settings_page.title")}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Dark mode */}
          <View
            style={[
              styles.row,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: theme.primaryLight,
                },
              ]}
            >
              <Ionicons
                name={isDarkMode ? "moon" : "moon-outline"}
                size={20}
                color={theme.primary}
              />
            </View>

            <View style={styles.rowTextContainer}>
              <Text
                style={[
                  styles.rowLabel,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {t("settings_page.dark_mode")}
              </Text>

              <Text
                style={[
                  styles.rowSubtitle,
                  {
                    color: theme.subText,
                  },
                ]}
              >
                {isDarkMode
                  ? t("settings_page.currently_on")
                  : t("settings_page.currently_off")}
              </Text>
            </View>

            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{
                false: theme.border,
                true: theme.primary,
              }}
              thumbColor={theme.white}
              ios_backgroundColor={theme.border}
            />
          </View>

          {/* Language */}
          <TouchableOpacity
            style={[
              styles.row,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push("/profile-page/language")}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: theme.primaryLight,
                },
              ]}
            >
              <Ionicons
                name="language-outline"
                size={20}
                color={theme.primary}
              />
            </View>

            <View style={styles.rowTextContainer}>
              <Text
                style={[
                  styles.rowLabel,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {t("settings_page.language")}
              </Text>

              <Text
                style={[
                  styles.rowSubtitle,
                  {
                    color: theme.subText,
                  },
                ]}
              >
                {t("settings_page.change_app_language")}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.subText}
            />
          </TouchableOpacity>

          {/* Saved addresses */}
          <TouchableOpacity
            style={[
              styles.row,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.push("/profile-page/savedaddress")}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: theme.primaryLight,
                },
              ]}
            >
              <Ionicons
                name="location-outline"
                size={20}
                color={theme.primary}
              />
            </View>

            <View style={styles.rowTextContainer}>
              <Text
                style={[
                  styles.rowLabel,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {t("settings_page.saved_addresses")}
              </Text>

              <Text
                style={[
                  styles.rowSubtitle,
                  {
                    color: theme.subText,
                  },
                ]}
              >
                {t("settings_page.manage_addresses")}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.subText}
            />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[
              styles.row,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={handleLogout}
            activeOpacity={0.75}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(229, 57, 53, 0.16)"
                    : "#FDEAEA",
                },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#E53935"
              />
            </View>

            <View style={styles.rowTextContainer}>
              <Text
                style={[
                  styles.rowLabel,
                  {
                    color: "#E53935",
                    marginBottom: 0,
                  },
                ]}
              >
                {t("settings_page.logout")}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
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
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: 12,
  },

  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },

  row: {
    width: "100%",
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },

  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: 12,
  },

  rowTextContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 2,
  },

  rowSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    flexShrink: 1,
  },
});