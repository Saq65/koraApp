import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  StatusBar,
  Animated,
  LayoutAnimation,
  UIManager,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Responsive helpers ────────────────────────────────────────────────────────
const { width: W, height: H } = Dimensions.get("window");
const BASE_W = 375;
const BASE_H = 812;
const r   = (n: number) => Math.round((W / BASE_W) * n);
const rv  = (n: number) => Math.round((H / BASE_H) * n);
const rm  = (n: number, f = 0.45) => n + (r(n) - n) * f;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  teal:       "#1a7a6e",
  tealMid:    "#22a090",
  tealLight:  "#dff2ef",
  tealXLight: "#eef9f7",
  tealDark:   "#0f5249",
  surface:    "#ffffff",
  bg:         "#f4f8f7",
  bgAlt:      "#eaf2f0",
  ink:        "#0e1c1a",
  inkMid:     "#4a6360",
  inkLight:   "#8aa8a4",
  border:     "#dce8e6",
  borderMid:  "#c4d8d5",
} as const;

const shadow = (depth: 1 | 2 | 3) => {
  const configs = {
    1: { ios: { shadowColor: "#0a3530", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4  }, android: { elevation: 2 } },
    2: { ios: { shadowColor: "#0a3530", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 8  }, android: { elevation: 4 } },
    3: { ios: { shadowColor: "#0a3530", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.13, shadowRadius: 16 }, android: { elevation: 8 } },
  };
  return Platform.OS === "ios" ? configs[depth].ios : configs[depth].android;
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type IconLib = "ion" | "mci";
type Item    = { label: string; icon: string; lib: IconLib };

// Cart item structure
type CartItem = {
  id: string; // unique identifier
  itemName: string;
  category: string; // e.g., "Men", "Women"
  service: "Wash" | "Iron" | "Wash+Iron";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

// ─── Data ──────────────────────────────────────────────────────────────────────
const DATA: Record<string, { tabs: string[]; items: Record<string, Item[]> }> = {
  Men: {
    tabs: ["Upper Wear", "Lower Wear", "Garments", "Winter Wear"],
    items: {
      "Upper Wear": [
        { label: "Shirt",   icon: "shirt-outline",       lib: "ion" },
        { label: "T-Shirt", icon: "tshirt-crew-outline", lib: "mci" },
        { label: "Vest",    icon: "tshirt-outline",      lib: "mci" },
        { label: "Kurta",   icon: "shirt-outline",       lib: "ion" },
        { label: "Jacket",  icon: "jacket",              lib: "mci" },
        { label: "Hoodie",  icon: "hanger",              lib: "mci" },
      ],
      "Lower Wear": [
        { label: "Jeans",    icon: "human-male", lib: "mci" },
        { label: "Trousers", icon: "human-male", lib: "mci" },
        { label: "Shorts",   icon: "human-male", lib: "mci" },
        { label: "Pajamas",  icon: "hanger",     lib: "mci" },
      ],
      "Garments": [
        { label: "Suit",     icon: "briefcase-outline", lib: "ion" },
        { label: "Blazer",   icon: "hanger",            lib: "mci" },
        { label: "Sherwani", icon: "hanger",            lib: "mci" },
      ],
      "Winter Wear": [
        { label: "Sweater", icon: "hanger", lib: "mci" },
        { label: "Coat",    icon: "hanger", lib: "mci" },
        { label: "Muffler", icon: "scarf",  lib: "mci" },
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
        { label: "Shorts",   icon: "human-male-boy", lib: "mci" },
        { label: "Trousers", icon: "human-male-boy", lib: "mci" },
        { label: "Skirt",    icon: "human-female",   lib: "mci" },
      ],
      "Uniforms": [
        { label: "School Uniform", icon: "school-outline",   lib: "ion" },
        { label: "Sports Kit",     icon: "football-outline", lib: "ion" },
      ],
      "Winter Wear": [
        { label: "Sweater", icon: "hanger",            lib: "mci" },
        { label: "Jacket",  icon: "jacket",            lib: "mci" },
        { label: "Gloves",  icon: "hand-left-outline", lib: "ion" },
      ],
    },
  },
  Linen: {
    tabs: ["Bedding", "Bath", "Home", "Others"],
    items: {
      "Bedding": [
        { label: "Bedsheet",     icon: "bed-outline", lib: "ion" },
        { label: "Pillow Cover", icon: "pillow",      lib: "mci" },
        { label: "Blanket",      icon: "bed-outline", lib: "ion" },
        { label: "Duvet",        icon: "bed-outline", lib: "ion" },
      ],
      "Bath": [
        { label: "Towel",      icon: "hanger",            lib: "mci" },
        { label: "Bath Mat",   icon: "mat",               lib: "mci" },
        { label: "Hand Towel", icon: "hand-left-outline", lib: "ion" },
      ],
      "Home": [
        { label: "Curtains",      icon: "curtains",        lib: "mci" },
        { label: "Cushion Cover", icon: "sofa-outline",    lib: "mci" },
        { label: "Table Cloth",   icon: "table-furniture", lib: "mci" },
      ],
      "Others": [
        { label: "Sofa Cover", icon: "sofa-outline", lib: "mci" },
        { label: "Carpet",     icon: "rug",          lib: "mci" },
      ],
    },
  },
};

const CATEGORY_META: Record<string, { tag: string; label: string }> = {
  Men:      { tag: "👔", label: "Premium care" },
  Women:    { tag: "👗", label: "Premium care" },
  Children: { tag: "🧒", label: "Gentle wash"  },
  Linen:    { tag: "🛏", label: "Deep clean"   },
};

// ─── Icon helper ───────────────────────────────────────────────────────────────
function ClothingIcon({ icon, lib, size, color }: {
  icon: string; lib: IconLib; size: number; color: string;
}) {
  return lib === "mci"
    ? <MaterialCommunityIcons name={icon as any} size={size} color={color} />
    : <Ionicons name={icon as any} size={size} color={color} />;
}

// ─── Service Selection Modal ───────────────────────────────────────────────────
type ServiceModalProps = {
  visible: boolean;
  item: Item | null;
  categoryName: string;
  onClose: () => void;
  onAddToCart: (entries: { service: CartItem["service"]; qty: number; price: number }[]) => void;
};

const ServiceModal: React.FC<ServiceModalProps> = ({ visible, item, categoryName, onClose, onAddToCart }) => {
  const [washQty, setWashQty] = useState(0);
  const [ironQty, setIronQty] = useState(0);
  const [comboQty, setComboQty] = useState(0);

  const WASH_PRICE = 30;
  const IRON_PRICE = 25;
  const COMBO_PRICE = 50;

  const resetQuantities = () => {
    setWashQty(0);
    setIronQty(0);
    setComboQty(0);
  };

  const handleAddToCart = () => {
    const entries = [];
    if (washQty > 0) entries.push({ service: "Wash" as const, qty: washQty, price: WASH_PRICE });
    if (ironQty > 0) entries.push({ service: "Iron" as const, qty: ironQty, price: IRON_PRICE });
    if (comboQty > 0) entries.push({ service: "Wash+Iron" as const, qty: comboQty, price: COMBO_PRICE });
    if (entries.length === 0) return;
    onAddToCart(entries);
    resetQuantities();
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Choose Services & Quantity</Text>
              <Text style={styles.modalSubtitle}>
                {item.label} • {categoryName}
              </Text>

              {/* Wash Row */}
              <ServiceRow
                label="Wash"
                price={WASH_PRICE}
                quantity={washQty}
                onIncrement={() => setWashQty(washQty + 1)}
                onDecrement={() => washQty > 0 && setWashQty(washQty - 1)}
              />
              {/* Iron Row */}
              <ServiceRow
                label="Iron"
                price={IRON_PRICE}
                quantity={ironQty}
                onIncrement={() => setIronQty(ironQty + 1)}
                onDecrement={() => ironQty > 0 && setIronQty(ironQty - 1)}
              />
              {/* Wash+Iron Row */}
              <ServiceRow
                label="Wash + Iron"
                price={COMBO_PRICE}
                quantity={comboQty}
                onIncrement={() => setComboQty(comboQty + 1)}
                onDecrement={() => comboQty > 0 && setComboQty(comboQty - 1)}
              />

              <TouchableOpacity style={styles.modalAddBtn} onPress={handleAddToCart}>
                <Text style={styles.modalAddBtnText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

type ServiceRowProps = {
  label: string;
  price: number;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
};

const ServiceRow: React.FC<ServiceRowProps> = ({ label, price, quantity, onIncrement, onDecrement }) => {
  return (
    <View style={styles.serviceRow}>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceLabel}>{label}</Text>
        <Text style={styles.servicePrice}>₹{price}/piece</Text>
      </View>
      {quantity === 0 ? (
        <TouchableOpacity style={styles.addButton} onPress={onIncrement}>
          <Text style={styles.addButtonText}>ADD</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.stepperRow}>
          <TouchableOpacity style={styles.stepCircle} onPress={onDecrement}>
            <Ionicons name="remove" size={r(14)} color={C.teal} />
          </TouchableOpacity>
          <Text style={styles.stepQtyModal}>{quantity}</Text>
          <TouchableOpacity style={styles.stepCircle} onPress={onIncrement}>
            <Ionicons name="add" size={r(14)} color={C.teal} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ─── ItemCard (now only opens modal) ──────────────────────────────────────────
type ItemCardProps = {
  item: Item;
  cardWidth: number;
  onPress: (item: Item) => void;
};

const ItemCard: React.FC<ItemCardProps> = ({ item, cardWidth, onPress }) => {
  const pressAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(pressAnim, { toValue: 0.93, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  const onPressOut = () =>
    Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 6 }).start();

  return (
    <Animated.View style={{ width: cardWidth, transform: [{ scale: pressAnim }] }}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={() => onPress(item)}
        style={styles.card}
      >
        <View style={styles.iconWrap}>
          <ClothingIcon icon={item.icon} lib={item.lib} size={r(26)} color={C.inkMid} />
        </View>
        <Text style={styles.cardLabel} numberOfLines={2}>
          {item.label}
        </Text>
        <View style={styles.addRow}>
          <Text style={styles.addText}>Select</Text>
          <View style={styles.addIcon}>
            <Ionicons name="arrow-forward" size={r(12)} color={C.teal} />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SubcategoryScreen() {
  const params = useLocalSearchParams<{ category: string }>();
  const category = params.category ?? "Men";
  const data = DATA[category] ?? DATA["Men"];
  const meta = CATEGORY_META[category] ?? CATEGORY_META["Men"];

  const [activeTab, setActiveTab] = useState(data.tabs[0]);
  const items = data.items[activeTab] ?? [];

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const COLS = W >= 428 ? 4 : 3;
  const H_PAD = r(16);
  const GAP = r(10);
  const cardWidth = clamp(
    Math.floor((W - H_PAD * 2 - GAP * (COLS - 1)) / COLS),
    76, 128
  );

  const switchTab = useCallback((tab: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  }, []);

  const openModal = (item: Item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const addToCart = (serviceEntries: { service: CartItem["service"]; qty: number; price: number }[]) => {
    const newItems: CartItem[] = serviceEntries.map((entry, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random()}`,
      itemName: selectedItem!.label,
      category,
      service: entry.service,
      quantity: entry.qty,
      unitPrice: entry.price,
      totalPrice: entry.qty * entry.price,
    }));
    setCartItems((prev) => [...prev, ...newItems]);
  };

  // Compute totals
  const totalItems = cartItems.reduce((sum, ci) => sum + ci.quantity, 0);
  const totalPrice = cartItems.reduce((sum, ci) => sum + ci.totalPrice, 0);

  const viewBasket = () => {
    // For demonstration: show an alert with cart summary. Replace with navigation to cart screen.
    if (cartItems.length === 0) {
      alert("Your basket is empty");
      return;
    }
    const summary = cartItems.map(ci => `${ci.itemName} (${ci.service}): ${ci.quantity} x ₹${ci.unitPrice}`).join("\n");
    alert(`Basket:\n${summary}\n\nTotal: ${totalItems} items • ₹${totalPrice}`);
    // In a real app: router.push("/cart");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={r(20)} color={C.ink} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>Laundry Service</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{category}</Text>
            <View style={styles.tagPill}>
              <Text style={styles.tagText}>{meta.tag}  {meta.label}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.infoBtn} activeOpacity={0.75}>
          <Ionicons name="information-circle-outline" size={r(21)} color={C.teal} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {data.tabs.map((tab) => {
            const active = tab === activeTab;
            const count = data.items[tab]?.length ?? 0;
            return (
              <TouchableOpacity key={tab} onPress={() => switchTab(tab)} activeOpacity={0.75} style={[styles.tab, active && styles.tabActive]}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab}</Text>
                {active && (
                  <View style={styles.tabBubble}>
                    <Text style={styles.tabBubbleText}>{count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.tabLine} />
      </View>

      {/* Section heading */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>{activeTab}</Text>
        <Text style={styles.sectionCount}>{items.length} items</Text>
      </View>

      {/* Grid */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.gridContent, { paddingHorizontal: H_PAD }]}>
        <View style={[styles.grid, { gap: GAP }]}>
          {items.map((item, idx) => (
            <ItemCard key={`${activeTab}-${idx}`} item={item} cardWidth={cardWidth} onPress={openModal} />
          ))}
          {/* Ghost cells */}
          {Array.from({ length: (COLS - (items.length % COLS)) % COLS }).map((_, i) => (
            <View key={`ghost-${i}`} style={{ width: cardWidth }} />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.ctaBtn} onPress={viewBasket} activeOpacity={0.85}>
          <View style={styles.ctaLeft}>
            <Ionicons name="cart-outline" size={r(18)} color="#fff" />
            <Text style={styles.ctaText}>{totalItems} items • Total ₹{totalPrice}</Text>
          </View>
          <View style={styles.ctaArrow}>
            <Ionicons name="arrow-forward" size={r(15)} color={C.tealMid} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Service Modal */}
      <ServiceModal
        visible={modalVisible}
        item={selectedItem}
        categoryName={category}
        onClose={closeModal}
        onAddToCart={addToCart}
      />
    </SafeAreaView>
  );
}

// ─── Styles (keep existing + add new modal styles) ────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: r(16),
    paddingTop: rv(6),
    paddingBottom: rv(12),
    gap: r(10),
  },
  backBtn: {
    width: r(38), height: r(38),
    borderRadius: r(19),
    backgroundColor: C.surface,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: C.border,
    ...shadow(1),
  },
  headerText: { flex: 1 },
  eyebrow: {
    fontSize: rm(10),
    fontWeight: "600",
    color: C.inkLight,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: rv(2),
  },
  titleRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: r(8) },
  title: { fontSize: rm(24), fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
  tagPill: {
    backgroundColor: C.tealLight,
    borderRadius: r(20),
    paddingHorizontal: r(10),
    paddingVertical: rv(3),
  },
  tagText: { fontSize: rm(10.5), fontWeight: "600", color: C.tealDark },
  infoBtn: {
    width: r(38), height: r(38),
    borderRadius: r(19),
    backgroundColor: C.tealXLight,
    alignItems: "center", justifyContent: "center",
  },

  tabsScroll: {
    paddingHorizontal: r(16),
    paddingTop: rv(2),
    flexDirection: "row",
    gap: 0,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(5),
    paddingHorizontal: r(14),
    paddingVertical: rv(10),
    borderBottomWidth: 2.5,
    borderBottomColor: "transparent",
    marginBottom: -1,
  },
  tabActive: { borderBottomColor: C.teal },
  tabLabel: { fontSize: rm(12.5), fontWeight: "600", color: C.inkLight },
  tabLabelActive: { color: C.teal },
  tabBubble: {
    backgroundColor: C.tealLight,
    borderRadius: r(10),
    minWidth: r(18), height: r(18),
    paddingHorizontal: r(4),
    alignItems: "center", justifyContent: "center",
  },
  tabBubbleText: { fontSize: rm(9.5), fontWeight: "700", color: C.tealDark },
  tabLine: { height: 1.5, backgroundColor: C.border, marginHorizontal: r(16), marginBottom: rv(2) },

  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: r(16),
    paddingTop: rv(14),
    paddingBottom: rv(10),
  },
  sectionTitle: { fontSize: rm(15), fontWeight: "700", color: C.ink, letterSpacing: -0.2 },
  sectionCount: { fontSize: rm(12), fontWeight: "500", color: C.inkLight },

  gridContent: { paddingBottom: rv(110) },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },

  card: {
    backgroundColor: C.surface,
    borderRadius: r(18),
    paddingTop: rv(16),
    paddingBottom: rv(14),
    paddingHorizontal: r(6),
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: C.border,
    ...shadow(1),
  },
  iconWrap: {
    width: r(50), height: r(50),
    borderRadius: r(25),
    backgroundColor: C.bgAlt,
    alignItems: "center", justifyContent: "center",
    marginBottom: rv(9),
    borderWidth: 1.5, borderColor: C.border,
  },
  cardLabel: {
    fontSize: rm(11),
    fontWeight: "600",
    color: C.inkMid,
    textAlign: "center",
    lineHeight: rm(14.5),
    paddingHorizontal: r(2),
    marginBottom: rv(8),
  },
  addRow: { flexDirection: "row", alignItems: "center", gap: r(4) },
  addText: { fontSize: rm(10.5), fontWeight: "600", color: C.inkLight },
  addIcon: {
    width: r(18), height: r(18),
    borderRadius: r(9),
    backgroundColor: C.tealLight,
    alignItems: "center", justifyContent: "center",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: r(16),
    paddingBottom: rv(30),
    paddingTop: rv(10),
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.teal,
    borderRadius: r(16),
    paddingVertical: rv(15),
    paddingHorizontal: r(22),
    ...shadow(3),
  },
  ctaLeft: { flexDirection: "row", alignItems: "center", gap: r(8) },
  ctaText: { fontSize: rm(15), fontWeight: "700", color: "#fff", letterSpacing: 0.1 },
  ctaArrow: {
    width: r(28), height: r(28),
    borderRadius: r(14),
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center", justifyContent: "center",
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: r(24),
    borderTopRightRadius: r(24),
    paddingHorizontal: r(20),
    paddingBottom: rv(34),
    paddingTop: rv(12),
    ...shadow(3),
  },
  modalHandle: {
    width: r(40),
    height: r(4),
    backgroundColor: C.borderMid,
    borderRadius: r(2),
    alignSelf: "center",
    marginBottom: rv(16),
  },
  modalTitle: {
    fontSize: rm(18),
    fontWeight: "700",
    color: C.ink,
    marginBottom: rv(4),
  },
  modalSubtitle: {
    fontSize: rm(13),
    color: C.inkLight,
    marginBottom: rv(20),
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: rv(14),
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  serviceInfo: {
    flexDirection: "column",
  },
  serviceLabel: {
    fontSize: rm(14),
    fontWeight: "600",
    color: C.ink,
    marginBottom: rv(2),
  },
  servicePrice: {
    fontSize: rm(12),
    color: C.inkLight,
  },
  addButton: {
    backgroundColor: C.tealLight,
    paddingHorizontal: r(16),
    paddingVertical: rv(6),
    borderRadius: r(20),
  },
  addButtonText: {
    fontSize: rm(12),
    fontWeight: "700",
    color: C.tealDark,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(12),
  },
  stepCircle: {
    width: r(28),
    height: r(28),
    borderRadius: r(14),
    backgroundColor: C.tealLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepQtyModal: {
    fontSize: rm(14),
    fontWeight: "700",
    color: C.teal,
    minWidth: r(20),
    textAlign: "center",
  },
  modalAddBtn: {
    backgroundColor: C.teal,
    borderRadius: r(16),
    paddingVertical: rv(14),
    alignItems: "center",
    marginTop: rv(20),
  },
  modalAddBtnText: {
    fontSize: rm(16),
    fontWeight: "700",
    color: "#fff",
  },
});