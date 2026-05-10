import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

const { width: W, height: H } = Dimensions.get("window");
const s  = (n: number) => Math.round((W / 375) * n);
const vs = (n: number) => Math.round((H / 812) * n);
const ms = (n: number, f = 0.4) => n + (s(n) - n) * f;

const TEAL       = "#2d7a6e";
const TEAL_LIGHT = "#e8f5f3";

type IconLib = "ion" | "mci";
type Item = { label: string; icon: string; lib: IconLib };

const DATA: Record<string, {
  tabs: string[];
  items: Record<string, Item[]>;
}> = {
  Men: {
    tabs: ["Upper Wear", "Lower Wear", "Garments", "Winter Wear"],
    items: {
      "Upper Wear": [
        { label: "Shirt",   icon: "shirt-outline",          lib: "ion" },
        { label: "T-Shirt", icon: "tshirt-crew-outline",    lib: "mci" },
        { label: "Vest",    icon: "tshirt-outline",         lib: "mci" },
        { label: "Kurta",   icon: "shirt-outline",          lib: "ion" },
        { label: "Jacket",  icon: "jacket",                 lib: "mci" },
        { label: "Hoodie",  icon: "hanger",                 lib: "mci" },
      ],
      "Lower Wear": [
        { label: "Jeans",    icon: "human-male",   lib: "mci" },
        { label: "Trousers", icon: "human-male",   lib: "mci" },
        { label: "Shorts",   icon: "human-male",   lib: "mci" },
        { label: "Pajamas",  icon: "hanger",       lib: "mci" },
      ],
      "Garments": [
        { label: "Suit",     icon: "briefcase-outline", lib: "ion" },
        { label: "Blazer",   icon: "hanger",            lib: "mci" },
        { label: "Sherwani", icon: "hanger",            lib: "mci" },
      ],
      "Winter Wear": [
        { label: "Sweater", icon: "hanger",              lib: "mci" },
        { label: "Coat",    icon: "hanger",              lib: "mci" },
        { label: "Muffler", icon: "scarf",               lib: "mci" },
      ],
    },
  },
  Women: {
    tabs: ["Upper Wear", "Lower Wear", "Ethnic", "Winter Wear"],
    items: {
      "Upper Wear": [
        { label: "Top",    icon: "tshirt-crew-outline", lib: "mci" },
        { label: "Blouse", icon: "hanger",              lib: "mci" },
        { label: "Kurti",  icon: "hanger",              lib: "mci" },
        { label: "Shirt",  icon: "shirt-outline",       lib: "ion" },
      ],
      "Lower Wear": [
        { label: "Leggings", icon: "human-female", lib: "mci" },
        { label: "Jeans",    icon: "human-female", lib: "mci" },
        { label: "Skirt",    icon: "human-female", lib: "mci" },
      ],
      "Ethnic": [
        { label: "Saree",   icon: "hanger", lib: "mci" },
        { label: "Salwar",  icon: "hanger", lib: "mci" },
        { label: "Dupatta", icon: "scarf",  lib: "mci" },
      ],
      "Winter Wear": [
        { label: "Sweater", icon: "hanger", lib: "mci" },
        { label: "Jacket",  icon: "jacket", lib: "mci" },
        { label: "Shawl",   icon: "scarf",  lib: "mci" },
      ],
    },
  },
  Children: {
    tabs: ["Upper Wear", "Lower Wear", "Uniforms", "Winter Wear"],
    items: {
      "Upper Wear": [
        { label: "T-Shirt", icon: "tshirt-crew-outline", lib: "mci" },
        { label: "Shirt",   icon: "shirt-outline",       lib: "ion" },
        { label: "Frock",   icon: "hanger",              lib: "mci" },
      ],
      "Lower Wear": [
        { label: "Shorts",   icon: "human-male-boy",  lib: "mci" },
        { label: "Trousers", icon: "human-male-boy",  lib: "mci" },
        { label: "Skirt",    icon: "human-female",    lib: "mci" },
      ],
      "Uniforms": [
        { label: "School Uniform", icon: "school-outline",   lib: "ion" },
        { label: "Sports Kit",     icon: "football-outline", lib: "ion" },
      ],
      "Winter Wear": [
        { label: "Sweater", icon: "hanger",  lib: "mci" },
        { label: "Jacket",  icon: "jacket",  lib: "mci" },
        { label: "Gloves",  icon: "hand-left-outline", lib: "ion" },
      ],
    },
  },
  Linen: {
    tabs: ["Bedding", "Bath", "Home", "Others"],
    items: {
      "Bedding": [
        { label: "Bedsheet",     icon: "bed-outline",     lib: "ion" },
        { label: "Pillow Cover", icon: "pillow",          lib: "mci" },
        { label: "Blanket",      icon: "bed-outline",     lib: "ion" },
        { label: "Duvet",        icon: "bed-outline",     lib: "ion" },
      ],
      "Bath": [
        { label: "Towel",      icon: "hanger",           lib: "mci" },
        { label: "Bath Mat",   icon: "mat",              lib: "mci" },
        { label: "Hand Towel", icon: "hand-left-outline",lib: "ion" },
      ],
      "Home": [
        { label: "Curtains",      icon: "curtains",       lib: "mci" },
        { label: "Cushion Cover", icon: "sofa-outline",   lib: "mci" },
        { label: "Table Cloth",   icon: "table-furniture",lib: "mci" },
      ],
      "Others": [
        { label: "Sofa Cover", icon: "sofa-outline",    lib: "mci" },
        { label: "Carpet",     icon: "rug",             lib: "mci" },
      ],
    },
  },
};

// ── Icon renderer ─────────────────────────────────────────────
function ClothingIcon({ icon, lib, size, color }: {
  icon: string; lib: IconLib; size: number; color: string;
}) {
  if (lib === "mci") {
    return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
  }
  return <Ionicons name={icon as any} size={size} color={color} />;
}

export default function SubcategoryScreen() {
  const params   = useLocalSearchParams<{ category: string }>();
  const category = params.category || "Men";
  const data     = DATA[category] || DATA["Men"];

  const [activeTab, setActiveTab] = useState(data.tabs[0]);
  const items = data.items[activeTab] || [];

  const COLS      = 3;
  const GAP       = s(12);
  const PAD       = s(16);
  const itemWidth = (W - PAD * 2 - GAP * (COLS - 1)) / COLS;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={s(20)} color="#1a1a1a" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerSuper}>Laundry</Text>
          <Text style={styles.headerTitle}>{category}</Text>
        </View>
      </View>

      {/* ── TABS ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
      >
        {data.tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── ITEMS GRID ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
      >
        <View style={styles.gridInner}>
          {items.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.8}
              style={[styles.itemCard, { width: itemWidth }]}
            >
              {/* Icon circle */}
              <View style={styles.iconCircle}>
                <ClothingIcon
                  icon={item.icon}
                  lib={item.lib}
                  size={s(28)}
                  color={TEAL}
                />
              </View>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f3" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    paddingBottom: vs(16),
    gap: s(12),
  },
  backBtn: {
    width: s(36), height: s(36),
    borderRadius: s(18),
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  headerSuper: { fontSize: ms(12), color: "#888", fontWeight: "500", marginBottom: vs(2) },
  headerTitle: { fontSize: ms(22), fontWeight: "800", color: "#1a1a1a" },

  tabsScroll: {
    paddingHorizontal: s(16),
    paddingBottom: vs(12),
    gap: s(8),
    flexDirection: "row",
    alignItems: "center",
  },
  tab: {
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    borderRadius: s(30),
    backgroundColor: "#fff",
    borderWidth: 1, borderColor: "#e0e0e0",
  },
  tabActive: { backgroundColor: TEAL, borderColor: TEAL },
  tabLabel: { fontSize: ms(13), fontWeight: "600", color: "#555" },
  tabLabelActive: { color: "#fff" },

  grid: { paddingHorizontal: s(16), paddingBottom: vs(24) },
  gridInner: { flexDirection: "row", flexWrap: "wrap", gap: s(12) },

  itemCard: {
    backgroundColor: "#fff",
    borderRadius: s(16),
    paddingVertical: vs(18),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 1,
    borderWidth: 1, borderColor: "#ececec",
  },

  // ── NEW: icon inside a teal-tinted circle ──
  iconCircle: {
    width: s(56), height: s(56),
    borderRadius: s(28),
    backgroundColor: TEAL_LIGHT,
    alignItems: "center", justifyContent: "center",
    marginBottom: vs(10),
  },
  itemLabel: { fontSize: ms(12), fontWeight: "600", color: "#1a1a1a" },
});