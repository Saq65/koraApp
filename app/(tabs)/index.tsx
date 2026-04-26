import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/theme/ThemeProvider";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Header from "../../components/Header";
import SideDrawer from "../../components/SideDrawer";

export default function HomeScreen() {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>("Men");
  const [drawerVisible, setDrawerVisible] = useState(false);

  const categories = ["Men", "Women", "Kids", "Linen"];

  const subcategoriesMap: Record<string, string[]> = {
    Men: ["Shirt", "T-Shirt", "Trousers", "Jeans"],
    Women: ["Saree", "Kurti", "Blouse", "Leggings"],
    Kids: ["T-Shirt", "Shorts", "Dress", "Pajamas"],
    Linen: ["Bedsheet", "Towel", "Curtains", "Cushion Cover"],
  };

  const services = [
    { icon: "water-outline", label: "Wash" },
    { icon: "flame-outline", label: "Iron" },
    { icon: "shirt-outline", label: "Wash + Iron" },
  ];

  const recentOrders = [
    {
      id: 1,
      service: "Wash + Iron",
      items: "12 items",
      date: "Mar 28",
      status: "Delivered",
    },
    {
      id: 2,
      service: "Wash + Iron",
      items: "3 items",
      date: "Mar 25",
      status: "Delivered",
    },
  ];

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.background }}
      edges={["top", "bottom"]}
    >
      {/* Header - unchanged */}
      <Header theme={theme} onMenuPress={() => setDrawerVisible(true)} />

      {/* Location row (added) */}
      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={theme.subText} />
        <Text style={[styles.locationText, { color: theme.subText }]}>
          123 Main Street, Mumbai
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ACTIVE ORDER CARD */}
        <LinearGradient
          colors={theme.gradient || [theme.primary, theme.primary]}
          style={styles.orderCard}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.orderLabel}>ACTIVE ORDER</Text>
            <Text style={styles.orderId}>Order #KOR-2847</Text>
            <View style={styles.orderRow}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={styles.orderTime}>In Process • Est. 4:30 PM</Text>
            </View>
          </View>
          <View style={styles.iconBox}>
            <Ionicons name="shirt-outline" size={20} color="#fff" />
          </View>
        </LinearGradient>

        {/* SERVICES SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Services
          </Text>
          <Text style={{ color: theme.primary }}>See all</Text>
        </View>
        <View style={styles.serviceRow}>
          {services.map((service, index) => (
            <Service
              key={index}
              icon={service.icon}
              label={service.label}
              theme={theme}
              active={service.label === "Iron"}
            />
          ))}
        </View>

        {/* CATEGORIES SECTION */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Categories
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                {
                  backgroundColor:
                    selectedCategory === category ? theme.primary : theme.card,
                },
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={{
                  color: selectedCategory === category ? "#fff" : theme.text,
                  fontWeight: "600",
                }}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SUBCATEGORIES */}
        {selectedCategory && subcategoriesMap[selectedCategory] && (
          <View style={styles.subcategoryContainer}>
            <Text style={[styles.subcategoryTitle, { color: theme.text }]}>
              {selectedCategory} Items
            </Text>
            <View style={styles.subcategoryRow}>
              {subcategoriesMap[selectedCategory].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.subcategoryChip, { backgroundColor: theme.card }]}
                >
                  <Text style={{ color: theme.text }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* SPECIAL OFFER */}
        <View
          style={[
            styles.promoCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Text style={{ color: "#f59e0b", fontWeight: "600" }}>
            ✨ SPECIAL OFFER
          </Text>
          <Text style={[styles.promoTitle, { color: theme.text }]}>
            30% Off First Order!
          </Text>
          <Text style={{ color: theme.subText }}>Use code KORA30 at checkout</Text>
        </View>

        {/* RECENT ORDERS */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          Recent Orders
        </Text>
        {recentOrders.map((order) => (
          <View
            key={order.id}
            style={[styles.recentOrderCard, { backgroundColor: theme.card }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.recentOrderService, { color: theme.text }]}>
                {order.service}
              </Text>
              <Text style={{ color: theme.subText, fontSize: 12 }}>
                {order.items} • {order.date}
              </Text>
            </View>
            <Text style={{ color: theme.primary, fontWeight: "500" }}>
              {order.status}
            </Text>
          </View>
        ))}
      </ScrollView>

    <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.pickupBtn, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.pickupText}>Book Pickup</Text>
        </TouchableOpacity>
      </View>

      {/* SideDrawer - unchanged */}
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

// ==================== SERVICE COMPONENT (IMPROVED) ====================
const Service = ({ icon, label, theme, active = false }: any) => {
  return (
    <TouchableOpacity
      style={[
        styles.serviceCard,
        {
          backgroundColor: active ? "#f59e0b" : theme.card,
          borderWidth: active ? 0 : 1,
          borderColor: theme.border,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={active ? "#fff" : theme.primary}
      />
      <Text
        style={{
          marginTop: 6,
          color: active ? "#fff" : theme.text,
          fontSize: 12,
          fontWeight: "500",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    marginLeft: 4,
  },
  orderCard: {
    margin: 16,
    padding: 16,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  orderLabel: { color: "#fff", fontSize: 12, opacity: 0.9 },
  orderId: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 5 },
  orderRow: { flexDirection: "row", alignItems: "center", marginTop: 5 },
  orderTime: { color: "#fff", marginLeft: 5, fontSize: 12 },
  iconBox: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  serviceCard: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    width: 90,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 30,
    marginHorizontal: 8,
    marginTop: 10,
  },
  subcategoryContainer: { marginTop: 20, paddingHorizontal: 16 },
  subcategoryTitle: { fontSize: 14, fontWeight: "600", marginBottom: 12 },
  subcategoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  subcategoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    marginRight: 8,
    marginBottom: 8,
  },
  promoCard: { margin: 16, padding: 16, borderRadius: 20, borderWidth: 1 },
  promoTitle: { fontSize: 16, fontWeight: "700", marginTop: 4, marginBottom: 4 },
  recentOrderCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
  },
  recentOrderService: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
  bottomTab: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
  },
   bottomContainer: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  pickupBtn: { padding: 16, borderRadius: 30, alignItems: "center" },
  pickupText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});