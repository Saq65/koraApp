import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { getUserOrders, cancelOrder, Order } from "../../src/services/orderService";
import { getUser } from "../../src/utils/storage";
import { translateApiServiceType } from "../../src/utils/serviceLabels";

const TEAL       = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#EFEFEA";
const GRAY_TEXT  = "#ABABAB";
const TEXT_DARK  = "#1A1A1A";
const TEXT_MID   = "#666666";

const STATUS_COLOR: Record<Order["uiStatus"], string> = {
  Delivered: TEAL,
  Cancelled: "#E53935",
  "In Process": "#F5A623",
};

// Orders can only be cancelled before a rider has picked them up, and only
// within a 2-hour window from creation — mirrors the backend's own check in
// cancelOrder() (see orderService.ts).
const CANCELLABLE_STATUSES: Order["status"][] = [
  "pending_sp",
  "sp_assigned",
  "sp_accepted",
  "rider_pickup_assigned",
];
const CANCEL_WINDOW_MINUTES = 120;

function getCancelWindow(order: Order): { canCancel: boolean; minsLeft: number } {
  const elapsedMins = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
  const minsLeft = Math.max(0, Math.ceil(CANCEL_WINDOW_MINUTES - elapsedMins));
  const canCancel = minsLeft > 0 && CANCELLABLE_STATUSES.includes(order.status);
  return { canCancel, minsLeft };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/* ─── Active Order Card with Timeline ─── */
function ActiveOrderCard({ order, onCancel }: { order: Order; onCancel: () => void }) {
  const { t } = useTranslation();
  const [cancelling, setCancelling] = useState(false);
  const { canCancel, minsLeft } = getCancelWindow(order);
  const serviceLabel = translateApiServiceType(t, order.items[0]?.service) ?? order.items[0]?.productName ?? "";

  const handleCancel = () => {
    Alert.alert(t("orders.cancel_order_title"), t("orders.cancel_order_message"), [
      { text: t("orders.no"), style: "cancel" },
      {
        text: t("orders.yes_cancel"),
        style: "destructive",
        onPress: async () => {
          setCancelling(true);
          try {
            const user = await getUser();
            if (!user?.id) throw new Error(t("orders.something_went_wrong"));
            await cancelOrder(String(order.id), user.id);
            onCancel();
          } catch (err: any) {
            Alert.alert(t("orders.cannot_cancel"), err.message ?? t("orders.something_went_wrong"));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.activeCard}>
      {/* Order summary row */}
      <View style={styles.activeSummaryRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="tshirt-crew" size={22} color={TEAL} />
        </View>
        <View style={styles.cardCenter}>
          <View style={styles.row}>
            <Text style={styles.orderId}>#{order.id}</Text>
            <Text style={[styles.statusText, { color: STATUS_COLOR[order.uiStatus] }]}>
              {order.uiStatus}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.orderMeta}>
              {serviceLabel} • {order.totalItems} {t("orders.items")}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            <Text style={styles.price}>₹{order.totalAmount}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      <View style={styles.timeline}>
        {order.trackingSteps.map((step, index) => {
          const isLast = index === order.trackingSteps.length - 1;
          const isNextPending = !step.completed && (index === 0 || order.trackingSteps[index - 1].completed);

          return (
            <View key={index} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                {step.completed ? (
                  <View style={styles.dotCompleted}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={TEAL} />
                  </View>
                ) : (
                  <View style={[
                    styles.dotEmpty,
                    isNextPending && styles.dotCurrent,
                  ]} />
                )}
                {!isLast && (
                  <View style={[
                    styles.timelineLine,
                    step.completed ? styles.timelineLineDone : styles.timelineLinePending,
                  ]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.stepLabel,
                  !step.completed && styles.stepLabelPending,
                ]}>
                  {step.label}
                </Text>
                {!!step.time && (
                  <Text style={styles.stepTime}>{step.time}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Cancellation window notice */}
      {canCancel && (
        <View style={styles.cancelNotice}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={TEAL} />
          <Text style={styles.cancelNoticeText}>
            {t("orders.free_cancellation", { mins: minsLeft })}
          </Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
        {canCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={cancelling} activeOpacity={0.8}>
            {cancelling
              ? <ActivityIndicator color="#E53935" size="small" />
              : <Text style={styles.cancelBtnText}>{t("orders.cancel_order_btn")}</Text>}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.trackBtn, !canCancel && { flex: 1 }]}
          activeOpacity={0.8}
          onPress={() => router.push(`/trackorder/trackOrderScreen?orderId=${order.id}`)}
        >
          <Text style={styles.trackBtnText}>{t("orders.live_tracking")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── History Order Card ─── */
function OrderCard({ order }: { order: Order }) {
  const { t } = useTranslation();
  const statusColor = STATUS_COLOR[order.uiStatus];
  const serviceLabel = translateApiServiceType(t, order.items[0]?.service) ?? order.items[0]?.productName ?? "";

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/trackorder/trackOrderScreen?orderId=${order.id}`)}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="tshirt-crew" size={22} color={TEAL} />
      </View>
      <View style={styles.cardCenter}>
        <View style={styles.row}>
          <Text style={styles.orderId}>#{order.id}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {order.uiStatus}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.orderMeta}>
            {serviceLabel} • {order.totalItems} {t("orders.items")}
          </Text>
          <Text style={styles.price}>₹{order.totalAmount}</Text>
        </View>
        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={GRAY_TEXT} />
    </TouchableOpacity>
  );
}

/* ─── Main Screen ─────────────────────────────────────────────────────────────── */
export default function Orders() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const user = await getUser();
      if (!user?.id) throw new Error(t("orders.something_went_wrong"));
      const data = await getUserOrders(user.id, activeTab);
      setOrders(data);
    } catch (err: any) {
      setError(err.message ?? t("orders.failed_to_load"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, t]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("orders.title")}</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["active", "history"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={activeTab === tab ? styles.tabActive : styles.tabInactive}
          >
            <Text style={activeTab === tab ? styles.tabActiveText : styles.tabInactiveText}>
              {tab === "active" ? t("orders.active") : t("orders.history")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={TEAL} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={GRAY_TEXT} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchOrders()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t("orders.retry")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} tintColor={TEAL} />}
        >
          {orders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="package-variant" size={52} color={GRAY_TEXT} />
              <Text style={styles.emptyText}>
                {activeTab === "active" ? t("orders.no_active_orders") : t("orders.no_past_orders")}
              </Text>
            </View>
          ) : activeTab === "active" ? (
            orders.map((o) => <ActiveOrderCard key={String(o.id)} order={o} onCancel={() => fetchOrders()} />)
          ) : (
            orders.map((o) => <OrderCard key={String(o.id)} order={o} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GRAY_LIGHT,
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap:16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: TEXT_DARK,
  },

  /* Tabs */
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#E2E2DA",
    borderRadius: 30,
    padding: 4,
  },
  tabActive: {
    flex: 1,
    backgroundColor: TEAL,
    borderRadius: 26,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabActiveText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  tabInactive: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },
  tabInactiveText: {
    color: GRAY_TEXT,
    fontWeight: "600",
    fontSize: 14,
  },

  /* Scroll */
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },

  /* History Card */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  /* Active Card */
  activeCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  activeSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 16,
  },

  /* Shared card internals */
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TEAL_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardCenter: {
    flex: 1,
    gap: 3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_DARK,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "700",
  },
  orderMeta: {
    fontSize: 12,
    color: TEXT_MID,
    flex: 1,
  },
  price: {
    fontSize: 14,
    fontWeight: "800",
    color: TEXT_DARK,
  },
  orderDate: {
    fontSize: 11,
    color: GRAY_TEXT,
  },

  /* Timeline */
  timeline: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: "row",
    minHeight: 44,
  },
  timelineLeft: {
    width: 28,
    alignItems: "center",
  },
  dotCompleted: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  dotEmpty: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#D0D0D0",
    backgroundColor: "#fff",
    marginTop: 1,
    zIndex: 1,
  },
  dotCurrent: {
    borderColor: TEAL,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 2,
    marginBottom: -2,
  },
  timelineLineDone: {
    backgroundColor: TEAL,
  },
  timelineLinePending: {
    backgroundColor: "#E0E0E0",
  },
  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 12,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_DARK,
  },
  stepLabelPending: {
    color: GRAY_TEXT,
    fontWeight: "500",
  },
  stepTime: {
    fontSize: 11,
    color: TEXT_MID,
    marginTop: 1,
  },

  /* Cancellation notice */
  cancelNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: TEAL_LIGHT,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14,
  },
  cancelNoticeText: {
    fontSize: 12,
    color: TEAL,
    fontWeight: "500",
    flex: 1,
  },

  /* Action buttons */
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#E53935",
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#E53935",
    fontWeight: "700",
    fontSize: 14,
  },
  trackBtn: {
    flex: 1,
    backgroundColor: TEAL,
    borderRadius: 30,
    paddingVertical: 13,
    alignItems: "center",
  },
  trackBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  /* Empty */
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: GRAY_TEXT,
    fontWeight: "500",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: TEAL,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
