import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

// ─── Responsive helpers ────────────────────────────────────────
const { width: W, height: H } = Dimensions.get("window");
const r  = (n: number) => Math.round((W / 375) * n);
const rv = (n: number) => Math.round((H / 812) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;

// ─── Design tokens ─────────────────────────────────────────────
const C = {
  teal:        "#1a7a6e",
  tealLight:   "#e0f5f2",
  tealXLight:  "#eef9f7",
  tealDark:    "#0f5249",
  tealGrad1:   "#1a7a6e",
  tealGrad2:   "#0f5249",
  surface:     "#ffffff",
  bg:          "#f2f6f5",
  ink:         "#0e1c1a",
  inkMid:      "#4a6360",
  inkLight:    "#8aa8a4",
  border:      "#dce8e6",
  red:         "#e53935",
  dot:         "#1a7a6e",
  amber:       "#f59e0b",
} as const;

const ios_shadow = {
  shadowColor: "#0a3530",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
};

// ─── Types ─────────────────────────────────────────────────────
type NotifIcon = "rider" | "package" | "assigned" | "delivery" | "done" | "location";

interface Notification {
  id: string;
  icon: NotifIcon;
  title: string;
  body: string;
  time: string;
  tag: string;
  isUnread: boolean;
  group: "TODAY" | "YESTERDAY" | "EARLIER";
}

// ─── Sample data ───────────────────────────────────────────────
const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    icon: "rider",
    title: "Rider is on the way 🛵",
    body: "Rahul (★ 4.8) is arriving in ~8 mins to pick up your order #KR-2847. Vehicle: MH-12 AB 4521",
    time: "Just now",
    tag: "#KR-2847",
    isUnread: true,
    group: "TODAY",
  },
  {
    id: "2",
    icon: "package",
    title: "Ready for Pickup",
    body: "Please keep your 12 items ready. Rider will reach your doorstep shortly.",
    time: "2 mins ago",
    tag: "#KR-2847",
    isUnread: true,
    group: "TODAY",
  },
  {
    id: "3",
    icon: "assigned",
    title: "Rider Assigned",
    body: "Rahul has been assigned for your pickup. You'll receive live updates.",
    time: "5 mins ago",
    tag: "#KR-2847",
    isUnread: false,
    group: "TODAY",
  },
  {
    id: "4",
    icon: "delivery",
    title: "Out for Delivery 📦",
    body: "Your order #KR-2846 is out for delivery. Expected by 4:30 PM today.",
    time: "1 hour ago",
    tag: "#KR-2846",
    isUnread: false,
    group: "TODAY",
  },
  {
    id: "5",
    icon: "done",
    title: "Order Delivered ✅",
    body: "Your order #KR-2846 has been delivered successfully. Rate your experience.",
    time: "Yesterday, 5:10 PM",
    tag: "#KR-2846",
    isUnread: false,
    group: "YESTERDAY",
  },
  {
    id: "6",
    icon: "location",
    title: "Service Area Expanded",
    body: "We now serve Koregaon Park & Viman Nagar. Enjoy same-day laundry pickup!",
    time: "Yesterday, 10:00 AM",
    tag: "#Update",
    isUnread: false,
    group: "YESTERDAY",
  },
];

// ─── Notif icon renderer ───────────────────────────────────────
function NotifIconView({ icon }: { icon: NotifIcon }) {
  let bg   = C.tealXLight;
  let borderColor = C.tealLight;

  const iconMap: Record<NotifIcon, React.ReactNode> = {
    rider:    <MaterialCommunityIcons name="bike-fast" size={r(20)} color={C.teal} />,
    package:  <MaterialCommunityIcons name="package-variant-closed" size={r(20)} color={C.amber} />,
    assigned: <MaterialCommunityIcons name="bike-fast" size={r(20)} color={C.teal} />,
    delivery: <MaterialCommunityIcons name="package-variant" size={r(20)} color={C.amber} />,
    done:     <Ionicons name="checkmark-circle-outline" size={r(20)} color={C.teal} />,
    location: <Ionicons name="location-outline" size={r(20)} color={C.teal} />,
  };


  return (
    <View style={[notifIconStyles.circle, { backgroundColor: bg, borderColor }]}>
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

// ─── Notification row ──────────────────────────────────────────
function NotifRow({
  notif,
  onMarkRead,
}: {
  notif: Notification;
  onMarkRead: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.notifCard, notif.isUnread && styles.notifCardUnread]}
      activeOpacity={0.75}
      onPress={() => onMarkRead(notif.id)}
    >
      <NotifIconView icon={notif.icon} />

      <View style={styles.notifBody}>
        <Text style={styles.notifTitle}>{notif.title}</Text>
        <Text style={styles.notifText}>{notif.body}</Text>
        <View style={styles.notifMeta}>
          <Text style={styles.notifTime}>{notif.time}</Text>
          <View style={styles.notifTag}>
            <Text style={styles.notifTagText}>{notif.tag}</Text>
          </View>
        </View>
      </View>

      {/* Unread dot */}
      {notif.isUnread && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

// ─── Live tracking banner ──────────────────────────────────────
function LiveTrackingBanner() {
  return (
    <View style={styles.liveCard}>
      {/* LIVE TRACKING label */}
      <View style={styles.livePill}>
        <View style={styles.liveDot} />
        <Text style={styles.livePillText}>LIVE TRACKING</Text>
      </View>

      <View style={styles.liveRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.liveOrderId}>Order #KR-2847</Text>
          <View style={styles.liveEtaRow}>
            <Ionicons name="time-outline" size={r(13)} color="rgba(255,255,255,0.8)" style={{ marginRight: r(4) }} />
            <Text style={styles.liveEta}>Rider arriving in ~8 mins</Text>
          </View>
        </View>

        {/* Bike icon circle */}
        <View style={styles.liveBikeCircle}>
          <MaterialCommunityIcons name="bike-fast" size={r(22)} color={C.teal} />
        </View>
      </View>
    </View>
  );
}

// ─── Section header ────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>(NOTIFICATIONS);

  const unreadCount = notifications.filter(n => n.isUnread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
  };

  const markRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isUnread: false } : n)
    );
  };

  // Group notifications
  const today     = notifications.filter(n => n.group === "TODAY");
  const yesterday = notifications.filter(n => n.group === "YESTERDAY");
  const earlier   = notifications.filter(n => n.group === "EARLIER");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={r(20)} color={C.ink} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount} new updates</Text>
          )}
        </View>

        <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* ── SCROLL ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {/* Live tracking banner */}
        <LiveTrackingBanner />

        {/* TODAY */}
        {today.length > 0 && (
          <>
            <SectionHeader title="TODAY" />
            {today.map(n => (
              <NotifRow key={n.id} notif={n} onMarkRead={markRead} />
            ))}
          </>
        )}

        {/* YESTERDAY */}
        {yesterday.length > 0 && (
          <>
            <SectionHeader title="YESTERDAY" />
            {yesterday.map(n => (
              <NotifRow key={n.id} notif={n} onMarkRead={markRead} />
            ))}
          </>
        )}

        {/* EARLIER */}
        {earlier.length > 0 && (
          <>
            <SectionHeader title="EARLIER" />
            {earlier.map(n => (
              <NotifRow key={n.id} notif={n} onMarkRead={markRead} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: r(16),
    paddingTop: rv(8),
    paddingBottom: rv(12),
    backgroundColor: C.bg,
  },
  backBtn: {
    width: r(36),
    height: r(36),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: r(18),
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({ ios: ios_shadow }),
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: rm(18),
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: rm(12),
    fontWeight: "500",
    color: C.teal,
    marginTop: rv(1),
  },
  markAllText: {
    fontSize: rm(13),
    fontWeight: "600",
    color: C.teal,
  },

  // List container
  listContent: {
    paddingBottom: rv(32),
  },

  // ── LIVE TRACKING BANNER ──
  liveCard: {
    marginHorizontal: r(16),
    marginBottom: rv(20),
    borderRadius: r(18),
    backgroundColor: C.tealDark,
    padding: r(18),
    ...Platform.select({
      ios: {
        shadowColor: C.tealDark,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: rv(10),
    gap: r(5),
  },
  liveDot: {
    width: r(7),
    height: r(7),
    borderRadius: r(4),
    backgroundColor: "#4ade80",
  },
  livePillText: {
    fontSize: rm(10),
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.2,
  },
  liveRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveOrderId: {
    fontSize: rm(20),
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.4,
    marginBottom: rv(4),
  },
  liveEtaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveEta: {
    fontSize: rm(12.5),
    fontWeight: "400",
    color: "rgba(255,255,255,0.75)",
  },
  liveBikeCircle: {
    width: r(48),
    height: r(48),
    borderRadius: r(24),
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },

  // ── SECTION HEADER ──
  sectionHeader: {
    paddingHorizontal: r(16),
    paddingTop: rv(4),
    paddingBottom: rv(8),
  },
  sectionTitle: {
    fontSize: rm(11),
    fontWeight: "800",
    color: C.inkLight,
    letterSpacing: 1.1,
  },

  // ── NOTIFICATION CARD ──
  notifCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: C.surface,
    marginHorizontal: r(16),
    marginBottom: r(10),
    borderRadius: r(16),
    padding: r(14),
    gap: r(12),
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({ ios: ios_shadow}),
  },
  notifCardUnread: {
    borderColor: C.teal + "40",
    backgroundColor: C.tealXLight,
  },
  notifBody: {
    flex: 1,
  },
  notifTitle: {
    fontSize: rm(14),
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.15,
    marginBottom: rv(3),
  },
  notifText: {
    fontSize: rm(12.5),
    fontWeight: "400",
    color: C.inkMid,
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
    color: C.inkLight,
  },
  notifTag: {
    backgroundColor: C.tealLight,
    borderRadius: r(6),
    paddingHorizontal: r(7),
    paddingVertical: rv(2),
  },
  notifTagText: {
    fontSize: rm(10.5),
    fontWeight: "700",
    color: C.tealDark,
    letterSpacing: 0.2,
  },

  // Unread dot
  unreadDot: {
    width: r(9),
    height: r(9),
    borderRadius: r(5),
    backgroundColor: C.dot,
    marginTop: rv(4),
    flexShrink: 0,
  },
});