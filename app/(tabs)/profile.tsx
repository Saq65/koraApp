import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Switch, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/theme/ThemeProvider";
import { clearAll, getUser } from "../../src/utils/storage";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import AppBackground from "@/components/AppBackground";
import { getProfile } from "../../src/services/customer";
import { getNotificationPreference, updateNotificationPreference } from "../../src/api/notifications";
import { responsiveFontSize } from "react-native-responsive-dimensions";
import { useTranslation } from "react-i18next";

export default function ProfileScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    fullName: "", email: "", phone: "", dob: "",
  });
  const [stats, setStats] = useState<{ orders: number; wallet: number | string; rating: number }>({
    orders: 0, wallet: 100, rating: 0,
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifPrefLoading, setNotifPrefLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getNotificationPreference();
        if (res?.success) {
          setNotificationsEnabled(res.data?.notificationsEnabled !== false);
        }
      } catch {
        // Silent — defaults to enabled; the toggle will just reflect the
        // real value next time this screen is opened with a network.
      }
    })();
  }, []);

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value); // optimistic
    setNotifPrefLoading(true);
    try {
      const res = await updateNotificationPreference(value);
      if (res?.success) {
        setNotificationsEnabled(res.data?.notificationsEnabled !== false);
      } else {
        setNotificationsEnabled(!value); // revert on failure
      }
    } catch {
      setNotificationsEnabled(!value); // revert on failure
    } finally {
      setNotifPrefLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `₹${amount}`;

  const loadProfile = async () => {
    const storedUser = await getUser();
    if (storedUser) {
      setProfile({
        fullName: storedUser.name || "",
        email: storedUser.email || "",
        phone: storedUser.mobile || "",
        dob: storedUser.dob || "",
      });
      setLoading(false);
    }
    try {
      const data = await getProfile();
      setProfile({
        fullName: data.fullName || storedUser?.name || "User",
        email: data.email || storedUser?.email || "",
        phone: data.mobile || storedUser?.mobile || "",
        dob: data.dob ? data.dob.split("T")[0] : "",
      });
      setStats({
        orders: data.totalOrders || 0,
        wallet: data.walletBalance ?? 0,
        rating: data.rating || 0,
      });
    } catch (error) {
      console.log("Background refresh error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleLogout = async () => {
    await clearAll();
    router.replace("/(auth)/email-login");
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

  const MenuItem = ({
    icon, title, subtitle, rightElement, onPress,
  }: {
    icon: string; title: string; subtitle?: string;
    rightElement?: React.ReactNode; onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: theme.border || (isDarkMode ? "#374151" : "#E5E7EB") }]}
      onPress={onPress}
    >
      <View style={styles.menuLeft}>
        <View style={[styles.iconBox, { backgroundColor: theme.primaryLight || (isDarkMode ? "#1F2937" : "#E6F4F1") }]}>
          <Ionicons name={icon as any} size={18} color={theme.primary} />
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
      {rightElement ?? (
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary || (isDarkMode ? "#9CA3AF" : "#6B7280")} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
        <AppBackground>
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </AppBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <AppBackground>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

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
                <Text style={styles.statNumber}>{formatCurrency(Number(stats.wallet))}</Text>
                <Text style={styles.statLabel}>{t("profile.wallet")}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{Number(stats.rating).toFixed(1)}</Text>
                <Text style={styles.statLabel}>{t("profile.rating")}</Text>
              </View>
            </View>
          </View>

          {/* WALLET BANNER */}
          <TouchableOpacity
            onPress={() => router.push("/wallet/wallet")}
            style={[styles.walletBanner, { backgroundColor: theme.card || (isDarkMode ? "#1F2937" : "#fff"), shadowColor: isDarkMode ? "#000" : "#ccc" }]}
          >
            <View style={styles.walletLeft}>
              <View style={[styles.walletIconBox, { backgroundColor: theme.primaryLight || (isDarkMode ? "#374151" : "#E6F4F1") }]}>
                <Ionicons name="wallet-outline" size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.walletLabel, { color: theme.textSecondary || (isDarkMode ? "#9CA3AF" : "#6B7280") }]}>
                  {t("profile.wallet_balance")}
                </Text>
                <Text style={[styles.walletAmount, { color: theme.text, fontSize: responsiveFontSize(2.5) }]}>
                  {formatCurrency(Number(stats.wallet))}
                </Text>
              </View>
            </View>
            <View style={styles.walletRight}>
              <Text style={[styles.addMoneyText, { color: theme.primary }]}>{t("profile.add_money")}</Text>
              <Ionicons name="add-circle" size={24} color={theme.primary} />
            </View>
          </TouchableOpacity>

          {/* MENU */}
          <View style={[styles.menuContainer, { backgroundColor: theme.card || (isDarkMode ? "#1F2937" : "#fff") }]}>
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
              icon="chatbubble-outline"
              title={t("profile.raise-complaint")}
              subtitle={t("profile.raise-complaint")}
              onPress={()=>router.push("/profile-page/raiseComplaintScreen" as any)}
            />
            <MenuItem
              icon="list-outline"
              title={t("profile.my_complaints")}
              subtitle={t("profile.my_complaints_sub")}
              onPress={() => router.push("/profile-page/myComplaintsScreen" as any)}
            />
            <MenuItem
              icon="star-outline"
              title={t("profile.rate_us")}
              subtitle={t("profile.rate_us_sub")}
              onPress={() => router.push("/rateus/rateus" as any)}
            />
            <MenuItem
              icon="notifications-outline"
              title={t("profile.notifications")}
              subtitle={t("profile.notifications_sub")}
              onPress={() => router.push("/notifications" as any)}
            />
            <MenuItem
              icon="notifications-circle-outline"
              title={t("profile.push_notifications", "Push Notifications")}
              subtitle={t(
                "profile.push_notifications_sub",
                notificationsEnabled
                  ? "Get alerted about order updates"
                  : "You won't be alerted about order updates"
              )}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  disabled={notifPrefLoading}
                  trackColor={{ false: "#767577", true: theme.primary }}
                  thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
                />
              }
              onPress={() => {}}
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
              onPress={() => router.push("/settings")}
            />
          </View>

          {/* LOGOUT */}
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
  walletBanner: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginHorizontal: 15, marginTop: 16, padding: 14, borderRadius: 14,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  walletLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  walletIconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  walletLabel: { fontSize: 12, marginBottom: 2 },
  walletAmount: { fontWeight: "700" },
  walletRight: { alignItems: "center", gap: 4 },
  addMoneyText: { fontSize: 12, fontWeight: "600" },
  menuContainer: { marginTop: 16, marginHorizontal: 15, borderRadius: 14, paddingHorizontal: 15, overflow: "hidden", elevation: 2, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 15, borderBottomWidth: 1 },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  menuText: { fontSize: 15, fontWeight: "500" },
  menuSubtitle: { fontSize: 12, marginTop: 2 },
  logoutBtn: { marginTop: 20, marginHorizontal: 20, padding: 15, borderRadius: 14, backgroundColor: "#ff4d4d", alignItems: "center" },
  logoutText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});