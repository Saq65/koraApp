import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../src/theme/ThemeProvider";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  NotificationItem,
} from "../src/api/notifications";
import { useNotificationContext } from "../src/context/NotificationContext";

// ─── Responsive helpers ────────────────────────────────────────
const { width: W, height: H } = Dimensions.get("window");
const r = (n: number) => Math.round((W / 375) * n);
const rv = (n: number) => Math.round((H / 812) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;

// ─── Types ─────────────────────────────────────────────────────
type NotifIcon = "rider" | "package" | "assigned" | "delivery" | "done" | "location" | "cancelled";

type Group = "TODAY" | "YESTERDAY" | "EARLIER";

// Maps the backend's notification "type" enum to a display icon.
const TYPE_TO_ICON: Record<NotificationItem["type"], NotifIcon> = {
  order_placed: "package",
  order_accepted: "assigned",
  order_picked_up: "rider",
  order_at_sp: "package",
  order_cleaned: "package",
  order_out_for_delivery: "delivery",
  order_delivered: "done",
  order_cancelled: "cancelled",
  admin_broadcast: "location",
  general: "location",
};

function formatRelativeTime(iso: string, t: any): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return t("notifications.just_now");

  if (diffMins < 60) {
    return t("notifications.minutes_ago", { count: diffMins });
  }

  const diffHours = Math.floor(diffMins / 60);

  if (diffHours < 24 && isSameDay(date, now)) {
    return t("notifications.hours_ago", { count: diffHours });
  }

  const time = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isSameDay(date, yesterday(now))) {
    return t("notifications.yesterday_at", { time });
  }

  const formattedDate = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return t("notifications.date_at", {
    date: formattedDate,
    time,
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function yesterday(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - 1);
  return d;
}

function groupFor(iso: string): Group {
  const date = new Date(iso);
  const now = new Date();
  if (isSameDay(date, now)) return "TODAY";
  if (isSameDay(date, yesterday(now))) return "YESTERDAY";
  return "EARLIER";
}

// ─── Notif icon renderer ───────────────────────────────────────
function NotifIconView({ icon, theme }: { icon: NotifIcon; theme: any }) {
  const getColor = () => {
    if (icon === "cancelled") return "#e53935";
    if (icon === "package" || icon === "delivery") return "#f59e0b";
    return theme.primary;
  };

  const getBg = () => {
    if (icon === "cancelled") return "#fde8e8";
    if (icon === "package" || icon === "delivery") return "#fef3c7";
    return theme.primary + "15";
  };

  const iconMap: Record<NotifIcon, React.ReactNode> = {
    rider: <MaterialCommunityIcons name="bike-fast" size={r(20)} color={getColor()} />,
    package: <MaterialCommunityIcons name="package-variant-closed" size={r(20)} color={getColor()} />,
    assigned: <MaterialCommunityIcons name="bike-fast" size={r(20)} color={getColor()} />,
    delivery: <MaterialCommunityIcons name="package-variant" size={r(20)} color={getColor()} />,
    done: <Ionicons name="checkmark-circle-outline" size={r(20)} color={getColor()} />,
    location: <Ionicons name="location-outline" size={r(20)} color={getColor()} />,
    cancelled: <Ionicons name="close-circle-outline" size={r(20)} color={getColor()} />,
  };

  return (
    <View style={[notifIconStyles.circle, { backgroundColor: getBg(), borderColor: getColor() + "30" }]}>
      {iconMap[icon]}
    </View>
  );
}

const notifIconStyles = StyleSheet.create({
  circle: {
    width: r(42),
    height: r(42),
    borderRadius: r(21),
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});

// Returns translated text for known notification types.
// Dynamic admin/general notifications continue using backend-provided text.
function getNotificationText(notif: NotificationItem, t: any) {
  const translationTypes = new Set([
    "order_placed",
    "order_accepted",
    "order_picked_up",
    "order_at_sp",
    "order_cleaned",
    "order_out_for_delivery",
    "order_delivered",
    "order_cancelled",
  ]);

  if (!translationTypes.has(notif.type)) {
    return {
      title: notif.title,
      body: notif.body,
    };
  }

  const baseKey = `notifications.types.${notif.type}`;
  const values = {
    orderNumber: notif.orderNumber ?? "",
  };

  return {
    title: t(`${baseKey}.title`, values),
    body: t(`${baseKey}.body`, values),
  };
}

// ─── Notification row ──────────────────────────────────────────
function NotifRow({
  notif,
  onPress,
  theme,
  t,
}: {
  notif: NotificationItem;
  onPress: (notif: NotificationItem) => void;
  theme: any;
  t: any;
}) {
  const isUnread = !notif.read;
  const translated = getNotificationText(notif, t);
  return (
    <TouchableOpacity
      style={[
        styles.notifCard,
        {
          backgroundColor: isUnread
            ? theme.card
            : theme.background === "#000000"
              ? theme.card
              : "#F5F7F7",
          borderColor: isUnread ? theme.primary + "38" : theme.border,
        },
      ]}
      activeOpacity={0.75}
      onPress={() => onPress(notif)}
    >
      <NotifIconView icon={TYPE_TO_ICON[notif.type] ?? "location"} theme={theme} />

      <View style={styles.notifBody}>
        <Text style={[styles.notifTitle, { color: theme.text }]}>{translated.title}</Text>
        <Text style={[styles.notifText, { color: theme.subText }]}>{translated.body}</Text>
        <View style={styles.notifMeta}>
          <Text style={[styles.notifTime, { color: theme.subText + "80" }]}>
            {formatRelativeTime(notif.createdAt, t)}
          </Text>
          {notif.orderNumber ? (
            <View style={[styles.notifTag, { backgroundColor: theme.primary + "15" }]}>
              <Text style={[styles.notifTagText, { color: theme.primary }]}>#{notif.orderNumber}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {isUnread && <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />}
    </TouchableOpacity>
  );
}

// ─── Section header ────────────────────────────────────────────
function SectionHeader({ title, theme }: { title: string; theme: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.subText + "80" }]}>{title}</Text>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function Notifications() {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();
  const { refreshUnreadCount } = useNotificationContext();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const res = await getNotifications();
      if (res?.success) {
        setNotifications(res.data ?? []);
      } else {
        setError(res?.message ?? t("notifications.load_failed"));
      }
    } catch (err: any) {
      setError(err?.message ?? t("notifications.load_failed"));
    }
  }, [t]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
    } finally {
      refreshUnreadCount();
    }
  };

  const handlePress = async (notif: NotificationItem) => {
    if (!notif.read) {
      setNotifications((prev) => prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n)));
      try {
        await markNotificationRead(notif._id);
      } finally {
        refreshUnreadCount();
      }
    }
    if (notif.orderNumber) {
      router.push(`/order/orderDetails?id=${notif.orderNumber}`);
    }
  };

  // Group notifications by real date, most recent first
  const today = notifications.filter((n) => groupFor(n.createdAt) === "TODAY");
  const yesterdayGroup = notifications.filter((n) => groupFor(n.createdAt) === "YESTERDAY");
  const earlier = notifications.filter((n) => groupFor(n.createdAt) === "EARLIER");

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top"]}>
      <View style={[styles.screenSurface, { backgroundColor: theme.background }]} >
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />
        
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.card, shadowColor: isDarkMode ? "#000" : "#000" }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={r(20)} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {t("notifications.title")}
            </Text>
            {unreadCount > 0 && (
              <Text style={[styles.headerSub, { color: theme.primary }]}>
                {unreadCount} {t("notifications.new_updates")}
              </Text>
            )}
          </View>

          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} disabled={unreadCount === 0}>
            <Text style={[
              styles.markAllText, 
              { color: theme.primary },
              unreadCount === 0 && { opacity: 0.4 }
            ]}>
              {t("notifications.mark_all_read")}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerFill}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : error ? (
          <View style={styles.centerFill}>
            <Ionicons name="alert-circle-outline" size={r(40)} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.subText }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryBtn, { backgroundColor: theme.primary }]} 
              onPress={() => { setLoading(true); load().finally(() => setLoading(false)); }}
            >
              <Text style={styles.retryBtnText}>{t("common.retry")}</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerFill}>
            <Ionicons name="notifications-off-outline" size={r(40)} color={theme.subText} />
            <Text style={[styles.emptyText, { color: theme.text }]}>
              {t("notifications.no_notifications")}
            </Text>
            <Text style={[styles.emptySubText, { color: theme.subText }]}>
              {t("notifications.no_notifications_desc")}
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh} 
                tintColor={theme.primary} 
              />
            }
          >
            {/* TODAY */}
            {today.length > 0 && (
              <>
                <SectionHeader title={t("notifications.today")} theme={theme} />
                {today.map((n) => (
                  <NotifRow key={n._id} notif={n} onPress={handlePress} theme={theme} t={t} />
                ))}
              </>
            )}

            {/* YESTERDAY */}
            {yesterdayGroup.length > 0 && (
              <>
                <SectionHeader title={t("notifications.yesterday")} theme={theme} />
                {yesterdayGroup.map((n) => (
                  <NotifRow key={n._id} notif={n} onPress={handlePress} theme={theme} t={t} />
                ))}
              </>
            )}

            {/* EARLIER */}
            {earlier.length > 0 && (
              <>
                <SectionHeader title={t("notifications.earlier")} theme={theme} />
                {earlier.map((n) => (
                  <NotifRow key={n._id} notif={n} onPress={handlePress} theme={theme} t={t} />
                ))}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  screenSurface: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: r(16),
    paddingTop: rv(8),
    paddingBottom: rv(12),
  },
  backBtn: {
    width: r(36),
    height: r(36),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: r(18),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: rm(18),
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: rm(12),
    fontWeight: "500",
    marginTop: rv(1),
  },
  markAllText: {
    fontSize: rm(13),
    fontWeight: "600",
  },

  // List container
  listContent: {
    paddingTop: rv(2),
    paddingBottom: rv(32),
  },

  // ── LOADING / ERROR / EMPTY STATES ──
  centerFill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: r(32),
    gap: rv(10),
  },
  emptyText: {
    fontSize: rm(14),
    fontWeight: "600",
    textAlign: "center",
  },
  emptySubText: {
    fontSize: rm(12.5),
    textAlign: "center",
  },
  retryBtn: {
    marginTop: rv(6),
    paddingHorizontal: r(20),
    paddingVertical: rv(10),
    borderRadius: r(24),
  },
  retryBtnText: {
    color: "#fff",
    fontSize: rm(13),
    fontWeight: "700",
  },

  // ── SECTION HEADER ──
  sectionHeader: {
    paddingHorizontal: r(16),
    paddingTop: rv(8),
    paddingBottom: rv(7),
  },
  sectionTitle: {
    fontSize: rm(11),
    fontWeight: "800",
    letterSpacing: 1.1,
  },

  // ── NOTIFICATION CARD ──
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: r(16),
    marginBottom: r(9),
    borderRadius: r(15),
    paddingHorizontal: r(13),
    paddingVertical: r(12),
    gap: r(11),
    borderWidth: 1,
    overflow: "hidden",
  },
  notifBody: {
    flex: 1,
  },
  notifTitle: {
    fontSize: rm(14),
    fontWeight: "700",
    letterSpacing: -0.15,
    marginBottom: rv(3),
  },
  notifText: {
    fontSize: rm(12.5),
    fontWeight: "400",
    lineHeight: rm(18),
  },
  notifMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: rv(8),
    gap: r(8),
  },
  notifTime: {
    fontSize: rm(11),
    fontWeight: "400",
  },
  notifTag: {
    borderRadius: r(6),
    paddingHorizontal: r(7),
    paddingVertical: rv(2),
  },
  notifTagText: {
    fontSize: rm(10.5),
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // Unread dot
  unreadDot: {
    width: r(9),
    height: r(9),
    borderRadius: r(5),
    marginTop: rv(4),
    flexShrink: 0,
  },
});