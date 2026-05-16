import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../../components/Header";
import SideDrawer from "../../components/SideDrawer";
import { router } from "expo-router";

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
  const insets = useSafeAreaInsets();

  // Height of the floating Book Pickup button + its padding
  const BUTTON_HEIGHT = vs(56);
  const BUTTON_BOTTOM = vs(16);
  const bottomPad = BUTTON_HEIGHT + BUTTON_BOTTOM + vs(12);

  const services = [
    {
      icon: "water-outline", label: "Laundry", sub: "Wash, Iron &\nmore", iconBg: TEAL_LIGHT, iconColor: TEAL, soon: false, route: "/category",
    },
    { icon: "sparkles-outline", label: "Dry Clean", sub: "Premium care", iconBg: "#1a1a2e", iconColor: "#fff", soon: true },
    { icon: "cube-outline", label: "Rental", sub: "Coming soon", iconBg: "#f59e0b", iconColor: "#fff", soon: true },
  ];

  const recentOrders = [
    { id: 1, service: "Wash + Iron", items: "12 items", date: "Mar 28", status: "Delivered" },
    { id: 2, service: "Wash + Iron", items: "3 items", date: "Mar 25", status: "Delivered" },
  ];

  return (
    // edges={["top"]} only — bottom is handled by the tab bar itself
    <SafeAreaView style={styles.container} edges={["top"]}>

      <Header theme={theme} onMenuPress={() => setDrawerVisible(true)} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
      >
        {/* ── ACTIVE ORDER CARD ── */}
        <TouchableOpacity onPress={()=>router.push('/trackorder/trackorder')}>
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
                <Text style={styles.orderTag}>ACTIVE ORDER</Text>
                <Text style={styles.orderId}>Order #KR-2847</Text>
                <View style={styles.orderTimeRow}>
                  <Ionicons name="time-outline" size={s(13)} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.orderTime}> In Process • Est. 4:30 PM</Text>
                </View>
              </View>

              <View style={styles.orderIconBox}>
                <Ionicons name="shirt-outline" size={s(22)} color="#fff" />
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>


        {/* ── SERVICES ── */}
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.servicesRow}>
          {services.map((svc, i) => (
            <ServiceCard key={i} {...svc} />
          ))}
        </View>

        {/* ── PROMO ── */}
        <View style={styles.promoCard}>
          <Text style={styles.promoTag}> SPECIAL OFFER</Text>
          <Text style={styles.promoTitle}>30% Off First Order!</Text>
          <Text style={styles.promoSub}>Use code KORA30 at checkout</Text>
        </View>

        {/* ── RECENT ORDERS ── */}
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.map((order) => (
          <View key={order.id} style={styles.recentCard}>
            <View style={styles.recentIconBox}>
              <Ionicons name="shirt-outline" size={s(20)} color={TEAL} />
            </View>
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text style={styles.recentService}>{order.service}</Text>
              <Text style={styles.recentMeta}>{order.items} • {order.date}</Text>
            </View>
            <Text style={styles.recentStatus}>{order.status}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ── BOOK PICKUP — floats above tab bar ── */}
      <View style={[styles.bottomBar, { bottom: BUTTON_BOTTOM }]}>
        <TouchableOpacity onPress={() => router.push('/placeorder/placeorder')} activeOpacity={0.88}>
          <LinearGradient
            colors={[TEAL, TEAL_DARK]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.pickupBtn}
          >
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
    </SafeAreaView>
  );
}

// ── Service Card ──────────────────────────────────────────────
function ServiceCard({ icon, label, sub, iconBg, iconColor, soon, route }: any) {
  return (
    <TouchableOpacity onPress={() => {
      if (!soon && route) router.push(route);
    }}
      activeOpacity={0.85} style={styles.serviceCard}>
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

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f5",
  },

  // Order card
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

  // Section title
  sectionTitle: {
    fontSize: ms(17), fontWeight: "700", color: "#1a1a1a",
    paddingHorizontal: PH, marginTop: vs(22), marginBottom: vs(12),
  },

  // Services
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

  // Promo
  promoCard: {
    marginHorizontal: PH, marginTop: vs(18), backgroundColor: TEAL_LIGHT,
    borderRadius: R, padding: s(20), borderLeftWidth: 4, borderLeftColor: TEAL,
  },
  promoTag: { fontSize: ms(11), fontWeight: "700", color: "#c07a00", marginBottom: vs(4) },
  promoTitle: { fontSize: ms(17), fontWeight: "800", color: "#1a1a1a", marginBottom: vs(4) },
  promoSub: { fontSize: ms(12), color: "#555" },

  // Recent orders
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

  // Bottom button
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
});