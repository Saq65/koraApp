import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

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

const TEAL       = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#EFEFEA";
const GRAY_TEXT  = "#ABABAB";
const TEXT_DARK  = "#1A1A1A";
const TEXT_MID   = "#666666";

const ACTIVE_ORDER: Order = {
  id: "#KR-2847",
  service: "Wash + Iron",
  items: 8,
  date: "Apr 6, 2026",
  price: 480,
  status: "In Process",
  iconName: "tshirt-crew",
};

const TRACKING_STEPS: TrackingStep[] = [
  { label: "Order Placed",     time: "Apr 6, 10:00 AM", completed: true },
  { label: "Rider on the way", time: "Apr 6, 10:15 AM", completed: true },
  { label: "Rider collected",  time: "Apr 6, 10:30 AM", completed: true },
  { label: "Service started",  time: "Apr 6, 11:00 AM", completed: true },
  { label: "Out for delivery", time: "Est. 4:30 PM",    completed: false, isEstimate: true },
  { label: "Delivered",        time: "",                 completed: false },
];

const HISTORY_ORDERS: Order[] = [
  {
    id: "#KR-2846",
    service: "Wash + Iron",
    items: 12,
    date: "Mar 28, 2026",
    price: 720,
    status: "Delivered",
    iconName: "tshirt-crew",
  },
  {
    id: "#KR-2840",
    service: "Dry Clean",
    items: 3,
    date: "Mar 25, 2026",
    price: 560,
    status: "Delivered",
    iconName: "spray-bottle",
  },
  {
    id: "#KR-2835",
    service: "Iron",
    items: 15,
    date: "Mar 20, 2026",
    price: 300,
    status: "Delivered",
    iconName: "iron",
  },
  {
    id: "#KR-2830",
    service: "Wash",
    items: 6,
    date: "Mar 15, 2026",
    price: 240,
    status: "Delivered",
    iconName: "washing-machine",
  },
  {
    id: "#KR-2825",
    service: "Wash + Iron",
    items: 10,
    date: "Mar 10, 2026",
    price: 0,
    status: "Cancelled",
    iconName: "tshirt-crew",
  },
];

const STATUS_COLOR: Record<OrderStatus, string> = {
  Delivered: TEAL,
  Cancelled: "#E53935",
  "In Process": "#F5A623",
};

/* ─── Active Order Card with Timeline ─── */
function ActiveOrderCard() {
  return (
    <View style={styles.activeCard}>
      {/* Order summary row */}
      <View style={styles.activeSummaryRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={ACTIVE_ORDER.iconName} size={22} color={TEAL} />
        </View>
        <View style={styles.cardCenter}>
          <View style={styles.row}>
            <Text style={styles.orderId}>{ACTIVE_ORDER.id}</Text>
            <Text style={[styles.statusText, { color: STATUS_COLOR[ACTIVE_ORDER.status] }]}>
              {ACTIVE_ORDER.status}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.orderMeta}>
              {ACTIVE_ORDER.service} • {ACTIVE_ORDER.items} items
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.orderDate}>{ACTIVE_ORDER.date}</Text>
            <Text style={styles.price}>₹{ACTIVE_ORDER.price}</Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      <View style={styles.timeline}>
        {TRACKING_STEPS.map((step, index) => {
          const isLast = index === TRACKING_STEPS.length - 1;
          const isNextPending = !step.completed && (index === 0 || TRACKING_STEPS[index - 1].completed);

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
                {step.time !== "" && (
                  <Text style={[
                    styles.stepTime,
                    step.isEstimate && styles.stepTimeEstimate,
                  ]}>
                    {step.time}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Cancellation notice */}
      <View style={styles.cancelNotice}>
        <MaterialCommunityIcons name="clock-outline" size={14} color={TEAL} />
        <Text style={styles.cancelNoticeText}>
          Free cancellation — 90 mins left in 2hr window
        </Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.8}>
          <Text style={styles.cancelBtnText}>Cancel Order</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.trackBtn} activeOpacity={0.8}>
          <Text style={styles.trackBtnText}>Live Tracking</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ─── History Order Card ─── */
function OrderCard({ order }: { order: Order }) {
  const statusColor = STATUS_COLOR[order.status];

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={order.iconName} size={22} color={TEAL} />
      </View>
      <View style={styles.cardCenter}>
        <View style={styles.row}>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {order.status}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.orderMeta}>
            {order.service} • {order.items} items
          </Text>
          <Text style={styles.price}>₹{order.price}</Text>
        </View>
        <Text style={styles.orderDate}>{order.date}</Text>
      </View>
<MaterialIcons name="chevron-right" size={22} color={GRAY_TEXT} />
    </TouchableOpacity>
  );
};

/* ─── Main Screen ─────────────────────────────────────────────────────────────── */
export default function Orders() {
  const [activeTab, setActiveTab] = useState<"active" | "history">("active");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Services</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          onPress={() => setActiveTab("active")}
          style={activeTab === "active" ? styles.tabActive : styles.tabInactive}
        >
          <Text style={activeTab === "active" ? styles.tabActiveText : styles.tabInactiveText}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("history")}
          style={activeTab === "history" ? styles.tabActive : styles.tabInactive}
        >
          <Text style={activeTab === "history" ? styles.tabActiveText : styles.tabInactiveText}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "active" ? (
          <ActiveOrderCard />
        ) : HISTORY_ORDERS.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="package-variant" size={52} color={GRAY_TEXT} />
            <Text style={styles.emptyText}>No orders found</Text>
          </View>
        ) : (
          HISTORY_ORDERS.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GRAY_LIGHT,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  stepTimeEstimate: {
    color: TEAL,
    fontWeight: "600",
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
  },
});