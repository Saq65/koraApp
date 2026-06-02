import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../../components/Header";
import SideDrawer from "../../components/SideDrawer";
import { router } from "expo-router";
import { getUser } from "../../src/utils/storage";
import { getActiveOrder, getRecentOrders } from "../../src/api/order";
import AppBackground from "@/components/AppBackground";

const { width: W, height: H } = Dimensions.get("window");
const s = (n: number) => Math.round((W / 375) * n);
const vs = (n: number) => Math.round((H / 812) * n);
const ms = (n: number, f = 0.4) => n + (s(n) - n) * f;

const TEAL = "#2d7a6e";
const TEAL_DARK = "#1f5c54";
const TEAL_LIGHT = "#e8f5f3";

const R = s(18);
const PH = s(16);

export default function HomeScreen() {
  const { theme } = useTheme();
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Dynamic state
  const [userName, setUserName] = useState("");
  const [latestActiveOrder, setLatestActiveOrder] = useState<any>(null);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const BUTTON_HEIGHT = vs(56);
  const BUTTON_BOTTOM = vs(16);
  const bottomPad = BUTTON_HEIGHT + BUTTON_BOTTOM + vs(12);

  // Helper: format status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending_sp": return "Pending";
      case "accepted": return "In Process";
      case "picked_up": return "Picked Up";
      case "delivered": return "Delivered";
      case "cancelled": return "Cancelled";
      default: return status;
    }
  };

  // Helper: format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    try {
      const user = await getUser();
      if (user?.name) setUserName(user.name);
      else setUserName("Guest");

      const [activeRes, recentRes] = await Promise.all([
        getActiveOrder(),
        getRecentOrders(),
      ]);

      // activeRes.data is now an array of { order, tracking, cancellationDeadline }
      const activeOrdersArray = activeRes.success && Array.isArray(activeRes.data) ? activeRes.data : [];
      setActiveOrdersCount(activeOrdersArray.length);

      if (activeOrdersArray.length > 0) {
        // Pick the first order (most recent because backend sorted by createdAt -1)
        const first = activeOrdersArray[0];
        const orderFromApi = first.order;
        setLatestActiveOrder({
          _id: orderFromApi.id,
          orderNumber: orderFromApi.id,
          service: orderFromApi.service,
          items: orderFromApi.items,
          price: orderFromApi.price,
          status: orderFromApi.status,
          date: orderFromApi.date,
          itemCount: orderFromApi.items, // items is a number already
        });
      } else {
        setLatestActiveOrder(null);
      }

      setRecentOrders(recentRes.data || []);
    } catch (error) {
      console.error("Home fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  // Services list (unchanged)
  const services = [
    {
      icon: "water-outline", label: "Laundry", sub: "Wash, Iron &\nmore", iconBg: TEAL_LIGHT, iconColor: TEAL, soon: false, route: "/category",
    },
    { icon: "sparkles-outline", label: "Dry Clean", sub: "Premium care", iconBg: "#1a1a2e", iconColor: "#fff", soon: true },
    { icon: "cube-outline", label: "Rental", sub: "Coming soon", iconBg: "#f59e0b", iconColor: "#fff", soon: true },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header theme={theme} onMenuPress={() => setDrawerVisible(true)} userName={userName || "Loading..."} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={TEAL} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppBackground>
        <Header theme={theme} onMenuPress={() => setDrawerVisible(true)} userName={userName} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* ACTIVE ORDER CARD */}
          {latestActiveOrder ? (
            <TouchableOpacity onPress={() => router.push(`/trackorder/trackorder?orderId=${latestActiveOrder._id}`)} activeOpacity={0.8}>
              <View style={styles.cardWrap}>
                <LinearGradient
                  colors={[TEAL, TEAL_DARK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.orderCard}
                >
                  <View style={styles.circle1} />
                  <View style={styles.circle2} />

                  <View style={{ flex: 1, zIndex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={styles.orderTag}>ACTIVE ORDER</Text>
                      {activeOrdersCount > 1 && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>+{activeOrdersCount - 1} more</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.orderId}>{latestActiveOrder.orderNumber}</Text>
                    <View style={styles.orderTimeRow}>
                      <Ionicons name="time-outline" size={s(13)} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.orderTime}>
                        {getStatusText(latestActiveOrder.status)} • {latestActiveOrder.itemCount} items
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderIconBox}>
                    <Ionicons name="shirt-outline" size={s(22)} color="#fff" />
                  </View>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.cardWrap}>
              <View style={styles.noOrderCard}>
                <Ionicons name="cart-outline" size={s(32)} color={TEAL} />
                <Text style={styles.noOrderText}>No active order</Text>
                <TouchableOpacity onPress={() => router.push('/placeorder/placeorder')}>
                  <LinearGradient colors={[TEAL, TEAL_DARK]} style={styles.startOrderBtn}>
                    <Text style={styles.startOrderBtnText}>Place first order</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* SERVICES */}
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesRow}>
            {services.map((svc, i) => (
              <ServiceCard key={i} {...svc} />
            ))}
          </View>

          {/* PROMO */}
          <View style={styles.promoCard}>
            <Text style={styles.promoTag}> SPECIAL OFFER</Text>
            <Text style={styles.promoTitle}>30% Off First Order!</Text>
            <Text style={styles.promoSub}>Use code KORA30 at checkout</Text>
          </View>

          {/* RECENT ORDERS */}
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          {recentOrders.length === 0 ? (
            <Text style={styles.emptyText}>No orders yet</Text>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order._id}
                onPress={() => router.push(`/order/${order._id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.recentCard}>
                  <View style={styles.recentIconBox}>
                    <Ionicons name="shirt-outline" size={s(20)} color={TEAL} />
                  </View>
                  <View style={{ flex: 1, marginLeft: s(12) }}>
                    <Text style={styles.recentService}>{order.orderNumber}</Text>
                    <Text style={styles.recentMeta}>
                      {order.items?.length || 0} items • {formatDate(order.createdAt)}
                    </Text>
                  </View>
                  <Text style={styles.recentStatus}>{getStatusText(order.status)}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* FLOATING BOOK PICKUP BUTTON */}
        <View style={[styles.bottomBar, { bottom: BUTTON_BOTTOM }]}>
          <TouchableOpacity onPress={() => router.push('/placeorder/placeorder')} activeOpacity={0.88}>
            <LinearGradient colors={[TEAL, TEAL_DARK]} style={styles.pickupBtn}>
              <Ionicons name="car-outline" size={s(20)} color="#fff" />
              <Text style={styles.pickupText}>Book Pickup</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {drawerVisible && (
          <SideDrawer
            visible={drawerVisible}
            onClose={() => setDrawerVisible(false)}
            theme={theme}
          />
        )}
      </AppBackground>
    </SafeAreaView>
  );
}

// Service Card component (unchanged)
function ServiceCard({ icon, label, sub, iconBg, iconColor, soon, route }: any) {
  return (
    <TouchableOpacity
      onPress={() => {
        if (!soon && route) router.push(route);
      }}
      activeOpacity={0.85}
      style={styles.serviceCard}
    >
      {soon && (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>SOON</Text>
        </View>
      )}
      <View style={[styles.serviceIconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={s(24)} color={iconColor} />
      </View>
      <Text style={styles.serviceLabel}>{label}</Text>
      <Text style={styles.serviceSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f5",
  },
  cardWrap: { paddingHorizontal: PH, marginTop: vs(8) },
  orderCard: {
    borderRadius: R, padding: s(18),
    flexDirection: "row", alignItems: "center",
    overflow: "hidden", minHeight: vs(100),
  },
  circle1: {
    position: "absolute", width: s(100), height: s(100),
    borderRadius: s(50), backgroundColor: "rgba(255,255,255,0.07)",
    top: -s(30), right: s(30),
  },
  circle2: {
    position: "absolute", width: s(70), height: s(70),
    borderRadius: s(35), backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -s(20), right: -s(10),
  },
  orderTag: {
    color: "rgba(255,255,255,0.75)", fontSize: ms(11),
    fontWeight: "600", letterSpacing: 0.6, marginBottom: vs(5),
  },
  orderId: { color: "#fff", fontSize: ms(20), fontWeight: "800", marginBottom: vs(6) },
  orderTimeRow: { flexDirection: "row", alignItems: "center" },
  orderTime: { color: "rgba(255,255,255,0.8)", fontSize: ms(12) },
  orderIconBox: {
    width: s(46), height: s(46), borderRadius: s(14),
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center", zIndex: 1,
  },
  noOrderCard: {
    backgroundColor: "#fff",
    borderRadius: R,
    padding: s(24),
    alignItems: "center",
    marginHorizontal: PH,
  },
  noOrderText: {
    fontSize: ms(14),
    color: "#666",
    marginTop: vs(8),
    marginBottom: vs(16),
  },
  startOrderBtn: {
    paddingVertical: vs(10),
    paddingHorizontal: s(20),
    borderRadius: s(25),
  },
  startOrderBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: ms(14),
  },
  sectionTitle: {
    fontSize: ms(17), fontWeight: "700", color: "#1a1a1a",
    paddingHorizontal: PH, marginTop: vs(22), marginBottom: vs(12),
  },
  servicesRow: { flexDirection: "row", paddingHorizontal: PH, gap: s(12), justifyContent: 'center' },
  serviceCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: R,
    padding: s(14), alignItems: "flex-start", position: "relative",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  soonBadge: {
    position: "absolute", top: s(10), right: s(10),
    backgroundColor: "#f59e0b", borderRadius: s(6),
    paddingHorizontal: s(5), paddingVertical: s(2),
  },
  soonText: { color: "#fff", fontSize: ms(8), fontWeight: "800", letterSpacing: 0.4 },
  serviceIconCircle: {
    width: s(46), height: s(46), borderRadius: s(23),
    alignItems: "center", justifyContent: "center", marginBottom: vs(10),
  },
  serviceLabel: { fontSize: ms(13), fontWeight: "700", color: "#1a1a1a", marginBottom: vs(3) },
  serviceSub: { fontSize: ms(11), color: "#888", lineHeight: ms(15) },
  promoCard: {
    marginHorizontal: PH, marginTop: vs(18), backgroundColor: TEAL_LIGHT,
    borderRadius: R, padding: s(20), borderLeftWidth: 4, borderLeftColor: TEAL,
  },
  promoTag: { fontSize: ms(11), fontWeight: "700", color: "#c07a00", marginBottom: vs(4) },
  promoTitle: { fontSize: ms(17), fontWeight: "800", color: "#1a1a1a", marginBottom: vs(4) },
  promoSub: { fontSize: ms(12), color: "#555" },
  recentCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff",
    marginHorizontal: PH, marginBottom: vs(10), padding: s(14),
    borderRadius: R, shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  recentIconBox: {
    width: s(42), height: s(42), borderRadius: s(21),
    backgroundColor: TEAL_LIGHT, alignItems: "center", justifyContent: "center",
  },
  recentService: { fontSize: ms(14), fontWeight: "700", color: "#1a1a1a", marginBottom: vs(3) },
  recentMeta: { fontSize: ms(12), color: "#888" },
  recentStatus: { fontSize: ms(13), fontWeight: "600", color: TEAL },
  bottomBar: {
    position: "absolute",
    left: PH,
    right: PH,
  },
  pickupBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: vs(17), borderRadius: s(50), gap: s(8),
  },
  pickupText: { color: "#fff", fontSize: ms(16), fontWeight: "800" },
  emptyText: {
    textAlign: "center",
    color: "#888",
    marginTop: vs(20),
    fontSize: ms(14),
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: s(12),
    paddingHorizontal: s(8),
    paddingVertical: s(2),
  },
  badgeText: {
    color: "#fff",
    fontSize: ms(10),
    fontWeight: "600",
  },
});