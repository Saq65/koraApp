import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getOrderHistory } from "@/src/services/orderService";

// ─── Responsive helpers ────────────────────────────────────────
const { width: W, height: H } = Dimensions.get("window");
const r = (n: number) => Math.round((W / 375) * n);
const rv = (n: number) => Math.round((H / 812) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;

// ─── Design tokens ─────────────────────────────────────────────
const C = {
  teal: "#1a7a6e",
  tealLight: "#e0f5f2",
  tealXLight: "#eef9f7",
  tealDark: "#0f5249",
  surface: "#ffffff",
  bg: "#f2f6f5",
  ink: "#0e1c1a",
  inkMid: "#4a6360",
  inkLight: "#8aa8a4",
  border: "#dce8e6",
  red: "#e53935",
  redLight: "#fdecea",
  skeletonBase: "#e2eded",
  skeletonShine: "#f0f7f6",
} as const;

const ios_shadow = {
  shadowColor: "#0a3530",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
};

// ─── Types ─────────────────────────────────────────────────────
type OrderStatus = "Delivered" | "Cancelled" | "Processing" | "Out for Delivery";

interface Order {
  id: string;
  orderId: string;
  date: string;
  services: string;
  itemCount: number;
  amount: number;
  status: OrderStatus;
}

// ─── Utility: normalise API response → Order ───────────────────
function normaliseOrder(raw: any): Order {
  return {
    id: String(raw.id),
    orderId: `#${raw.id}`,
    date: raw.date ?? "",
    services: raw.service ?? "Laundry",
    itemCount: raw.items ?? 0,
    amount: raw.price ?? 0,
    status: raw.status as OrderStatus,
  };
}

// ─── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg: Record<OrderStatus, { bg: string; text: string; icon: any; iconColor: string }> = {
    "Delivered": {
      bg: C.tealLight, text: C.tealDark,
      icon: "checkmark-circle-outline", iconColor: C.teal,
    },
    "Cancelled": {
      bg: C.redLight, text: C.red,
      icon: "close-circle-outline", iconColor: C.red,
    },
    "Processing": {
      bg: "#fef3c7", text: "#92400e",
      icon: "time-outline", iconColor: "#d97706",
    },
    "Out for Delivery": {
      bg: "#e0eaff", text: "#1e3a8a",
      icon: "bicycle-outline", iconColor: "#3b5bdb",
    },
  };

  const { bg, text, icon, iconColor } = cfg[status] ?? cfg["Processing"];

  return (
    <View style={[badgeStyles.badge, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={r(12)} color={iconColor} style={{ marginRight: r(3) }} />
      <Text style={[badgeStyles.text, { color: text }]}>{status}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: r(9),
    paddingVertical: rv(4),
    borderRadius: r(20),
  },
  text: {
    fontSize: rm(11),
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});

// ─── Skeleton card ─────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={[styles.card, { gap: rv(12) }]}>
      <View style={styles.cardTop}>
        <View style={[styles.iconCircle, { backgroundColor: C.skeletonBase }]} />
        <View style={{ flex: 1, gap: rv(6) }}>
          <View style={[skeletonStyles.line, { width: "45%", height: rv(13) }]} />
          <View style={[skeletonStyles.line, { width: "30%", height: rv(11) }]} />
        </View>
        <View style={[skeletonStyles.line, { width: r(72), height: rv(24), borderRadius: r(20) }]} />
      </View>
      <View style={styles.divider} />
      <View style={[styles.cardBottom]}>
        <View style={[skeletonStyles.line, { width: "40%", height: rv(12) }]} />
        <View style={[skeletonStyles.line, { width: r(52), height: rv(16) }]} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  line: {
    backgroundColor: C.skeletonBase,
    borderRadius: r(6),
  },
});

// ─── Order Card ────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push(`/order/orderDetails?id=${order.id}`)}
    >
      <View style={styles.cardTop}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={r(20)}
            color={C.teal}
          />
        </View>

        <View style={styles.orderMeta}>
          <Text style={styles.orderId}>{order.orderId}</Text>
          <Text style={styles.orderDate}>{order.date}</Text>
        </View>

        <StatusBadge status={order.status} />
      </View>

      <View style={styles.divider} />

      <View style={styles.cardBottom}>
        <Text style={styles.services}>
          {order.services} • {order.itemCount} items
        </Text>
        <Text style={styles.amount}>₹{order.amount}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const data = await getOrderHistory();
      setOrders(data.map(normaliseOrder));    // ← no .data needed
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Render helpers ──
  const renderContent = () => {
    if (loading) {
      return Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />);
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: C.redLight, borderColor: "#f5c6c4" }]}>
            <Ionicons name="alert-circle-outline" size={r(36)} color={C.red} />
          </View>
          <Text style={styles.emptyTitle}>Couldn't load orders</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchOrders()}
            activeOpacity={0.75}
          >
            <Ionicons name="refresh-outline" size={r(15)} color={C.surface} style={{ marginRight: r(5) }} />
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (orders.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons
              name="package-variant-closed"
              size={r(40)}
              color={C.teal}
            />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptySubtitle}>
            Your order history will appear here
          </Text>
        </View>
      );
    }

    return orders.map((order) => <OrderCard key={order.id} order={order} />);
  };

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

        <Text style={styles.headerTitle}>Order History</Text>
        <View style={{ width: r(36) }} />
      </View>

      {/* ── ORDER LIST ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchOrders(true)}
            tintColor={C.teal}
            colors={[C.teal]}
          />
        }
      >
        {renderContent()}
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

  listContent: {
    paddingHorizontal: r(16),
    paddingTop: rv(4),
    paddingBottom: rv(32),
    gap: r(12),
  },

  card: {
    backgroundColor: C.surface,
    borderRadius: r(16),
    padding: r(16),
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({ ios: ios_shadow }),
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(12),
  },
  iconCircle: {
    width: r(40),
    height: r(40),
    borderRadius: r(20),
    backgroundColor: C.tealXLight,
    borderWidth: 1.5,
    borderColor: C.tealLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orderMeta: {
    flex: 1,
  },
  orderId: {
    fontSize: rm(15),
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.2,
  },
  orderDate: {
    fontSize: rm(12),
    fontWeight: "400",
    color: C.inkLight,
    marginTop: rv(2),
  },

  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: rv(12),
  },

  cardBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  services: {
    fontSize: rm(12.5),
    fontWeight: "400",
    color: C.inkMid,
  },
  amount: {
    fontSize: rm(16),
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.3,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: rv(100),
    paddingHorizontal: r(32),
    gap: rv(10),
  },
  emptyIcon: {
    width: r(88),
    height: r(88),
    borderRadius: r(44),
    backgroundColor: C.tealXLight,
    borderWidth: 2,
    borderColor: C.tealLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rv(6),
  },
  emptyTitle: {
    fontSize: rm(17),
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: rm(13),
    fontWeight: "400",
    color: C.inkMid,
    textAlign: "center",
    lineHeight: rm(19),
  },

  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: rv(6),
    backgroundColor: C.teal,
    paddingHorizontal: r(20),
    paddingVertical: rv(10),
    borderRadius: r(12),
  },
  retryText: {
    fontSize: rm(14),
    fontWeight: "600",
    color: C.surface,
  },
});