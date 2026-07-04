import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, Platform, StatusBar, Animated, LayoutAnimation,
  UIManager, Modal, TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../src/theme/ThemeProvider";
import {
  useAppDispatch, useAppSelector,
  selectCartCount, selectCartTotal,
} from "../src/redux/store/hooks";
import { addToCart } from "../src/redux/store/cartSlice";
import AppBackground from "@/components/AppBackground";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Responsive helpers ───────────────────────────────────────
const { width: W, height: H } = Dimensions.get("window");
const r = (n: number) => Math.round((W / 375) * n);
const rv = (n: number) => Math.round((H / 812) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// ─── Design tokens ────────────────────────────────────────────
const C = {
  teal: "#1a7a6e", tealMid: "#22a090", tealLight: "#dff2ef",
  tealXLight: "#eef9f7", tealDark: "#0f5249", surface: "#ffffff",
  bg: "#f4f8f7", bgAlt: "#eaf2f0", ink: "#0e1c1a", inkMid: "#4a6360",
  inkLight: "#8aa8a4", border: "#dce8e6", borderMid: "#c4d8d5",
} as const;

const shadow = (depth: 1 | 2 | 3) => {
  const configs = {
    1: { ios: { shadowColor: "#0a3530", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 2 } },
    2: { ios: { shadowColor: "#0a3530", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 8 }, android: { elevation: 4 } },
    3: { ios: { shadowColor: "#0a3530", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.13, shadowRadius: 16 }, android: { elevation: 8 } },
  };
  return Platform.OS === "ios" ? configs[depth].ios : configs[depth].android;
};

// ─── Types ────────────────────────────────────────────────────
type IconLib = "ion" | "mci";
type Item = { key: string; label: string; icon: string; lib: IconLib };

// ─── Services ─────────────────────────────────────────────────
const SERVICES: Record<string, { id: string; name: string; price: number }> = {
  Wash: { id: "69f0746b11410d962926907f", name: "Wash", price: 30 },
  Iron: { id: "69f0746b11410d962926907d", name: "Iron", price: 25 },
  "Wash+Iron": { id: "69f0746b11410d962926907e", name: "Wash+Iron", price: 50 },
};

// ─── ClothingIcon ─────────────────────────────────────────────
function ClothingIcon({ icon, lib, size, color }: { icon: string; lib: IconLib; size: number; color: string }) {
  return lib === "mci"
    ? <MaterialCommunityIcons name={icon as any} size={size} color={color} />
    : <Ionicons name={icon as any} size={size} color={color} />;
}

// ─── ServiceRow ───────────────────────────────────────────────
type ServiceRowProps = {
  label: string; price: number; quantity: number;
  onIncrement: () => void; onDecrement: () => void; t: any; theme: any;
};
const ServiceRow: React.FC<ServiceRowProps> = ({ label, price, quantity, onIncrement, onDecrement, t, theme }) => (
  <View style={[styles.serviceRow, { borderBottomColor: theme.border }]}>
    <View style={styles.serviceInfo}>
      <Text style={[styles.serviceLabel, { color: theme.text }]}>{label}</Text>
      <Text style={[styles.servicePrice, { color: theme.subText }]}>₹{price}/{t("common.piece")}</Text>
    </View>
    {quantity === 0 ? (
      <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primaryLight }]} onPress={onIncrement}>
        <Text style={[styles.addButtonText, { color: theme.primary }]}>ADD</Text>
      </TouchableOpacity>
    ) : (
      <View style={styles.stepperRow}>
        <TouchableOpacity style={[styles.stepCircle, { backgroundColor: theme.primaryLight }]} onPress={onDecrement}>
          <Ionicons name="remove" size={r(14)} color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.stepQtyModal, { color: theme.primary }]}>{quantity}</Text>
        <TouchableOpacity style={[styles.stepCircle, { backgroundColor: theme.primaryLight }]} onPress={onIncrement}>
          <Ionicons name="add" size={r(14)} color={theme.primary} />
        </TouchableOpacity>
      </View>
    )}
  </View>
);

// ─── ServiceModal ─────────────────────────────────────────────
type ServiceModalProps = {
  visible: boolean; item: Item | null;
  categoryName: string; onClose: () => void; t: any; theme: any; isDarkMode: boolean;
};
const ServiceModal: React.FC<ServiceModalProps> = ({ visible, item, categoryName, onClose, t, theme, isDarkMode }) => {
  const dispatch = useAppDispatch();
  const [quantities, setQuantities] = useState<Record<string, number>>({ Wash: 0, Iron: 0, "Wash+Iron": 0 });

  useEffect(() => {
    if (visible) setQuantities({ Wash: 0, Iron: 0, "Wash+Iron": 0 });
  }, [visible, item]);

  const increment = (s: string) => setQuantities(p => ({ ...p, [s]: p[s] + 1 }));
  const decrement = (s: string) => setQuantities(p => ({ ...p, [s]: Math.max(0, p[s] - 1) }));

  const handleAddToCart = () => {
    if (!item) return;
    Object.entries(quantities).forEach(([serviceType, qty]) => {
      if (qty <= 0) return;
      const service = SERVICES[serviceType];
      if (!service) return;
      dispatch(addToCart({
        id: `${categoryName}_${item.key}_${service.id}`,
        serviceId: service.id,
        serviceName: service.name,
        categoryId: categoryName,
        categoryName,
        subCategoryId: item.key,
        subCategoryName: item.label,
        price: service.price,
        quantity: qty,
      }));
    });
    onClose();
  };

  const totalItems = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(quantities).reduce((sum, [k, qty]) => sum + (SERVICES[k]?.price || 0) * qty, 0);

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>{t("subcategory.choose_services")}</Text>
              <Text style={[styles.modalSubtitle, { color: theme.subText }]}>{item.label} • {categoryName}</Text>
              {(["Wash", "Iron", "Wash+Iron"] as const).map(st => (
                <ServiceRow
                  key={st} label={st} price={SERVICES[st].price}
                  quantity={quantities[st]}
                  onIncrement={() => increment(st)}
                  onDecrement={() => decrement(st)}
                  t={t}
                  theme={theme}
                />
              ))}
              {totalItems > 0 && (
                <View style={[styles.summaryRow, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.summaryText, { color: theme.primary }]}>{totalItems} items • ₹{totalPrice}</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.modalAddBtn, { backgroundColor: totalItems > 0 ? theme.primary : theme.border }]}
                onPress={handleAddToCart}
                disabled={totalItems === 0}
              >
                <Text style={styles.modalAddBtnText}>
                  {totalItems > 0 ? `${t("common.add_to_cart")} • ₹${totalPrice}` : t("subcategory.select_one")}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// ─── ItemCard ─────────────────────────────────────────────────
type ItemCardProps = { item: Item; cardWidth: number; onPress: (item: Item) => void; t: any; theme: any };
const ItemCard: React.FC<ItemCardProps> = ({ item, cardWidth, onPress, t, theme }) => {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => Animated.spring(pressAnim, { toValue: 0.92, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const onPressOut = () => Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 6 }).start();

  return (
    <Animated.View style={{ width: cardWidth, transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => onPress(item)}
        style={[styles.card, { width: cardWidth, height: cardWidth, backgroundColor: theme.primaryLight, borderColor: theme.border }]}  // perfect square
      >
        {/* Icon container — fills most of the card */}
        <View style={[styles.iconWrap, { backgroundColor: theme.card }]}>
          <ClothingIcon icon={item.icon} lib={item.lib} size={r(32)} color={theme.primary} />
        </View>

        {/* Label */}
        <Text style={[styles.cardLabel, { color: theme.text }]} numberOfLines={1}>{item.label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: r(16), paddingTop: rv(6), paddingBottom: rv(12), gap: r(10) },
  backBtn: { width: r(38), height: r(38), borderRadius: r(19), backgroundColor: C.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border, ...shadow(1) },
  headerText: { flex: 1 },
  eyebrow: { fontSize: rm(10), fontWeight: "600", color: C.inkLight, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: rv(2) },
  titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: r(8) },
  title: { fontSize: rm(24), fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
  tagPill: { backgroundColor: C.tealLight, borderRadius: r(20), paddingHorizontal: r(10), paddingVertical: rv(3) },
  tagText: { fontSize: rm(10.5), fontWeight: "600", color: C.tealDark },
  infoBtn: { width: r(38), height: r(38), borderRadius: r(19), backgroundColor: C.tealXLight, alignItems: "center", justifyContent: "center" },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: r(16), paddingTop: rv(14), paddingBottom: rv(10) },
  sectionTitle: { fontSize: rm(15), fontWeight: "700", color: C.ink, letterSpacing: -0.2 },
  sectionCount: { fontSize: rm(12), fontWeight: "500", color: C.inkLight },
  gridContent: { paddingBottom: rv(110) },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
  card: {
    backgroundColor: C.tealXLight,
    borderRadius: r(16),
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: rv(10),
    borderWidth: 1.5,
    borderColor: C.tealLight,
    ...shadow(1),
  },
  iconWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    backgroundColor: C.tealLight,
    borderRadius: r(14),
    marginBottom: rv(6),
  },
  cardLabel: {
    fontSize: rm(11),
    fontWeight: "700",
    color: C.tealDark,
    textAlign: "center",
    paddingHorizontal: r(4),
  },
  addRow: { flexDirection: "row", alignItems: "center", gap: r(4) },
  addText: { fontSize: rm(10.5), fontWeight: "600", color: C.inkLight },
  addIcon: { width: r(18), height: r(18), borderRadius: r(9), backgroundColor: C.tealLight, alignItems: "center", justifyContent: "center" },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: r(16), paddingTop: rv(10), backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.border },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.teal, borderRadius: r(16), paddingVertical: rv(15), paddingHorizontal: r(22), ...shadow(3) },
  ctaLeft: { flexDirection: "row", alignItems: "center", gap: r(8) },
  ctaText: { fontSize: rm(15), fontWeight: "700", color: "#fff", letterSpacing: 0.1 },
  ctaArrow: { width: r(28), height: r(28), borderRadius: r(14), backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: r(24), borderTopRightRadius: r(24), paddingHorizontal: r(20), paddingBottom: rv(34), paddingTop: rv(12), ...shadow(3) },
  modalHandle: { width: r(40), height: r(4), backgroundColor: C.borderMid, borderRadius: r(2), alignSelf: "center", marginBottom: rv(16) },
  modalTitle: { fontSize: rm(18), fontWeight: "700", color: C.ink, marginBottom: rv(4) },
  modalSubtitle: { fontSize: rm(13), color: C.inkLight, marginBottom: rv(20) },
  serviceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: rv(14), borderBottomWidth: 1, borderBottomColor: C.border },
  serviceInfo: { flexDirection: "column" },
  serviceLabel: { fontSize: rm(14), fontWeight: "600", color: C.ink, marginBottom: rv(2) },
  servicePrice: { fontSize: rm(12), color: C.inkLight },
  addButton: { backgroundColor: C.tealLight, paddingHorizontal: r(16), paddingVertical: rv(6), borderRadius: r(20) },
  addButtonText: { fontSize: rm(12), fontWeight: "700", color: C.tealDark },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: r(12) },
  stepCircle: { width: r(28), height: r(28), borderRadius: r(14), backgroundColor: C.tealLight, alignItems: "center", justifyContent: "center" },
  stepQtyModal: { fontSize: rm(14), fontWeight: "700", color: C.teal, minWidth: r(20), textAlign: "center" },
  modalAddBtn: { backgroundColor: C.teal, borderRadius: r(16), paddingVertical: rv(14), alignItems: "center", marginTop: rv(20) },
  modalAddBtnText: { fontSize: rm(16), fontWeight: "700", color: "#fff" },
  summaryRow: { backgroundColor: C.tealXLight, borderRadius: r(10), padding: r(10), marginTop: rv(12), alignItems: "center" },


  summaryText: { fontSize: rm(13), fontWeight: "600", color: C.tealDark },

  tabsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: r(16),
    paddingTop: rv(8),
    paddingBottom: rv(4),
    gap: r(8),
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(5),
    paddingHorizontal: r(14),
    paddingVertical: rv(8),
    borderRadius: r(20),
    backgroundColor: C.bgAlt,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  tabActive: {
    backgroundColor: C.tealLight,
    borderColor: C.teal,
  },
  tabLabel: {
    fontSize: rm(12.5),
    fontWeight: "600",
    color: C.inkLight,
  },
  tabLabelActive: {
    color: C.teal,
  },
  tabBubble: {
    backgroundColor: C.teal,
    borderRadius: r(10),
    minWidth: r(18),
    height: r(18),
    paddingHorizontal: r(4),
    alignItems: "center",
    justifyContent: "center",
  },
  tabBubbleText: {
    fontSize: rm(9.5),
    fontWeight: "700",
    color: "#fff",
  },
});

// ─── MAIN SCREEN (single export default) ─────────────────────
export default function SubcategoryScreen() {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();

  const DATA: Record<string, { tabs: string[]; tabKeys: string[]; items: Record<string, Item[]> }> = {
    Men: {
      tabKeys: ["Upper Wear", "Lower Wear", "Garments", "Winter Wear"],
      tabs: [t("tabs_sub.upper_wear"), t("tabs_sub.lower_wear"), t("tabs_sub.garments"), t("tabs_sub.winter_wear")],
      items: {
        "Upper Wear": [
          { key: "shirt", label: t("items.shirt"), icon: "shirt-outline", lib: "ion" },
          { key: "tshirt", label: t("items.tshirt"), icon: "tshirt-crew-outline", lib: "mci" },
          { key: "vest", label: t("items.vest"), icon: "tshirt-outline", lib: "mci" },
          { key: "kurta", label: t("items.kurta"), icon: "shirt-outline", lib: "ion" },
          { key: "jacket", label: t("items.jacket"), icon: "jacket", lib: "mci" },
          { key: "hoodie", label: t("items.hoodie"), icon: "hanger", lib: "mci" },
        ],
        "Lower Wear": [
          { key: "jeans", label: t("items.jeans"), icon: "human-male", lib: "mci" },
          { key: "trousers", label: t("items.trousers"), icon: "human-male", lib: "mci" },
          { key: "shorts", label: t("items.shorts"), icon: "human-male", lib: "mci" },
          { key: "pajamas", label: t("items.pajamas"), icon: "hanger", lib: "mci" },
        ],
        "Garments": [
          { key: "suit", label: t("items.suit"), icon: "briefcase-outline", lib: "ion" },
          { key: "blazer", label: t("items.blazer"), icon: "hanger", lib: "mci" },
          { key: "sherwani", label: t("items.sherwani"), icon: "hanger", lib: "mci" },
        ],
        "Winter Wear": [
          { key: "sweater", label: t("items.sweater"), icon: "hanger", lib: "mci" },
          { key: "coat", label: t("items.coat"), icon: "hanger", lib: "mci" },
          { key: "muffler", label: t("items.muffler"), icon: "scarf", lib: "mci" },
        ],
      },
    },
    Women: {
      tabKeys: ["Upper Wear", "Lower Wear", "Ethnic", "Winter Wear"],
      tabs: [t("tabs_sub.upper_wear"), t("tabs_sub.lower_wear"), t("tabs_sub.ethnic"), t("tabs_sub.winter_wear")],
      items: {
        "Upper Wear": [
          { key: "top", label: t("items.top"), icon: "tshirt-crew-outline", lib: "mci" },
          { key: "blouse", label: t("items.blouse"), icon: "hanger", lib: "mci" },
          { key: "kurti", label: t("items.kurti"), icon: "hanger", lib: "mci" },
          { key: "shirt", label: t("items.shirt"), icon: "shirt-outline", lib: "ion" },
        ],
        "Lower Wear": [
          { key: "leggings", label: t("items.leggings"), icon: "human-female", lib: "mci" },
          { key: "jeans", label: t("items.jeans"), icon: "human-female", lib: "mci" },
          { key: "skirt", label: t("items.skirt"), icon: "human-female", lib: "mci" },
        ],
        "Ethnic": [
          { key: "saree", label: t("items.saree"), icon: "hanger", lib: "mci" },
          { key: "salwar", label: t("items.salwar"), icon: "hanger", lib: "mci" },
          { key: "dupatta", label: t("items.dupatta"), icon: "scarf", lib: "mci" },
        ],
        "Winter Wear": [
          { key: "sweater", label: t("items.sweater"), icon: "hanger", lib: "mci" },
          { key: "jacket", label: t("items.jacket"), icon: "jacket", lib: "mci" },
          { key: "shawl", label: t("items.shawl"), icon: "scarf", lib: "mci" },
        ],
      },
    },
    Children: {
      tabKeys: ["Upper Wear", "Lower Wear", "Uniforms", "Winter Wear"],
      tabs: [t("tabs_sub.upper_wear"), t("tabs_sub.lower_wear"), t("tabs_sub.uniforms"), t("tabs_sub.winter_wear")],
      items: {
        "Upper Wear": [
          { key: "tshirt", label: t("items.tshirt"), icon: "tshirt-crew-outline", lib: "mci" },
          { key: "shirt", label: t("items.shirt"), icon: "shirt-outline", lib: "ion" },
          { key: "frock", label: t("items.frock"), icon: "hanger", lib: "mci" },
        ],
        "Lower Wear": [
          { key: "shorts", label: t("items.shorts"), icon: "human-male-boy", lib: "mci" },
          { key: "trousers", label: t("items.trousers"), icon: "human-male-boy", lib: "mci" },
          { key: "skirt", label: t("items.skirt"), icon: "human-female", lib: "mci" },
        ],
        "Uniforms": [
          { key: "school_uniform", label: t("items.school_uniform"), icon: "school-outline", lib: "ion" },
          { key: "sports_kit", label: t("items.sports_kit"), icon: "football-outline", lib: "ion" },
        ],
        "Winter Wear": [
          { key: "sweater", label: t("items.sweater"), icon: "hanger", lib: "mci" },
          { key: "jacket", label: t("items.jacket"), icon: "jacket", lib: "mci" },
          { key: "gloves", label: t("items.gloves"), icon: "hand-left-outline", lib: "ion" },
        ],
      },
    },
    Linen: {
      tabKeys: ["Bedding", "Bath", "Home", "Others"],
      tabs: [t("tabs_sub.bedding"), t("tabs_sub.bath"), t("tabs_sub.home"), t("tabs_sub.others")],
      items: {
        "Bedding": [
          { key: "bedsheet", label: t("items.bedsheet"), icon: "bed-outline", lib: "ion" },
          { key: "pillow_cover", label: t("items.pillow_cover"), icon: "bed-outline", lib: "ion" },
          { key: "blanket", label: t("items.blanket"), icon: "bed-outline", lib: "ion" },
          { key: "duvet", label: t("items.duvet"), icon: "bed-outline", lib: "ion" },
        ],
        "Bath": [
          { key: "towel", label: t("items.towel"), icon: "hanger", lib: "mci" },
          { key: "bath_mat", label: t("items.bath_mat"), icon: "mat", lib: "mci" },
          { key: "hand_towel", label: t("items.hand_towel"), icon: "hand-left-outline", lib: "ion" },
        ],
        "Home": [
          { key: "curtains", label: t("items.curtains"), icon: "curtains", lib: "mci" },
          { key: "cushion_cover", label: t("items.cushion_cover"), icon: "sofa-outline", lib: "mci" },
          { key: "table_cloth", label: t("items.table_cloth"), icon: "table-furniture", lib: "mci" },
        ],
        "Others": [
          { key: "sofa_cover", label: t("items.sofa_cover"), icon: "sofa-outline", lib: "mci" },
          { key: "carpet", label: t("items.carpet"), icon: "rug", lib: "mci" },
        ],
      },
    },
  };

  const CATEGORY_META: Record<string, { tag: string; label: string }> = {
    Men: { tag: "👔", label: t("meta.premium_care") },
    Women: { tag: "👗", label: t("meta.premium_care") },
    Children: { tag: "🧒", label: t("meta.gentle_wash") },
    Linen: { tag: "🛏", label: t("meta.deep_clean") },
  };

  const params = useLocalSearchParams<{ category: string }>();
  const category = params.category ?? "Men";
  const data = DATA[category] ?? DATA["Men"];
  const meta = CATEGORY_META[category] ?? CATEGORY_META["Men"];

  const [activeTabKey, setActiveTabKey] = useState(data.tabKeys[0]);
  const items = data.items[activeTabKey] ?? [];
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const cartCount = useAppSelector(selectCartCount);
  const cartTotal = useAppSelector(selectCartTotal);
  const insets = useSafeAreaInsets();

  const COLS = W >= 428 ? 4 : 3;
  const H_PAD = r(16);
  const GAP = r(10);
  const cardWidth = clamp(Math.floor((W - H_PAD * 2 - GAP * (COLS - 1)) / COLS), 76, 128);

  const switchTab = useCallback((key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTabKey(key);
  }, []);

  const openModal = (item: Item) => { setSelectedItem(item); setModalVisible(true); };
  const closeModal = () => { setModalVisible(false); setSelectedItem(null); };
  const viewBasket = () => {
    if (cartCount === 0) { alert("Your basket is empty"); return; }
    router.push("/cart");
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={["top", "left", "right"]}>
      <AppBackground>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={r(20)} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.eyebrow, { color: theme.subText }]}>{t("subcategory.laundry_service")}</Text>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.text }]}>{category}</Text>
              <View style={[styles.tagPill, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.tagText, { color: theme.primary }]}>{meta.tag}  {meta.label}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={[styles.infoBtn, { backgroundColor: theme.primaryLight }]} activeOpacity={0.75}>
            <Ionicons name="information-circle-outline" size={r(21)} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View>
          <View style={styles.tabsContainer}>
            {data.tabKeys.map((key, idx) => {
              const active = key === activeTabKey;
              const count = data.items[key]?.length ?? 0;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => switchTab(key)}
                  activeOpacity={0.75}
                  style={[
                    styles.tab,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    active && { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                  ]}
                >
                  <Text style={[styles.tabLabel, { color: theme.subText }, active && { color: theme.primary }]}>
                    {data.tabs[idx]}
                  </Text>
                  {active && (
                    <View style={[styles.tabBubble, { backgroundColor: theme.primary }]}>
                      <Text style={styles.tabBubbleText}>{count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section heading */}
        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{data.tabs[data.tabKeys.indexOf(activeTabKey)]}</Text>
          <Text style={[styles.sectionCount, { color: theme.subText }]}>{items.length} {t("common.items")}</Text>
        </View>

        {/* Grid */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.gridContent, { paddingHorizontal: H_PAD }]}>
          <View style={[styles.grid, { gap: GAP }]}>
            {items.map((item, idx) => (
              <ItemCard key={`${activeTabKey}-${idx}`} item={item} cardWidth={cardWidth} onPress={openModal} t={t} theme={theme} />
            ))}
            {Array.from({ length: (COLS - (items.length % COLS)) % COLS }).map((_, i) => (
              <View key={`ghost-${i}`} style={{ width: cardWidth }} />
            ))}
          </View>
        </ScrollView>

        {/* Cart Footer */}
        {cartCount > 0 && (
          <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : rv(30) }]}>
            <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: theme.primary }]} onPress={viewBasket} activeOpacity={0.85}>
              <View style={styles.ctaLeft}>
                <Ionicons name="cart-outline" size={r(18)} color="#fff" />
                <Text style={styles.ctaText}>{cartCount} {t("common.items")} • {t("common.total")} ₹{cartTotal}</Text>
              </View>
              <View style={styles.ctaArrow}>
                <Ionicons name="arrow-forward" size={r(15)} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        <ServiceModal visible={modalVisible} item={selectedItem} categoryName={category} onClose={closeModal} t={t} theme={theme} isDarkMode={isDarkMode} />
      </AppBackground>
    </SafeAreaView>
  );
}