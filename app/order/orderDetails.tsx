import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Platform, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { getOrderDetails } from "@/src/services/orderService";

const { width: W, height: H } = Dimensions.get("window");
const r  = (n: number) => Math.round((W / 375) * n);
const rv = (n: number) => Math.round((H / 812) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;

const C = {
  teal:       "#1a7a6e",
  tealLight:  "#e0f5f2",
  tealXLight: "#eef9f7",
  tealDark:   "#0f5249",
  surface:    "#ffffff",
  bg:         "#f2f6f5",
  ink:        "#0e1c1a",
  inkMid:     "#4a6360",
  inkLight:   "#8aa8a4",
  border:     "#dce8e6",
  red:        "#e53935",
  redLight:   "#fdecea",
} as const;

const ios_shadow = {
  shadowColor: "#0a3530",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
};

const STATUS_LABEL: Record<string, string> = {
  pending_sp:              "Order Placed",
  sp_assigned:             "SP Assigned",
  sp_accepted:             "SP Accepted",
  rider_pickup_assigned:   "Rider Assigned for Pickup",
  picked_up:               "Order Picked Up",
  at_sp:                   "At Service Provider",
  cleaned:                 "Cleaned",
  rider_delivery_assigned: "Out for Delivery",
  delivered:               "Delivered",
  cancelled:               "Cancelled",
};

const STATUS_BADGE: Record<string, { bg: string; text: string; icon: any; iconColor: string }> = {
  delivered: { bg: C.tealLight,  text: C.tealDark, icon: "checkmark-circle-outline", iconColor: C.teal },
  cancelled: { bg: C.redLight,   text: C.red,      icon: "close-circle-outline",     iconColor: C.red  },
  default:   { bg: "#fef3c7",    text: "#92400e",  icon: "time-outline",             iconColor: "#d97706" },
};

// ─── Section wrapper ───────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: {
    backgroundColor: C.surface,
    borderRadius: r(16),
    padding: r(16),
    borderWidth: 1,
    borderColor: C.border,
    gap: rv(10),
    ...Platform.select({ ios: ios_shadow }),
  },
  title: {
    fontSize: rm(13),
    fontWeight: "600",
    color: C.inkLight,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: rv(2),
  },
});

// ─── Row inside a section ──────────────────────────────────────
function Row({ label, value, valueStyle }: { label: string; value: string; valueStyle?: any }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={[rowStyles.value, valueStyle]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: r(12),
  },
  label: {
    fontSize: rm(13.5),
    color: C.inkMid,
    fontWeight: "400",
    flex: 1,
  },
  value: {
    fontSize: rm(13.5),
    color: C.ink,
    fontWeight: "600",
    textAlign: "right",
    flex: 1.2,
  },
});

// ─── Tracking timeline ─────────────────────────────────────────
function TrackingTimeline({ statusHistory, currentStatus }: {
  statusHistory: { status: string; updatedAt?: string }[];
  currentStatus: string;
}) {
  const stepOrder = [
    "pending_sp", "sp_assigned", "sp_accepted", "rider_pickup_assigned",
    "picked_up", "at_sp", "cleaned", "rider_delivery_assigned", "delivered", "cancelled",
  ];

  // Build visible steps — completed + next one
  const steps = stepOrder.map((s) => {
    const entry = statusHistory.find((h) => h.status === s);
    return {
      key:       s,
      label:     STATUS_LABEL[s] ?? s,
      completed: !!entry,
      time:      entry?.updatedAt
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

  return (
    <View style={{ gap: 0 }}>
      {visible.map((step, i) => {
        const isLast = i === visible.length - 1;
        return (
          <View key={step.key} style={trackStyles.row}>
            {/* Line + dot column */}
            <View style={trackStyles.lineCol}>
              <View style={[
                trackStyles.dot,
                step.completed
                  ? { backgroundColor: C.teal, borderColor: C.teal }
                  : { backgroundColor: C.surface, borderColor: C.border },
              ]}>
                {step.completed && (
                  <Ionicons name="checkmark" size={r(9)} color="#fff" />
                )}
              </View>
              {!isLast && (
                <View style={[
                  trackStyles.line,
                  { backgroundColor: step.completed ? C.teal : C.border },
                ]} />
              )}
            </View>

            {/* Label + time */}
            <View style={trackStyles.textCol}>
              <Text style={[
                trackStyles.label,
                { color: step.completed ? C.ink : C.inkLight },
              ]}>
                {step.label}
              </Text>
              {step.time && (
                <Text style={trackStyles.time}>{step.time}</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const trackStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: r(12),
    minHeight: rv(44),
  },
  lineCol: {
    alignItems: "center",
    width: r(20),
  },
  dot: {
    width: r(20),
    height: r(20),
    borderRadius: r(10),
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: rv(2),
  },
  textCol: {
    flex: 1,
    paddingBottom: rv(12),
    gap: rv(2),
  },
  label: {
    fontSize: rm(13.5),
    fontWeight: "500",
  },
  time: {
    fontSize: rm(11.5),
    color: C.inkLight,
    fontWeight: "400",
  },
});

// ─── Main screen ───────────────────────────────────────────────
export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder]     = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

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

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={C.teal} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (error || !order) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <Header />
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={r(40)} color={C.red} />
          <Text style={styles.errorText}>{error ?? "Order not found"}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const badgeCfg = STATUS_BADGE[order.status] ?? STATUS_BADGE.default;

  // Items total quantity
  const totalQty = order.items?.reduce(
    (sum: number, i: any) => sum + (i.quantity ?? 0), 0
  ) ?? 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <Header />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* ── Order summary card ── */}
        <View style={styles.summaryCard}>
          {/* Icon + order number + status */}
          <View style={styles.summaryTop}>
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="package-variant-closed" size={r(22)} color={C.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
              <Text style={styles.orderDate}>
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

          <View style={styles.divider} />

          {/* Summary rows */}
          <Row label="Service"      value={order.items?.[0]?.serviceName ?? "Laundry"} />
          <Row label="Total items"  value={`${totalQty} items`} />
          <Row label="Payment"      value={order.paymentMethod ?? "—"} />
        </View>

        {/* ── Items breakdown ── */}
        <Section title="Items">
          {order.items?.map((item: any, i: number) => (
            <View key={i} style={itemStyles.row}>
              <View style={{ flex: 1 }}>
                <Text style={itemStyles.name}>{item.subCategoryName ?? item.serviceName}</Text>
                <Text style={itemStyles.sub}>
                  {item.categoryName}
                  {item.serviceName ? ` • ${item.serviceName}` : ""}
                </Text>
              </View>
              <Text style={itemStyles.qty}>×{item.quantity}</Text>
              <Text style={itemStyles.price}>₹{item.totalPrice ?? item.unitPrice * item.quantity}</Text>
            </View>
          ))}
        </Section>

        {/* ── Price breakdown ── */}
        <Section title="Bill Summary">
          <Row label="Subtotal" value={`₹${order.subtotal}`} />
          <Row label="Tax (5%)" value={`₹${order.tax}`} />
          {order.discount > 0 && (
            <Row label="Discount" value={`-₹${order.discount}`} valueStyle={{ color: C.teal }} />
          )}
          <View style={styles.divider} />
          <Row
            label="Total"
            value={`₹${order.totalAmount}`}
            valueStyle={{ fontSize: rm(16), fontWeight: "700", color: C.ink }}
          />
        </Section>

        {/* ── Addresses ── */}
        <Section title="Addresses">
          <View style={addrStyles.block}>
            <View style={addrStyles.iconWrap}>
              <Ionicons name="location-outline" size={r(15)} color={C.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={addrStyles.label}>Pickup</Text>
              <Text style={addrStyles.value}>{order.pickupAddress?.address ?? "—"}</Text>
            </View>
          </View>
          <View style={[addrStyles.block, { marginTop: rv(8) }]}>
            <View style={addrStyles.iconWrap}>
              <Ionicons name="home-outline" size={r(15)} color={C.teal} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={addrStyles.label}>Delivery</Text>
              <Text style={addrStyles.value}>{order.deliveryAddress?.address ?? "—"}</Text>
            </View>
          </View>
        </Section>

        {/* ── Tracking ── */}
        <Section title="Order Timeline">
          <TrackingTimeline
            statusHistory={order.statusHistory ?? []}
            currentStatus={order.status}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Shared header ─────────────────────────────────────────────
function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={r(20)} color={C.ink} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Order Details</Text>
      <View style={{ width: r(36) }} />
    </View>
  );
}

// ─── Item row styles ───────────────────────────────────────────
const itemStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(8),
    paddingVertical: rv(4),
  },
  name: {
    fontSize: rm(13.5),
    fontWeight: "500",
    color: C.ink,
  },
  sub: {
    fontSize: rm(11.5),
    color: C.inkLight,
    marginTop: rv(1),
  },
  qty: {
    fontSize: rm(13),
    color: C.inkMid,
    fontWeight: "500",
    minWidth: r(28),
    textAlign: "center",
  },
  price: {
    fontSize: rm(13.5),
    fontWeight: "600",
    color: C.ink,
    minWidth: r(52),
    textAlign: "right",
  },
});

const addrStyles = StyleSheet.create({
  block: {
    flexDirection: "row",
    gap: r(10),
    alignItems: "flex-start",
  },
  iconWrap: {
    width: r(28),
    height: r(28),
    borderRadius: r(14),
    backgroundColor: C.tealXLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: rv(1),
  },
  label: {
    fontSize: rm(11.5),
    color: C.inkLight,
    fontWeight: "500",
    marginBottom: rv(2),
  },
  value: {
    fontSize: rm(13),
    color: C.ink,
    fontWeight: "400",
    lineHeight: rm(19),
  },
});

// ─── Main styles ───────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
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
  headerTitle: {
    flex: 1,
    fontSize: rm(18),
    fontWeight: "700",
    color: C.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: r(16),
    paddingTop: rv(4),
    paddingBottom: rv(40),
    gap: r(12),
  },
  summaryCard: {
    backgroundColor: C.surface,
    borderRadius: r(16),
    padding: r(16),
    borderWidth: 1,
    borderColor: C.border,
    gap: rv(10),
    ...Platform.select({ ios: ios_shadow }),
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
    backgroundColor: C.tealXLight,
    borderWidth: 1.5,
    borderColor: C.tealLight,
    alignItems: "center",
    justifyContent: "center",
  },
  orderNumber: {
    fontSize: rm(16),
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.2,
  },
  orderDate: {
    fontSize: rm(12),
    color: C.inkLight,
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
    backgroundColor: C.border,
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
    color: C.inkMid,
    textAlign: "center",
    paddingHorizontal: r(32),
  },
  retryBtn: {
    paddingHorizontal: r(24),
    paddingVertical: rv(10),
    backgroundColor: C.teal,
    borderRadius: r(12),
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: rm(14),
  },
});