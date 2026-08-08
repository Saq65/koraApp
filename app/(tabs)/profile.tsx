import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { clearAll, getUser } from "../../src/utils/storage";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { getProfile } from "../../src/services/customer";
import { useTranslation } from "react-i18next";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
  });
  const [stats, setStats] = useState({
    orders: 0,
    wallet: 0,
    rating: 0,
  });

  // Load from local storage instantly, then fetch fresh data in background
  const loadProfile = async () => {
    // 1. INSTANT: show stored user data (no network)
    const storedUser = await getUser();
    if (storedUser) {
      setProfile({
        fullName: storedUser.name || "",
        email: storedUser.email || "",
        phone: storedUser.mobile || "",
        dob: storedUser.dob || "",
      });
      setLoading(false); // show UI immediately with cached data
    }

    // 2. BACKGROUND: fetch latest from server and update stats
    try {
      const response = await getProfile();
      const data = response.data;
      
      // Update profile with fresh data (e.g., DOB might come from API)
      setProfile({
        fullName: data.fullName || storedUser?.name || "User",
        email: data.email || storedUser?.email || "",
        phone: data.mobile || storedUser?.mobile || "",
        dob: data.dob ? data.dob.split("T")[0] : "",
      });
      
      setStats({
        orders: data.totalOrders || 0,
        wallet: data.walletBalance || 0,
        rating: data.rating || 0,
      });
    } catch (error) {
      console.log("Background refresh error:", error);
      // Don't show error alert – cached data is still shown
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleLogout = async () => {
    await clearAll();
    router.replace("/(auth)/login");
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    if (phone.startsWith("+91") && phone.length === 13) {
      return `${phone.slice(0, 3)} ${phone.slice(3, 8)} ${phone.slice(8)}`;
    }
    return phone;
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount}`;
  };

  const MenuItem = ({ icon, title, subtitle, rightElement, onPress }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.primaryLight || (isDarkMode ? "#1F2937" : "#E6F4F1") },
          ]}
        >
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>
        <View>
          <Text style={[styles.menuText, { color: theme.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.menuSubtitle, { color: theme.textSecondary || (isDarkMode ? "#9CA3AF" : "#6B7280") }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement ? (
        rightElement
      ) : (
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary || (isDarkMode ? "#9CA3AF" : "#6B7280")} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <AppBackground>
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </AppBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <AppBackground>
        <ScrollView style={styles.container}>
          {/* HEADER CARD */}
          <View style={[styles.headerCard, { backgroundColor: theme.primary }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(profile.fullName)}</Text>
            </View>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.phone}>{formatPhoneNumber(profile.phone)}</Text>
            <Text style={styles.email}>{profile.email}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.orders}</Text>
                <Text style={styles.statLabel}>{t("profile.orders")}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{formatCurrency(stats.wallet)}</Text>
                <Text style={styles.statLabel}>{t("profile.wallet")}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{stats.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>{t("profile.rating")}</Text>
              </View>
            </View>
          </View>

          {/* MENU */}
          <View style={styles.menuContainer}>
            <MenuItem
              icon="moon-outline"
              title={t("profile.dark_mode")}
              subtitle={t("profile.dark_mode_sub")}
              rightElement={
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor={isDarkMode ? "#fff" : "#f4f3f4"}
                />
              }
              onPress={() => {}}
            />
            <MenuItem
              icon="person-outline"
              title={t("profile.personal_details")}
              subtitle={t("profile.personal_details_sub")}
              onPress={() => router.push("/profile-page/personal-details")}
            />
            <MenuItem
              icon="cube-outline"
              title={t("profile.order_history")}
              subtitle={t("profile.order_history_sub", { count: stats.orders })}
              onPress={() => router.push("/profile-page/orderhistory" as any)}
            />
            <MenuItem
              icon="location-outline"
              title={t("profile.saved_addresses")}
              subtitle={t("profile.saved_addresses_sub")}
              onPress={() => router.push("/profile-page/savedaddress" as any)}
            />
            <MenuItem
              icon="star-outline"
              title={t("profile.rate_us")}
              subtitle={t("profile.rate_us_sub")}
              onPress={() => console.log("Rate Us")}
            />
            <MenuItem
              icon="notifications-outline"
              title={t("profile.notifications")}
              subtitle={t("profile.notifications_sub")}
              onPress={() => console.log("Notifications")}
            />
            <MenuItem
              icon="language-outline"
              title={t("profile.language")}
              subtitle={t("profile.language_sub")}
              onPress={() => router.push("/profile-page/language")}
            />
            <MenuItem
              icon="settings-outline"
              title={t("profile.settings")}
              subtitle={t("profile.settings_sub")}
              onPress={() => console.log("Settings")}
            />
          </View>

          {/* LOGOUT BUTTON */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t("profile.logout")}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerCard: { padding: 20, borderBottomLeftRadius: 25, borderBottomRightRadius: 25, alignItems: "center" },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#ffffff33", justifyContent: "center", alignItems: "center", marginBottom: 10 },
  avatarText: { fontSize: 28, color: "#fff", fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "700", color: "#fff" },
  phone: { color: "#fff", marginTop: 5, fontSize: 14 },
  email: { color: "#fff", fontSize: 12, marginBottom: 15, opacity: 0.9 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", width: "100%", marginTop: 10 },
  statBox: { alignItems: "center", flex: 1 },
  statNumber: { color: "#fff", fontSize: 18, fontWeight: "700" },
  statLabel: { color: "#fff", fontSize: 12, opacity: 0.9 },
  menuContainer: { marginTop: 20, paddingHorizontal: 15 },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  menuText: { fontSize: 15, fontWeight: "500" },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  logoutBtn: { marginTop: 30, marginHorizontal: 20, padding: 15, borderRadius: 14, backgroundColor: "#ff4d4d", alignItems: "center" },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});