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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

// Redux imports – adjust the path to match your project
import {
  useAppDispatch,
  useAppSelector,
  selectItemQuantity,
  selectCartCount,
  selectCartTotal,
} from "../src/redux/store/hooks";
import { addToCart, removeFromCart } from "../src/redux/store/cartSlice";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Responsive helpers ────────────────────────────────────────────────────────
const { width: W, height: H } = Dimensions.get("window");
const BASE_W = 375;
const BASE_H = 812;
const r = (n: number) => Math.round((W / BASE_W) * n);
const rv = (n: number) => Math.round((H / BASE_H) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  teal: "#1a7a6e",
  tealMid: "#22a090",
  tealLight: "#dff2ef",
  tealXLight: "#eef9f7",
  tealDark: "#0f5249",
  surface: "#ffffff",
  bg: "#f4f8f7",
  bgAlt: "#eaf2f0",
  ink: "#0e1c1a",
  inkMid: "#4a6360",
  inkLight: "#8aa8a4",
  border: "#dce8e6",
  borderMid: "#c4d8d5",
} as const;

const shadow = (depth: 1 | 2 | 3) => {
  const configs = {
    1: { ios: { shadowColor: "#0a3530", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 }, android: { elevation: 2 } },
    2: { ios: { shadowColor: "#0a3530", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.09, shadowRadius: 8 }, android: { elevation: 4 } },
    3: { ios: { shadowColor: "#0a3530", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.13, shadowRadius: 16 }, android: { elevation: 8 } },
  };
  return Platform.OS === "ios" ? configs[depth].ios : configs[depth].android;
};

// ─── Types ─────────────────────────────────────────────────────────────────────
type IconLib = "ion" | "mci";
type Item = { label: string; icon: string; lib: IconLib };

// Service type mapping for Redux
type ServiceMapping = {
  id: string;
  name: string;
  price: number;
};

const SERVICES: Record<string, ServiceMapping> = {
  Wash: { id: "wash", name: "Wash", price: 30 },
  Iron: { id: "iron", name: "Iron", price: 25 },
  "Wash+Iron": { id: "combo", name: "Wash+Iron", price: 50 },
};

// ─── Data (same as your desired UI) ────────────────────────────────────────────
const DATA: Record<string, { tabs: string[]; items: Record<string, Item[]> }> = {
  Men: {
    tabs: ["Upper Wear", "Lower Wear", "Garments", "Winter Wear"],
    items: {
      "Upper Wear": [
        { label: "Shirt", icon: "shirt-outline", lib: "ion" },
        { label: "T-Shirt", icon: "tshirt-crew-outline", lib: "mci" },
        { label: "Vest", icon: "tshirt-outline", lib: "mci" },
        { label: "Kurta", icon: "shirt-outline", lib: "ion" },
        { label: "Jacket", icon: "jacket", lib: "mci" },
        { label: "Hoodie", icon: "hanger", lib: "mci" },
      ],
      "Lower Wear": [
        { label: "Jeans", icon: "human-male", lib: "mci" },
        { label: "Trousers", icon: "human-male", lib: "mci" },
        { label: "Shorts", icon: "human-male", lib: "mci" },
        { label: "Pajamas", icon: "hanger", lib: "mci" },
      ],
      "Garments": [
        { label: "Suit", icon: "briefcase-outline", lib: "ion" },
        { label: "Blazer", icon: "hanger", lib: "mci" },
        { label: "Sherwani", icon: "hanger", lib: "mci" },
      ],
      "Winter Wear": [
        { label: "Sweater", icon: "hanger", lib: "mci" },
        { label: "Coat", icon: "hanger", lib: "mci" },
        { label: "Muffler", icon: "scarf", lib: "mci" },
      ],
    },
  },
  Women: {
    tabs: ["Upper Wear", "Lower Wear", "Ethnic", "Winter Wear"],
    items: {
      "Upper Wear": [
        { label: "Top", icon: "tshirt-crew-outline", lib: "mci" },
        { label: "Blouse", icon: "hanger", lib: "mci" },
        { label: "Kurti", icon: "hanger", lib: "mci" },
        { label: "Shirt", icon: "shirt-outline", lib: "ion" },
      ],
      "Lower Wear": [
        { label: "Leggings", icon: "human-female", lib: "mci" },
        { label: "Jeans", icon: "human-female", lib: "mci" },
        { label: "Skirt", icon: "human-female", lib: "mci" },
      ],
      "Ethnic": [
        { label: "Saree", icon: "hanger", lib: "mci" },
        { label: "Salwar", icon: "hanger", lib: "mci" },
        { label: "Dupatta", icon: "scarf", lib: "mci" },
      ],
      "Winter Wear": [
        { label: "Sweater", icon: "hanger", lib: "mci" },
        { label: "Jacket", icon: "jacket", lib: "mci" },
        { label: "Shawl", icon: "scarf", lib: "mci" },
      ],
    },
  },
  Children: {
    tabs: ["Upper Wear", "Lower Wear", "Uniforms", "Winter Wear"],
    items: {
      "Upper Wear": [
        { label: "T-Shirt", icon: "tshirt-crew-outline", lib: "mci" },
        { label: "Shirt", icon: "shirt-outline", lib: "ion" },
        { label: "Frock", icon: "hanger", lib: "mci" },
      ],
      "Lower Wear": [
        { label: "Shorts", icon: "human-male-boy", lib: "mci" },
        { label: "Trousers", icon: "human-male-boy", lib: "mci" },
        { label: "Skirt", icon: "human-female", lib: "mci" },
      ],
      "Uniforms": [
        { label: "School Uniform", icon: "school-outline", lib: "ion" },
        { label: "Sports Kit", icon: "football-outline", lib: "ion" },
      ],
      "Winter Wear": [
        { label: "Sweater", icon: "hanger", lib: "mci" },
        { label: "Jacket", icon: "jacket", lib: "mci" },
        { label: "Gloves", icon: "hand-left-outline", lib: "ion" },
      ],
    },
  },
  Linen: {
    tabs: ["Bedding", "Bath", "Home", "Others"],
    items: {
      "Bedding": [
        { label: "Bedsheet", icon: "bed-outline", lib: "ion" },
        { label: "Pillow Cover", icon: "pillow", lib: "mci" },
        { label: "Blanket", icon: "bed-outline", lib: "ion" },
        { label: "Duvet", icon: "bed-outline", lib: "ion" },
      ],
      "Bath": [
        { label: "Towel", icon: "hanger", lib: "mci" },
        { label: "Bath Mat", icon: "mat", lib: "mci" },
        { label: "Hand Towel", icon: "hand-left-outline", lib: "ion" },
      ],
      "Home": [
        { label: "Curtains", icon: "curtains", lib: "mci" },
        { label: "Cushion Cover", icon: "sofa-outline", lib: "mci" },
        { label: "Table Cloth", icon: "table-furniture", lib: "mci" },
      ],
      "Others": [
        { label: "Sofa Cover", icon: "sofa-outline", lib: "mci" },
        { label: "Carpet", icon: "rug", lib: "mci" },
      ],
    },
  },
};

const CATEGORY_META: Record<string, { tag: string; label: string }> = {
  Men: { tag: "👔", label: "Premium care" },
  Women: { tag: "👗", label: "Premium care" },
  Children: { tag: "🧒", label: "Gentle wash" },
  Linen: { tag: "🛏", label: "Deep clean" },
};

// ─── Icon helper ───────────────────────────────────────────────────────────────
function ClothingIcon({ icon, lib, size, color }: { icon: string; lib: IconLib; size: number; color: string }) {
  return lib === "mci"
    ? <MaterialCommunityIcons name={icon as any} size={size} color={color} />
    : <Ionicons name={icon as any} size={size} color={color} />;
}

// ─── Service Selection Modal (with Redux integration) ─────────────────────────
type ServiceModalProps = {
  visible: boolean;
  item: Item | null;
  categoryName: string;
  onClose: () => void;
};

const ServiceModal: React.FC<ServiceModalProps> = ({ visible, item, categoryName, onClose }) => {
  const dispatch = useAppDispatch();
  const [washQty, setWashQty] = useState(0);
  const [ironQty, setIronQty] = useState(0);
  const [comboQty, setComboQty] = useState(0);

  const resetQuantities = () => {
    setWashQty(0);
    setIronQty(0);
    setComboQty(0);
  };

  // Helper to dispatch multiple addToCart actions (one per piece)
  const addMultipleToCart = (serviceType: "Wash" | "Iron" | "Wash+Iron", quantity: number) => {
    const service = SERVICES[serviceType];
    if (!service) return;

    for (let i = 0; i < quantity; i++) {
      dispatch(
        addToCart({
          id: `${service.id}_${categoryName}_${item!.label}`, // unique per service + category + item
          serviceId: service.id,
          serviceName: service.name,
          categoryId: categoryName,
          categoryName: categoryName,
          subCategoryId: item!.label,
          subCategoryName: item!.label,
          price: service.price,
        })
      );
    }
  };

  const handleAddToCart = () => {
    if (!item) return;

    if (washQty > 0) addMultipleToCart("Wash", washQty);
    if (ironQty > 0) addMultipleToCart("Iron", ironQty);
    if (comboQty > 0) addMultipleToCart("Wash+Iron", comboQty);

    resetQuantities();
    onClose();
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Choose Services & Quantity</Text>
              <Text style={styles.modalSubtitle}>
                {item.label} • {categoryName}
              </Text>

              <ServiceRow
                label="Wash"
                price={SERVICES.Wash.price}
                quantity={washQty}
                onIncrement={() => setWashQty(washQty + 1)}
                onDecrement={() => washQty > 0 && setWashQty(washQty - 1)}
              />
              <ServiceRow
                label="Iron"
                price={SERVICES.Iron.price}
                quantity={ironQty}
                onIncrement={() => setIronQty(ironQty + 1)}
                onDecrement={() => ironQty > 0 && setIronQty(ironQty - 1)}
              />
              <ServiceRow
                label="Wash + Iron"
                price={SERVICES["Wash+Iron"].price}
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

// ─── ItemCard (modal trigger) ──────────────────────────────────────────────────
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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Redux selectors
  const cartCount = useAppSelector(selectCartCount);
  const cartTotal = useAppSelector(selectCartTotal);
  const insets = useSafeAreaInsets();

  const COLS = W >= 428 ? 4 : 3;
  const H_PAD = r(16);
  const GAP = r(10);
  const cardWidth = clamp(Math.floor((W - H_PAD * 2 - GAP * (COLS - 1)) / COLS), 76, 128);

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

  const viewBasket = () => {
    if (cartCount === 0) {
      alert("Your basket is empty");
      return;
    }
    // Navigate to your cart screen
    router.push("/cart");
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
          {/* Ghost cells to align last row */}
          {Array.from({ length: (COLS - (items.length % COLS)) % COLS }).map((_, i) => (
            <View key={`ghost-${i}`} style={{ width: cardWidth }} />
          ))}
        </View>
      </ScrollView>

      {/* Sticky Cart Footer (only when cart has items) */}
      {cartCount > 0 && (
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : rv(30) },
          ]}
        >
          <TouchableOpacity style={styles.ctaBtn} onPress={viewBasket} activeOpacity={0.85}>
            <View style={styles.ctaLeft}>
              <Ionicons name="cart-outline" size={r(18)} color="#fff" />
              <Text style={styles.ctaText}>{cartCount} items • Total ₹{cartTotal}</Text>
            </View>
            <View style={styles.ctaArrow}>
              <Ionicons name="arrow-forward" size={r(15)} color={C.tealMid} />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Service Modal */}
      <ServiceModal
        visible={modalVisible}
        item={selectedItem}
        categoryName={category}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
}

// ─── Styles (fully matching your desired UI) ───────────────────────────────────
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