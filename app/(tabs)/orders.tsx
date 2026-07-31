import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AppBackground from "@/components/AppBackground";
import { getActiveOrder, getOrderHistory, cancelOrder } from "../../src/api/order";
import { useTheme } from "../../src/theme/ThemeProvider";
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

type OrderStatus = "Delivered" | "Cancelled" | "In Process";

interface Order {
  id: string;
  service: string;
  items: number;
  date: string;
  price: number;
  status: OrderStatus;
  iconName: string;
}

interface TrackingStep {
  label: string;
  time: string;
  completed: boolean;
  isEstimate?: boolean;
}

/* ─── Active Order Card ─── */
const ActiveOrderCard = ({ order, trackingSteps, cancelDeadline, theme, isDarkMode, onCancel }: {
  order: Order;
  trackingSteps: TrackingStep[];
  cancelDeadline?: string | null;
  theme: any;
  isDarkMode: boolean;
  onCancel: (orderId: string) => void;
}) => {
  const { t } = useTranslation();
  const [cancelling, setCancelling] = useState(false);

  const getCancelNotice = () => {
    if (!cancelDeadline) return t("orders.free_cancellation");
    const deadline = new Date(cancelDeadline);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs <= 0) return t("orders.cancellation_closed");
    const minsLeft = Math.floor(diffMs / 60000);
    return t("orders.cancellation_mins_left", { mins: minsLeft });
  };

  const statusColor = () => {
    if (order.status === "Delivered") return theme.primary;
    if (order.status === "Cancelled") return "#E53935";
    return "#F5A623";
  };

  return (
    <View style={[styles.activeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.activeSummaryRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
          <MaterialCommunityIcons name={order.iconName} size={22} color={theme.primary} />
        </View>
        <View style={styles.cardCenter}>
          <View style={styles.row}>
            <Text style={[styles.orderId, { color: theme.text }]}>{order.id}</Text>
            <Text style={[styles.statusText, { color: statusColor() }]}>{order.status}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.orderMeta, { color: theme.subText }]}>
              {order.service} • {order.items} {t("orders.items")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.orderDate, { color: theme.subText }]}>{order.date}</Text>
            <Text style={[styles.price, { color: theme.text }]}>₹{order.price}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={styles.timeline}>
        {trackingSteps.map((step, index) => {
          const isLast = index === trackingSteps.length - 1;
          const isNextPending = !step.completed && (index === 0 || trackingSteps[index - 1].completed);
          return (
            <View key={index} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                {step.completed ? (
                  <View style={styles.dotCompleted}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={theme.primary} />
                  </View>
                ) : (
                  <View style={[
                    styles.dotEmpty,
                    { backgroundColor: theme.background, borderColor: theme.border },
                    isNextPending && { borderColor: theme.primary }
                  ]} />
                )}
                {!isLast && (
                  <View style={[
                    styles.timelineLine,
                    step.completed ? { backgroundColor: theme.primary } : { backgroundColor: theme.border }
                  ]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.stepLabel,
                  { color: step.completed ? theme.text : theme.subText }
                ]}>
                  {step.label}
                </Text>
                {step.time !== "" && (
                  <Text style={[
                    styles.stepTime,
                    step.isEstimate ? { color: theme.primary } : { color: theme.subText }
                  ]}>
                    {step.time}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <View style={[styles.cancelNotice, { backgroundColor: theme.primaryLight }]}>
        <MaterialCommunityIcons name="clock-outline" size={14} color={theme.primary} />
        <Text style={[styles.cancelNoticeText, { color: theme.primary }]}>{getCancelNotice()}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: "#E53935" }, cancelling && { opacity: 0.6 }]}
          activeOpacity={0.8}
          disabled={cancelling}
          onPress={async () => {
            setCancelling(true);
            await onCancel(order.id);
            setCancelling(false);
          }}
        >
          {cancelling ? (
            <ActivityIndicator size="small" color="#E53935" />
          ) : (
            <Text style={styles.cancelBtnText}>{t("orders.cancel_order")}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push(`/trackorder/trackOrderScreen?orderId=${order.id ?? (order as any)?._id ?? ''}`)}
          style={[styles.trackBtn, { backgroundColor: theme.primary }]}
          activeOpacity={0.8}
        >
          <Text style={styles.trackBtnText}>{t("orders.live_tracking")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ─── History Order Card ─── */
const OrderCard = ({ order, theme }: { order: Order; theme: any }) => {
  const { t } = useTranslation();
  const statusColor = order.status === "Delivered" ? theme.primary : "#E53935";

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.7}>
      <View style={[styles.iconWrap, { backgroundColor: theme.primaryLight }]}>
        <MaterialCommunityIcons name={order.iconName} size={22} color={theme.primary} />
      </View>
      <View style={styles.cardCenter}>
        <View style={styles.row}>
          <Text style={[styles.orderId, { color: theme.text }]}>{order.id}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.orderMeta, { color: theme.subText }]}>
            {order.service} • {order.items} {t("orders.items")}
          </Text>
          <Text style={[styles.price, { color: theme.text }]}>₹{order.price}</Text>
        </View>
        <Text style={[styles.orderDate, { color: theme.subText }]}>{order.date}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={theme.subText} />
    </TouchableOpacity>
  );
};

/* ─── Main Screen ─── */
export default function Orders() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [trackingSteps, setTrackingSteps] = useState<TrackingStep[]>([]);
  const [cancelDeadline, setCancelDeadline] = useState<string | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [activeRes, historyRes] = await Promise.all([
        getActiveOrder(),
        getOrderHistory()
      ]);
      if (activeRes.success && activeRes.data) {
        setActiveOrders(activeRes.data);
        setTrackingSteps(activeRes.data.tracking || []);
        setCancelDeadline(activeRes.data.cancellationDeadline || null);
      } else {
        setActiveOrders([]);
        setTrackingSteps([]);
        setCancelDeadline(null);
      }
      if (historyRes.success) {
        setHistoryOrders(historyRes.data);
      } else {
        setHistoryOrders([]);
      }
    } catch (error) {
      console.log("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = (orderId: string) => {
    return new Promise<void>((resolve) => {
      Alert.alert(
        t("orders.cancel_order"),
        t("orders.cancel_confirm_message"),
        [
          { text: t("common.no") || "No", style: "cancel", onPress: () => resolve() },
          {
            text: t("common.yes") || "Yes, cancel",
            style: "destructive",
            onPress: async () => {
              try {
                const res = await cancelOrder(orderId);
                if (res.success) {
                  const { cancellationFee, refundAmount, isFreeCancellation } = res.data || {};
                  const message = isFreeCancellation
                    ? t("orders.cancel_success_free")
                    : t("orders.cancel_success_fee", { fee: cancellationFee, refund: refundAmount });
                  Alert.alert(t("orders.cancel_order"), message);
                  await loadOrders();
                } else {
                  Alert.alert(t("orders.cancel_order"), res.message || t("orders.cancel_failed"));
                }
              } catch (error: any) {
                Alert.alert(t("orders.cancel_order"), error?.message || t("orders.cancel_failed"));
              } finally {
                resolve();
              }
            },
          },
        ]
      );
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.background }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["top"]}>
      <AppBackground>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.card }]}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t("orders.my_services")}</Text>
        </View>

        <View style={[styles.tabRow, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            onPress={() => setActiveTab("active")}
            style={activeTab === "active" ? [styles.tabActive, { backgroundColor: theme.primary }] : styles.tabInactive}
          >
            <Text style={activeTab === "active" ? styles.tabActiveText : [styles.tabInactiveText, { color: theme.subText }]}>
              {t("orders.active")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("history")}
            style={activeTab === "history" ? [styles.tabActive, { backgroundColor: theme.primary }] : styles.tabInactive}
          >
            <Text style={activeTab === "history" ? styles.tabActiveText : [styles.tabInactiveText, { color: theme.subText }]}>
              {t("orders.history")}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === "active" ? (
            activeOrders.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="package-variant" size={52} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.subText }]}>{t("orders.no_active_orders")}</Text>
              </View>
            ) : (
              activeOrders.map((item) => (
                <ActiveOrderCard
                  key={item.order.id}
                  order={item.order}
                  trackingSteps={item.tracking}
                  cancelDeadline={item.cancellationDeadline}
                  theme={theme}
                  isDarkMode={isDarkMode}
                  onCancel={handleCancelOrder}
                />
              ))
            )
          ) : (
            historyOrders.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="package-variant" size={52} color={theme.subText} />
                <Text style={[styles.emptyText, { color: theme.subText }]}>{t("orders.no_orders_found")}</Text>
              </View>
            ) : (
              historyOrders.map((order) => <OrderCard key={order.id} order={order} theme={theme} />)
            )
          )}
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", marginLeft: 10 },
  tabRow: {
    flexDirection: "row", marginHorizontal: 16,
    marginBottom: 16, borderRadius: 30, padding: 4,
  },
  tabActive: { flex: 1, borderRadius: 26, paddingVertical: 10, alignItems: "center" },
  tabActiveText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  tabInactive: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabInactiveText: { fontWeight: "600", fontSize: 14 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card: {
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 16,
    flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6,
    elevation: 2, borderWidth: 1,
  },
  activeCard: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8,
    elevation: 3, borderWidth: 1,
  },
  activeSummaryRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  divider: { height: 1, marginBottom: 16 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  cardCenter: { flex: 1, gap: 3 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 14, fontWeight: "700" },
  statusText: { fontSize: 13, fontWeight: "700" },
  orderMeta: { fontSize: 12, flex: 1 },
  price: { fontSize: 14, fontWeight: "800" },
  orderDate: { fontSize: 11 },
  timeline: { marginBottom: 16, paddingLeft: 4 },
  timelineRow: { flexDirection: "row", minHeight: 44 },
  timelineLeft: { width: 28, alignItems: "center" },
  dotCompleted: { width: 22, height: 22, alignItems: "center", justifyContent: "center", zIndex: 1 },
  dotEmpty: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    backgroundColor: "#fff", marginTop: 1, zIndex: 1,
  },
  timelineLine: { width: 2, flex: 1, marginTop: 2, marginBottom: -2 },
  timelineContent: { flex: 1, paddingLeft: 10, paddingBottom: 12 },
  stepLabel: { fontSize: 13, fontWeight: "600" },
  stepTime: { fontSize: 11, marginTop: 1 },
  cancelNotice: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14,
  },
  cancelNoticeText: { fontSize: 12, fontWeight: "500", flex: 1 },
  actionRow: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderRadius: 30, paddingVertical: 13, alignItems: "center" },
  cancelBtnText: { color: "#E53935", fontWeight: "700", fontSize: 14 },
  trackBtn: { flex: 1, borderRadius: 30, paddingVertical: 13, alignItems: "center" },
  trackBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  emptyWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: "500" },
});