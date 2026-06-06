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
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../../components/Header";
import SideDrawer from "../../components/SideDrawer";
import { router } from "expo-router";
import { getUser } from "../../src/utils/storage";
import { getActiveOrder, getRecentOrders } from "../../src/api/order";
import AppBackground from "@/components/AppBackground";
import { useTranslation } from "react-i18next";

const { width: W, height: H } = Dimensions.get("window");
const s = (n: number) => Math.round((W / 375) * n);
const vs = (n: number) => Math.round((H / 812) * n);
const ms = (n: number, f = 0.4) => n + (s(n) - n) * f;

const R = s(18);
const PH = s(16);

const TEAL = "#1D9E75";
const TEAL_LIGHT = "#E1F5EE";
const TEAL_DARK = "#0F6E56";

export default function HomeScreen() {
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userName, setUserName] = useState("");
  const [latestActiveOrder, setLatestActiveOrder] = useState<any>(null);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const BUTTON_HEIGHT = vs(56);
  const BUTTON_BOTTOM = vs(16);
  const bottomPad = BUTTON_HEIGHT + BUTTON_BOTTOM + vs(12);

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending_sp": return t("order.status_pending");
      case "accepted":   return t("order.status_accepted");
      case "picked_up":  return t("order.status_picked_up");
      case "delivered":  return t("order.status_delivered");
      case "cancelled":  return t("order.status_cancelled");
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // services inside component so t() works
  const services = [
    {
      icon: "water-outline",
      label: t("services.laundry"),
      sub: t("services.laundry_sub"),
      iconBg: TEAL_LIGHT,
      iconColor: TEAL,
      soon: false,
      route: "/category",
    },
    {
      icon: "sparkles-outline",
      label: t("services.dry_clean"),
      sub: t("services.dry_clean_sub"),
      iconBg: "#1a1a2e",
      iconColor: "#fff",
      soon: true,
    },
    {
      icon: "cube-outline",
      label: t("services.rental"),
      sub: t("services.rental_sub"),
      iconBg: "#f59e0b",
      iconColor: "#fff",
      soon: true,
    },
  ];

  const fetchAllData = useCallback(async () => {
    try {
      const user = await getUser();
      setUserName(user?.name || t("common.guest"));

      const [activeRes, recentRes] = await Promise.all([
        getActiveOrder(),
        getRecentOrders(),
      ]);

      const activeOrdersArray =
        activeRes.success && Array.isArray(activeRes.data) ? activeRes.data : [];
      setActiveOrdersCount(activeOrdersArray.length);

      if (activeOrdersArray.length > 0) {
        const orderFromApi = activeOrdersArray[0].order;
        setLatestActiveOrder({
          _id: orderFromApi.id,
          orderNumber: orderFromApi.id,
          service: orderFromApi.service,
          items: orderFromApi.items,
          price: orderFromApi.price,
          status: orderFromApi.status,
          date: orderFromApi.date,
          itemCount: orderFromApi.items,
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
  }, [t]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <Header
          theme={theme}
          onMenuPress={() => setDrawerVisible(true)}
          userName={t("common.loading")}
        />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["top"]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />
      <AppBackground>
        <Header
          theme={theme}
          onMenuPress={() => setDrawerVisible(true)}
          userName={userName}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        >
          {/* ACTIVE ORDER CARD */}
          {latestActiveOrder ? (
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/trackorder/trackOrderScreen?orderId=${latestActiveOrder.orderNumber}`
                )
              }
              activeOpacity={0.8}
            >
              <View style={styles.cardWrap}>
                <LinearGradient
                  colors={[theme.primary, theme.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.orderCard}
                >
                  <View style={styles.circle1} />
                  <View style={styles.circle2} />

                  <View style={{ flex: 1, zIndex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={styles.orderTag}>{t("home.active_order")}</Text>
                      {activeOrdersCount > 1 && (
                        <View style={[styles.badge, { backgroundColor: "rgba(255,255,255,0.3)" }]}>
                          <Text style={styles.badgeText}>+{activeOrdersCount - 1} more</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.orderId}>{latestActiveOrder.orderNumber}</Text>
                    <View style={styles.orderTimeRow}>
                      <Ionicons name="time-outline" size={s(13)} color="rgba(255,255,255,0.8)" />
                      <Text style={styles.orderTime}>
                        {getStatusText(latestActiveOrder.status)} •{" "}
                        {latestActiveOrder.itemCount} {t("order.items")}
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
              <View style={[styles.noOrderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="cart-outline" size={s(32)} color={TEAL} />
                <Text style={[styles.noOrderText, { color: theme.subText }]}>{t("home.no_active_order")}</Text>
                <TouchableOpacity onPress={() => router.push("/placeorder/placeorder")}>
                  <LinearGradient colors={[TEAL, TEAL_DARK]} style={styles.startOrderBtn}>
                    <Text style={styles.startOrderBtnText}>{t("home.place_first_order")}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* SERVICES */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("home.services")}</Text>
          <View style={styles.servicesRow}>
            {services.map((svc, i) => (
              <ServiceCard key={i} {...svc} theme={theme} t={t} />
            ))}
          </View>

          {/* PROMO - FIXED with proper card styling */}
          <View style={[styles.promoCard, { backgroundColor: theme.card, borderLeftColor: TEAL, shadowColor: theme.shadow }]}>
            <View style={[styles.promoTagContainer, { backgroundColor: isDarkMode ? 'rgba(29, 158, 117, 0.15)' : TEAL_LIGHT }]}>
              <Text style={[styles.promoTag, { color: TEAL }]}>{t("home.special_offer")}</Text>
            </View>
            <Text style={[styles.promoTitle, { color: theme.text }]}>{t("home.promo_title")}</Text>
            <Text style={[styles.promoSub, { color: theme.subText }]}>{t("home.promo_code")}</Text>
          </View>

          {/* RECENT ORDERS */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("home.recent_orders")}</Text>
          {recentOrders.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.subText }]}>{t("home.no_orders_yet")}</Text>
          ) : (
            recentOrders.map((order) => (
              <TouchableOpacity
                key={order._id}
                onPress={() =>
                  router.push(`/order/orderDetails?orderId=${order._id}`)
                }
                activeOpacity={0.7}
              >
                <View style={[styles.recentCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
                  <View style={[styles.recentIconBox, { backgroundColor: theme.primaryLight }]}>
                    <Ionicons name="shirt-outline" size={s(20)} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: s(12) }}>
                    <Text style={[styles.recentService, { color: theme.text }]}>{order.orderNumber}</Text>
                    <Text style={[styles.recentMeta, { color: theme.subText }]}>
                      {order.items?.length || 0} {t("order.items")} •{" "}
                      {formatDate(order.createdAt)}
                    </Text>
                  </View> 
                  <Text style={[styles.recentStatus, { color: theme.primary }]}>
                    {getStatusText(order.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* FLOATING BOOK PICKUP BUTTON */}
        <View style={[styles.bottomBar, { bottom: BUTTON_BOTTOM }]}>
          <TouchableOpacity
            onPress={() => router.push("/placeorder/placeorder")}
            activeOpacity={0.88}
          >
            <LinearGradient colors={[TEAL, TEAL_DARK]} style={styles.pickupBtn}>
              <Ionicons name="car-outline" size={s(20)} color="#fff" />
              <Text style={styles.pickupText}>{t("home.book_pickup")}</Text>
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

function ServiceCard({ icon, label, sub, iconBg, iconColor, soon, route, theme, t }: any) {
  return (
    <TouchableOpacity
      onPress={() => { if (!soon && route) router.push(route); }}
      activeOpacity={0.85}
      style={[styles.serviceCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}
    >
      {soon && (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>{t("services.coming_soon")}</Text>
        </View>
      )}
      <View style={[styles.serviceIconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={s(24)} color={iconColor} />
      </View>
      <Text style={[styles.serviceLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.serviceSub, { color: theme.subText }]}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f5" },
  cardWrap: { paddingHorizontal: PH, marginTop: vs(8) },
  orderCard: {
    borderRadius: R, padding: s(18), flexDirection: "row",
    alignItems: "center", overflow: "hidden", minHeight: vs(100),
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
    borderRadius: R,
    padding: s(24),
    alignItems: "center",
    marginHorizontal: PH,
    borderWidth: 1,
  },
  noOrderText: { fontSize: ms(14), marginTop: vs(8), marginBottom: vs(16) },
  startOrderBtn: { paddingVertical: vs(10), paddingHorizontal: s(20), borderRadius: s(25) },
  startOrderBtnText: { color: "#fff", fontWeight: "600", fontSize: ms(14) },
  sectionTitle: {
    fontSize: ms(17), fontWeight: "700",
    paddingHorizontal: PH, marginTop: vs(22), marginBottom: vs(12),
  },
  servicesRow: { flexDirection: "row", paddingHorizontal: PH, gap: s(12), justifyContent: "center" },
  serviceCard: {
    flex: 1, borderRadius: R, padding: s(14),
    alignItems: "flex-start", position: "relative",
    shadowOffset: { width: 0, height: 2 },
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
  serviceLabel: { fontSize: ms(13), fontWeight: "700", marginBottom: vs(3) },
  serviceSub: { fontSize: ms(11), lineHeight: ms(15) },
  promoCard: {
    marginHorizontal: PH,
    marginTop: vs(18),
    borderRadius: R,
    padding: s(10),
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  promoTagContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    borderRadius: s(20),
    marginBottom: vs(10),
  },
  promoTag: { fontSize: ms(11), fontWeight: "700", letterSpacing: 0.5 },
  promoTitle: { fontSize: ms(18), fontWeight: "800", marginBottom: vs(6) },
  promoSub: { fontSize: ms(12), marginBottom: vs(12) },
  promoCodeContainer: {
    backgroundColor: TEAL,
    paddingHorizontal: s(14),
    paddingVertical: vs(6),
    borderRadius: s(20),
    alignSelf: 'flex-start',
  },
  promoCodeText: {
    color: '#fff',
    fontSize: ms(13),
    fontWeight: '700',
    letterSpacing: 1,
  },
  recentCard: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: PH, marginBottom: vs(10), padding: s(14),
    borderRadius: R, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  recentIconBox: {
    width: s(42), height: s(42), borderRadius: s(21),
    alignItems: "center", justifyContent: "center",
  },
  recentService: { fontSize: ms(14), fontWeight: "700", marginBottom: vs(3) },
  recentMeta: { fontSize: ms(12) },
  recentStatus: { fontSize: ms(13), fontWeight: "600" },
  bottomBar: { position: "absolute", left: PH, right: PH },
  pickupBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: vs(17), borderRadius: s(50), gap: s(8),
  },
  pickupText: { color: "#fff", fontSize: ms(16), fontWeight: "800" },
  emptyText: { textAlign: "center", marginTop: vs(20), fontSize: ms(14) },
  badge: {
    backgroundColor: "rgba(255,255,255,0.3)", borderRadius: s(12),
    paddingHorizontal: s(8), paddingVertical: s(2),
  },
  badgeText: { color: "#fff", fontSize: ms(10), fontWeight: "600" },
});