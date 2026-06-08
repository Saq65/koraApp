import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Platform, ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { getOrderDetails } from "@/src/services/orderService";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";

const { width: W, height: H } = Dimensions.get("window");
const r = (n: number) => Math.round((W / 375) * n);
const rv = (n: number) => Math.round((H / 812) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;

// ─── Status labels (static) ─────────────────────────────────────
const STATUS_LABEL: Record<string, string> = {
  pending_sp: "Order Placed",
  sp_assigned: "SP Assigned",
  sp_accepted: "SP Accepted",
  rider_pickup_assigned: "Rider Assigned for Pickup",
  picked_up: "Order Picked Up",
  at_sp: "At Service Provider",
  cleaned: "Cleaned",
  rider_delivery_assigned: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// ─── Section wrapper (theme‑aware) ─────────────────────────────
function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) {
  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderRadius: r(16),
      padding: r(16),
      borderWidth: 1,
      borderColor: theme.border,
      gap: rv(10),
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
      }),
    },
    title: {
      fontSize: rm(13),
      fontWeight: "600",
      color: theme.subText,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      marginBottom: rv(2),
    },
  });
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Row inside a section ──────────────────────────────────────
function Row({ label, value, valueStyle, theme }: { label: string; value: string; valueStyle?: any; theme: any }) {
  const styles = StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: r(12),
    },
    label: {
      fontSize: rm(13.5),
      color: theme.subText,
      fontWeight: "400",
      flex: 1,
    },
    value: {
      fontSize: rm(13.5),
      color: theme.text,
      fontWeight: "600",
      textAlign: "right",
      flex: 1.2,
    },
  });
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

// ─── Tracking timeline (theme‑aware) ───────────────────────────
function TrackingTimeline({ statusHistory, currentStatus, theme }: {
  statusHistory: { status: string; updatedAt?: string }[];
  currentStatus: string;
  theme: any;
}) {
  const stepOrder = [
    "pending_sp", "sp_assigned", "sp_accepted", "rider_pickup_assigned",
    "picked_up", "at_sp", "cleaned", "rider_delivery_assigned", "delivered", "cancelled",
  ];

  const steps = stepOrder.map((s) => {
    const entry = statusHistory.find((h) => h.status === s);
    return {
      key: s,
      label: STATUS_LABEL[s] ?? s,
      completed: !!entry,
      time: entry?.updatedAt
        ? new Date(entry.updatedAt).toLocaleString("en-IN", {
            day: "2-digit", month: "short",
            hour: "2-digit", minute: "2-digit",
          })
        : null,
    };
  });

  let visible = steps;
  if (currentStatus === "cancelled") {
    const idx = steps.findIndex((s) => s.key === "cancelled");
    visible = steps.slice(0, idx + 1);
  } else {
    const idx = steps.findIndex((s) => s.key === currentStatus);
    visible = steps.slice(0, idx + 2);
  }

  const styles = StyleSheet.create({
    row: { flexDirection: "row", gap: r(12), minHeight: rv(44) },
    lineCol: { alignItems: "center", width: r(20) },
    dot: {
      width: r(20), height: r(20), borderRadius: r(10), borderWidth: 2,
      alignItems: "center", justifyContent: "center",
    },
    line: { width: 2, flex: 1, marginVertical: rv(2) },
    textCol: { flex: 1, paddingBottom: rv(12), gap: rv(2) },
    label: { fontSize: rm(13.5), fontWeight: "500" },
    time: { fontSize: rm(11.5), fontWeight: "400" },
  });

  return (
    <View style={{ gap: 0 }}>
      {visible.map((step, i) => {
        const isLast = i === visible.length - 1;
        return (
          <View key={step.key} style={styles.row}>
            <View style={styles.lineCol}>
              <View style={[
                styles.dot,
                step.completed
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: theme.card, borderColor: theme.border },
              ]}>
                {step.completed && <Ionicons name="checkmark" size={r(9)} color="#fff" />}
              </View>
              {!isLast && (
                <View style={[
                  styles.line,
                  { backgroundColor: step.completed ? theme.primary : theme.border },
                ]} />
              )}
            </View>
            <View style={styles.textCol}>
              <Text style={[
                styles.label,
                { color: step.completed ? theme.text : theme.subText },
              ]}>
                {step.label}
              </Text>
              {step.time && (
                <Text style={[styles.time, { color: theme.subText }]}>{step.time}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function OrderDetailsScreen() {
  const { theme, isDarkMode } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getOrderDetails(id);
        setOrder(res);
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const styles = getGlobalStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top"]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        <AppBackground>
          <Header theme={theme} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        </AppBackground>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top"]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        <AppBackground>
          <Header theme={theme} />
          <View style={styles.centered}>
            <Ionicons name="alert-circle-outline" size={r(40)} color="#E53935" />
            <Text style={[styles.errorText, { color: theme.subText }]}>{error ?? "Order not found"}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={() => router.back()}>
              <Text style={styles.retryText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </AppBackground>
      </SafeAreaView>
    );
  }

  const totalQty = order.items?.reduce((sum: number, i: any) => sum + (i.quantity ?? 0), 0) ?? 0;

  // Status badge config (uses theme for delivered, static for others – but readable in dark mode)
  const getBadgeConfig = (status: string) => {
    if (status === "delivered") return { bg: theme.primaryLight, text: theme.primary, icon: "checkmark-circle-outline", iconColor: theme.primary };
    if (status === "cancelled") return { bg: "#FDEAEA", text: "#E53935", icon: "close-circle-outline", iconColor: "#E53935" };
    return { bg: "#FEF3C7", text: "#92400E", icon: "time-outline", iconColor: "#D97706" };
  };
  const badgeCfg = getBadgeConfig(order.status);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top", "left", "right"]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <AppBackground>
        <Header theme={theme} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Order summary card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.summaryTop}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="package-variant-closed" size={r(22)} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.orderNumber, { color: theme.text }]}>#{order.orderNumber}</Text>
                <Text style={[styles.orderDate, { color: theme.subText }]}>
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: badgeCfg.bg }]}>
                <Ionicons name={badgeCfg.icon} size={r(12)} color={badgeCfg.iconColor} style={{ marginRight: r(3) }} />
                <Text style={[styles.badgeText, { color: badgeCfg.text }]}>
                  {STATUS_LABEL[order.status] ?? order.status}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Row label="Service" value={order.items?.[0]?.serviceName ?? "Laundry"} theme={theme} />
            <Row label="Total items" value={`${totalQty} items`} theme={theme} />
            <Row label="Payment" value={order.paymentMethod ?? "—"} theme={theme} />
          </View>

          {/* Items breakdown */}
          <Section title="Items" theme={theme}>
            {order.items?.map((item: any, i: number) => {
              const itemStyles = getItemStyles(theme);
              return (
                <View key={i} style={itemStyles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[itemStyles.name, { color: theme.text }]}>{item.subCategoryName ?? item.serviceName}</Text>
                    <Text style={[itemStyles.sub, { color: theme.subText }]}>
                      {item.categoryName}
                      {item.serviceName ? ` • ${item.serviceName}` : ""}
                    </Text>
                  </View>
                  <Text style={[itemStyles.qty, { color: theme.subText }]}>×{item.quantity}</Text>
                  <Text style={[itemStyles.price, { color: theme.text }]}>₹{item.totalPrice ?? item.unitPrice * item.quantity}</Text>
                </View>
              );
            })}
          </Section>

          {/* Bill Summary */}
          <Section title="Bill Summary" theme={theme}>
            <Row label="Subtotal" value={`₹${order.subtotal}`} theme={theme} />
            <Row label="Tax (5%)" value={`₹${order.tax}`} theme={theme} />
            {order.discount > 0 && (
              <Row label="Discount" value={`-₹${order.discount}`} valueStyle={{ color: theme.primary }} theme={theme} />
            )}
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <Row
              label="Total"
              value={`₹${order.totalAmount}`}
              valueStyle={{ fontSize: rm(16), fontWeight: "700", color: theme.text }}
              theme={theme}
            />
          </Section>

          {/* Addresses */}
          <Section title="Addresses" theme={theme}>
            <View style={styles.addressBlock}>
              <View style={[styles.addressIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="location-outline" size={r(15)} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.addressLabel, { color: theme.subText }]}>Pickup</Text>
                <Text style={[styles.addressValue, { color: theme.text }]}>{order.pickupAddress?.address ?? "—"}</Text>
              </View>
            </View>
            <View style={[styles.addressBlock, { marginTop: rv(8) }]}>
              <View style={[styles.addressIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="home-outline" size={r(15)} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.addressLabel, { color: theme.subText }]}>Delivery</Text>
                <Text style={[styles.addressValue, { color: theme.text }]}>{order.deliveryAddress?.address ?? "—"}</Text>
              </View>
            </View>
          </Section>

          {/* Tracking timeline */}
          <Section title="Order Timeline" theme={theme}>
            <TrackingTimeline
              statusHistory={order.statusHistory ?? []}
              currentStatus={order.status}
              theme={theme}
            />
          </Section>
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

// ─── Shared header (themed back button) ─────────────────────────
function Header({ theme }: { theme: any }) {
  const styles = StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: r(16),
      paddingTop: rv(8),
      paddingBottom: rv(12),
      backgroundColor: theme.background,
    },
    backBtn: {
      width: r(36),
      height: r(36),
      alignItems: "center",
      justifyContent: "center",
      borderRadius: r(18),
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
      }),
    },
    headerTitle: {
      flex: 1,
      fontSize: rm(18),
      fontWeight: "700",
      textAlign: "center",
      letterSpacing: -0.3,
      color: theme.text,
    },
  });
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={r(20)} color={theme.text} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Order Details</Text>
      <View style={{ width: r(36) }} />
    </View>
  );
}

// ─── Global styles (depends on theme) ──────────────────────────
const getGlobalStyles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1 },
    content: {
      paddingHorizontal: r(16),
      paddingTop: rv(4),
      paddingBottom: rv(40),
      gap: r(12),
    },
    summaryCard: {
      borderRadius: r(16),
      padding: r(16),
      borderWidth: 1,
      gap: rv(10),
      ...Platform.select({
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        android: { elevation: 2 },
      }),
    },
    summaryTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: r(12),
    },
    iconCircle: {
      width: r(44),
      height: r(44),
      borderRadius: r(22),
      borderWidth: 1.5,
      alignItems: "center",
      justifyContent: "center",
    },
    orderNumber: {
      fontSize: rm(16),
      fontWeight: "700",
      letterSpacing: -0.2,
    },
    orderDate: {
      fontSize: rm(12),
      marginTop: rv(2),
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: r(9),
      paddingVertical: rv(4),
      borderRadius: r(20),
    },
    badgeText: {
      fontSize: rm(11),
      fontWeight: "600",
    },
    divider: {
      height: 1,
      marginVertical: rv(2),
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: rv(12),
    },
    errorText: {
      fontSize: rm(14),
      textAlign: "center",
      paddingHorizontal: r(32),
    },
    retryBtn: {
      paddingHorizontal: r(24),
      paddingVertical: rv(10),
      borderRadius: r(12),
    },
    retryText: {
      color: "#fff",
      fontWeight: "600",
      fontSize: rm(14),
    },
    addressBlock: {
      flexDirection: "row",
      gap: r(10),
      alignItems: "flex-start",
    },
    addressIcon: {
      width: r(28),
      height: r(28),
      borderRadius: r(14),
      alignItems: "center",
      justifyContent: "center",
      marginTop: rv(1),
    },
    addressLabel: {
      fontSize: rm(11.5),
      fontWeight: "500",
      marginBottom: rv(2),
    },
    addressValue: {
      fontSize: rm(13),
      fontWeight: "400",
      lineHeight: rm(19),
    },
  });

const getItemStyles = (theme: any) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: r(8),
      paddingVertical: rv(4),
    },
    name: {
      fontSize: rm(13.5),
      fontWeight: "500",
      color: theme.text,
    },
    sub: {
      fontSize: rm(11.5),
      marginTop: rv(1),
      color: theme.subText,
    },
    qty: {
      fontSize: rm(13),
      fontWeight: "500",
      minWidth: r(28),
      textAlign: "center",
      color: theme.subText,
    },
    price: {
      fontSize: rm(13.5),
      fontWeight: "600",
      minWidth: r(52),
      textAlign: "right",
      color: theme.text,
    },
  });