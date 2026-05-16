import React from "react";
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
  surface:     "#ffffff",
  bg:          "#f2f6f5",
  ink:         "#0e1c1a",
  inkMid:      "#4a6360",
  inkLight:    "#8aa8a4",
  border:      "#dce8e6",
  red:         "#e53935",
  redLight:    "#fdecea",
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

// ─── Sample data ───────────────────────────────────────────────
const ORDERS: Order[] = [
  {
    id: "1",
    orderId: "#KOR2451",
    date: "12 May 2026",
    services: "Wash + Iron",
    itemCount: 8,
    amount: 420,
    status: "Delivered",
  },
  {
    id: "2",
    orderId: "#KOR2438",
    date: "05 May 2026",
    services: "Wash",
    itemCount: 5,
    amount: 250,
    status: "Delivered",
  },
  {
    id: "3",
    orderId: "#KOR2421",
    date: "28 Apr 2026",
    services: "Iron",
    itemCount: 12,
    amount: 580,
    status: "Delivered",
  },
  {
    id: "4",
    orderId: "#KOR2410",
    date: "20 Apr 2026",
    services: "Wash",
    itemCount: 6,
    amount: 300,
    status: "Cancelled",
  },
  {
    id: "5",
    orderId: "#KOR2399",
    date: "10 Apr 2026",
    services: "Wash + Iron",
    itemCount: 9,
    amount: 470,
    status: "Delivered",
  },
];

// ─── Status badge ──────────────────────────────────────────────
function StatusBadge({ status }: { status: OrderStatus }) {
  const isDelivered  = status === "Delivered";
  const isCancelled  = status === "Cancelled";
  const isProcessing = status === "Processing";

  let bgColor   = C.tealLight;
  let textColor = C.tealDark;
  let iconName: any = "checkmark-circle-outline";
  let iconColor = C.teal;

//   if (isCancelled) {
//     bgColor   = C.redLight;
//     textColor = C.red;
//     iconName  = "alert-circle-outline";
//     iconColor = C.red;
//   } else if (isProcessing) {
//     bgColor   = "#fef3c7";
//     textColor = "#92400e";
//     iconName  = "time-outline";
//     iconColor = "#d97706";
//   }

  return (
    <View style={[badgeStyles.badge, { backgroundColor: bgColor }]}>
      <Ionicons name={iconName} size={r(12)} color={iconColor} style={{ marginRight: r(3) }} />
      <Text style={[badgeStyles.text, { color: textColor }]}>{status}</Text>
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

// ─── Order Card ────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => {
        // router.push(`/order-detail/${order.id}`);
      }}
    >
      {/* Top row: icon + order id + date + status badge */}
      <View style={styles.cardTop}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="package-variant-closed" size={r(20)} color={C.teal} />
        </View>

        <View style={styles.orderMeta}>
          <Text style={styles.orderId}>{order.orderId}</Text>
          <Text style={styles.orderDate}>{order.date}</Text>
        </View>

        <StatusBadge status={order.status} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Bottom row: services + amount */}
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

        {/* Spacer to balance back button */}
        <View style={{ width: r(36) }} />
      </View>

      {/* ── ORDER LIST ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      >
        {ORDERS.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons
                name="package-variant-closed"
                size={r(40)}
                color={C.tealLight}
              />
            </View>
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              Your order history will appear here
            </Text>
          </View>
        ) : (
          ORDERS.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
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
  headerTitle: {
    flex: 1,
    fontSize: rm(18),
    fontWeight: "700",
    color: C.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },

  // List
  listContent: {
    paddingHorizontal: r(16),
    paddingTop: rv(4),
    paddingBottom: rv(32),
    gap: r(12),
  },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: r(16),
    padding: r(16),
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({ ios: ios_shadow}),
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

  // Divider
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: rv(12),
  },

  // Card bottom
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

  // Empty state
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
});