import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Platform, ActivityIndicator,
  StatusBar, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import { getOrderDetails } from "@/src/services/orderService";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";

const { width: W, height: H } = Dimensions.get("window");
const r  = (n: number) => Math.round((W / 375) * n);
const rv = (n: number) => Math.round((H / 812) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;

// ─── Status config ─────────────────────────────────────────────
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

const STATUS_ICON: Record<string, string> = {
  pending_sp:              "package-variant",
  sp_assigned:             "account-check",
  sp_accepted:             "handshake",
  rider_pickup_assigned:   "bicycle",
  picked_up:               "cube-send",
  at_sp:                   "store",
  cleaned:                 "shimmer",
  rider_delivery_assigned: "truck-delivery",
  delivered:               "check-circle",
  cancelled:               "close-circle",
};

const STEP_ORDER = [
  "pending_sp", "sp_assigned", "sp_accepted", "rider_pickup_assigned",
  "picked_up", "at_sp", "cleaned", "rider_delivery_assigned", "delivered", "cancelled",
];

// ─── Section wrapper ───────────────────────────────────────────
function Section({ title, children, theme }: { title: string; children: React.ReactNode; theme: any }) {
  return (
    <View style={[sectionStyles.container, {
      backgroundColor: theme.card, borderColor: theme.border,
    }]}>
      <Text style={[sectionStyles.title, { color: theme.subText }]}>{title}</Text>
      {children}
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  container: {
    borderRadius: r(16), padding: r(16), borderWidth: 1, gap: rv(10),
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  title: { fontSize: rm(13), fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: rv(2) },
});

// ─── Row ───────────────────────────────────────────────────────
function Row({ label, value, valueStyle, theme }: { label: string; value: string; valueStyle?: any; theme: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: r(12) }}>
      <Text style={{ fontSize: rm(13.5), color: theme.subText, fontWeight: "400", flex: 1 }}>{label}</Text>
      <Text style={[{ fontSize: rm(13.5), color: theme.text, fontWeight: "600", textAlign: "right", flex: 1.2 }, valueStyle]}>{value}</Text>
    </View>
  );
}

// ─── StepRow — EXACT copy from TrackOrderScreen ────────────────
function StepRow({ step, isActive, isLast, theme }: {
  step: { label: string; icon: string; completed: boolean; time?: string | null; isEst?: boolean };
  isActive: boolean;
  isLast: boolean;
  theme: any;
}) {
  const scaleAnim = useRef(new Animated.Value(step.completed ? 1 : 0.85)).current;
  const fadeAnim  = useRef(new Animated.Value(step.completed ? 1 : 0.45)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: step.completed ? 1 : 0.85, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: step.completed ? 1 : 0.45, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [step.completed]);

  return (
    <View style={{ flexDirection: "row", minHeight: 64 }}>
      {/* Left: icon + line */}
      <View style={{ width: 44, alignItems: "center" }}>
        <Animated.View style={[
          {
            width: 38, height: 38, borderRadius: 19,
            alignItems: "center", justifyContent: "center", zIndex: 1,
          },
          step.completed
            ? { backgroundColor: theme.primary }
            : { backgroundColor: theme.background, borderWidth: 1.5, borderColor: theme.border },
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <MaterialCommunityIcons
            name={step.icon as any}
            size={18}
            color={step.completed ? "#fff" : theme.subText}
          />
        </Animated.View>
        {!isLast && (
          <View style={[
            { width: 2, flex: 1, marginTop: 2, marginBottom: -2 },
            step.completed
              ? { backgroundColor: theme.primary }
              : { backgroundColor: theme.border },
          ]} />
        )}
      </View>

      {/* Right: label + badges + time */}
      <Animated.View style={{ flex: 1, paddingLeft: 12, paddingBottom: 16, opacity: fadeAnim }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={[
            { fontSize: 14, fontWeight: "700", color: theme.text },
            !step.completed && { color: theme.subText, fontWeight: "500" },
          ]}>
            {step.label}
          </Text>

          {isActive && (
            <View style={{ backgroundColor: "#FFF4E0", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#B07B00" }}>In Progress</Text>
            </View>
          )}

          {step.completed && !isActive && (
            <View style={{
              backgroundColor: theme.primaryLight, borderRadius: 6,
              paddingHorizontal: 6, paddingVertical: 2,
              flexDirection: "row", alignItems: "center", gap: 3,
            }}>
              <MaterialCommunityIcons name="check" size={10} color={theme.primary} />
              <Text style={{ fontSize: 10, fontWeight: "700", color: theme.primary }}>Done</Text>
            </View>
          )}
        </View>

        {!!step.time && (
          <Text style={[
            { fontSize: 12, color: theme.subText, marginTop: 3, fontWeight: "500" },
            step.isEst && !step.completed && { color: theme.primary, fontWeight: "600" },
          ]}>
            {step.time}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Timeline — builds steps from statusHistory ────────────────
function TrackingTimeline({ statusHistory, currentStatus, theme }: {
  statusHistory: { status: string; updatedAt?: string }[];
  currentStatus: string;
  theme: any;
}) {
  const steps = STEP_ORDER.map((s) => {
    const entry = statusHistory.find((h) => h.status === s);
    return {
      key: s,
      label: STATUS_LABEL[s] ?? s,
      icon: STATUS_ICON[s] ?? "circle-outline",
      completed: !!entry,
      time: entry?.updatedAt
        ? new Date(entry.updatedAt).toLocaleString("en-IN", {
            day: "2-digit", month: "short",
            hour: "2-digit", minute: "2-digit",
          })
        : null,
      isEst: false,
    };
  });

  // Slice to only show relevant steps
  let visible: typeof steps;
  if (currentStatus === "cancelled") {
    const idx = steps.findIndex(s => s.key === "cancelled");
    visible = steps.slice(0, idx + 1);
  } else {
    const idx = steps.findIndex(s => s.key === currentStatus);
    visible = steps.slice(0, Math.min(idx + 2, steps.length));
  }

  const activeIdx = [...visible].map(s => s.completed).lastIndexOf(true);

  return (
    <View>
      {visible.map((step, idx) => (
        <StepRow
          key={step.key}
          step={step}
          isActive={idx === activeIdx}
          isLast={idx === visible.length - 1}
          theme={theme}
        />
      ))}
    </View>
  );
}

// ─── Header ────────────────────────────────────────────────────
function Header({ theme }: { theme: any }) {
  return (
    <View style={[headerStyles.header, { backgroundColor: theme.background }]}>
      <TouchableOpacity
        style={[headerStyles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => router.back()}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={r(20)} color={theme.text} />
      </TouchableOpacity>
      <Text style={[headerStyles.title, { color: theme.text }]}>Order Details</Text>
      <View style={{ width: r(36) }} />
    </View>
  );
}
const headerStyles = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: r(16), paddingTop: rv(8), paddingBottom: rv(12),
  },
  backBtn: {
    width: r(36), height: r(36), alignItems: "center", justifyContent: "center",
    borderRadius: r(18), borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  title: { flex: 1, fontSize: rm(18), fontWeight: "700", textAlign: "center", letterSpacing: -0.3 },
});

// ─── Main screen ───────────────────────────────────────────────
export default function OrderDetailsScreen() {
  const { theme, isDarkMode } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

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

  const gs = getGlobalStyles(theme);

  if (loading) {
    return (
      <SafeAreaView style={[gs.safe, { backgroundColor: theme.background }]} edges={["top"]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        <AppBackground>
          <Header theme={theme} />
          <View style={gs.centered}><ActivityIndicator size="large" color={theme.primary} /></View>
        </AppBackground>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={[gs.safe, { backgroundColor: theme.background }]} edges={["top"]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
        <AppBackground>
          <Header theme={theme} />
          <View style={gs.centered}>
            <Ionicons name="alert-circle-outline" size={r(40)} color="#E53935" />
            <Text style={[gs.errorText, { color: theme.subText }]}>{error ?? "Order not found"}</Text>
            <TouchableOpacity style={[gs.retryBtn, { backgroundColor: theme.primary }]} onPress={() => router.back()}>
              <Text style={gs.retryText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </AppBackground>
      </SafeAreaView>
    );
  }

  const totalQty = order.items?.reduce((sum: number, i: any) => sum + (i.quantity ?? 0), 0) ?? 0;

  const getBadgeConfig = (status: string) => {
    if (status === "delivered") return { bg: theme.primaryLight, text: theme.primary,  icon: "checkmark-circle-outline", iconColor: theme.primary  };
    if (status === "cancelled") return { bg: "#FDEAEA",           text: "#E53935",      icon: "close-circle-outline",     iconColor: "#E53935"       };
    return                             { bg: "#FEF3C7",           text: "#92400E",      icon: "time-outline",             iconColor: "#D97706"       };
  };
  const badgeCfg = getBadgeConfig(order.status);

  return (
    <SafeAreaView style={[gs.safe, { backgroundColor: theme.background }]} edges={["top", "left", "right"]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      <AppBackground>
        <Header theme={theme} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={gs.content}>

          {/* ── Summary card ── */}
          <View style={[gs.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={gs.summaryTop}>
              <View style={[gs.iconCircle, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="package-variant-closed" size={r(22)} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[gs.orderNumber, { color: theme.text }]}>#{order.orderNumber}</Text>
                <Text style={[gs.orderDate,   { color: theme.subText }]}>
                  {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </Text>
              </View>
              <View style={[gs.badge, { backgroundColor: badgeCfg.bg }]}>
                <Ionicons name={badgeCfg.icon as any} size={r(12)} color={badgeCfg.iconColor} style={{ marginRight: r(3) }} />
                <Text style={[gs.badgeText, { color: badgeCfg.text }]}>{STATUS_LABEL[order.status] ?? order.status}</Text>
              </View>
            </View>

            <View style={[gs.divider, { backgroundColor: theme.border }]} />
            <Row label="Service"     value={order.items?.[0]?.serviceName ?? "Laundry"} theme={theme} />
            <Row label="Total items" value={`${totalQty} items`}                         theme={theme} />
            <Row label="Payment"     value={order.paymentMethod ?? "—"}                  theme={theme} />
          </View>

          {/* ── Items ── */}
          <Section title="Items" theme={theme}>
            {order.items?.map((item: any, i: number) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: r(8), paddingVertical: rv(4) }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: rm(13.5), fontWeight: "500", color: theme.text }}>{item.subCategoryName ?? item.serviceName}</Text>
                  <Text style={{ fontSize: rm(11.5), marginTop: rv(1), color: theme.subText }}>
                    {item.categoryName}{item.serviceName ? ` • ${item.serviceName}` : ""}
                  </Text>
                </View>
                <Text style={{ fontSize: rm(13), fontWeight: "500", minWidth: r(28), textAlign: "center", color: theme.subText }}>×{item.quantity}</Text>
                <Text style={{ fontSize: rm(13.5), fontWeight: "600", minWidth: r(52), textAlign: "right", color: theme.text }}>
                  ₹{item.totalPrice ?? item.unitPrice * item.quantity}
                </Text>
              </View>
            ))}
          </Section>

          {/* ── Bill ── */}
          <Section title="Bill Summary" theme={theme}>
            <Row label="Subtotal"  value={`₹${order.subtotal}`} theme={theme} />
            <Row label="Tax (5%)"  value={`₹${order.tax}`}      theme={theme} />
            {order.discount > 0 && (
              <Row label="Discount" value={`-₹${order.discount}`} valueStyle={{ color: theme.primary }} theme={theme} />
            )}
            <View style={[gs.divider, { backgroundColor: theme.border }]} />
            <Row label="Total" value={`₹${order.totalAmount}`} valueStyle={{ fontSize: rm(16), fontWeight: "700", color: theme.text }} theme={theme} />
          </Section>

          {/* ── Addresses ── */}
          <Section title="Addresses" theme={theme}>
            <View style={gs.addressBlock}>
              <View style={[gs.addressIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="location-outline" size={r(15)} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[gs.addressLabel, { color: theme.subText }]}>Pickup</Text>
                <Text style={[gs.addressValue, { color: theme.text }]}>{order.pickupAddress?.address ?? "—"}</Text>
              </View>
            </View>
            <View style={[gs.addressBlock, { marginTop: rv(8) }]}>
              <View style={[gs.addressIcon, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="home-outline" size={r(15)} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[gs.addressLabel, { color: theme.subText }]}>Delivery</Text>
                <Text style={[gs.addressValue, { color: theme.text }]}>{order.deliveryAddress?.address ?? "—"}</Text>
              </View>
            </View>
          </Section>

          {/* ── Timeline — exact TrackOrderScreen style ── */}
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

const getGlobalStyles = (theme: any) => StyleSheet.create({
  safe:        { flex: 1 },
  content:     { paddingHorizontal: r(16), paddingTop: rv(4), paddingBottom: rv(40), gap: r(12) },
  centered:    { flex: 1, alignItems: "center", justifyContent: "center", gap: rv(12) },
  errorText:   { fontSize: rm(14), textAlign: "center", paddingHorizontal: r(32) },
  retryBtn:    { paddingHorizontal: r(24), paddingVertical: rv(10), borderRadius: r(12) },
  retryText:   { color: "#fff", fontWeight: "600", fontSize: rm(14) },
  summaryCard: {
    borderRadius: r(16), padding: r(16), borderWidth: 1, gap: rv(10),
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  summaryTop:  { flexDirection: "row", alignItems: "center", gap: r(12) },
  iconCircle:  { width: r(44), height: r(44), borderRadius: r(22), borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  orderNumber: { fontSize: rm(16), fontWeight: "700", letterSpacing: -0.2 },
  orderDate:   { fontSize: rm(12), marginTop: rv(2) },
  badge:       { flexDirection: "row", alignItems: "center", paddingHorizontal: r(9), paddingVertical: rv(4), borderRadius: r(20) },
  badgeText:   { fontSize: rm(11), fontWeight: "600" },
  divider:     { height: 1, marginVertical: rv(2) },
  addressBlock: { flexDirection: "row", gap: r(10), alignItems: "flex-start" },
  addressIcon:  { width: r(28), height: r(28), borderRadius: r(14), alignItems: "center", justifyContent: "center", marginTop: rv(1) },
  addressLabel: { fontSize: rm(11.5), fontWeight: "500", marginBottom: rv(2) },
  addressValue: { fontSize: rm(13), fontWeight: "400", lineHeight: rm(19) },
});

