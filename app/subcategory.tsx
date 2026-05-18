import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { router } from "expo-router"; 
import {
  useAppDispatch,
  useAppSelector,
  selectItemQuantity,
  selectCartCount,
  selectCartTotal,
} from "../src/redux/store/hooks";  
import { addToCart, removeFromCart } from "../src/redux/store/cartSlice"; 

/* ─── Constants ─── */
const TEAL = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#EFEFEA";
const GRAY_TEXT = "#ABABAB";
const TEXT_DARK = "#1A1A1A";
const TEXT_MID = "#666666";

/* ─── Types ─── */
interface SubCategoryItem {
  id: string;
  name: string;
  price: number;
  icon: string;
}

interface SubCategoryItemProps {
  item: SubCategoryItem;
  serviceId: string;
  serviceName: string;
  categoryId: string;
  categoryName: string;
}

/* ─── Mock Data ─── */
const SERVICE = { id: "wash", name: "Wash" };
const CATEGORY = { id: "men", name: "Men's" };

const SUB_ITEMS: SubCategoryItem[] = [
  { id: "shirt", name: "Shirt", price: 30, icon: "tshirt-crew" },
  { id: "pant", name: "Pant", price: 40, icon: "hanger" },
  { id: "tshirt", name: "T-Shirt", price: 25, icon: "tshirt-crew-outline" },
  { id: "jacket", name: "Jacket", price: 80, icon: "zipper" },
  { id: "kurta", name: "Kurta", price: 35, icon: "human" },
  { id: "trouser", name: "Trouser", price: 40, icon: "hanger" },
  { id: "suit", name: "Suit", price: 120, icon: "briefcase-outline" },
  { id: "shorts", name: "Shorts", price: 20, icon: "human-handsdown" },
];

/* ─── Single Item Row ─── */
function SubCategoryRow({
  item,
  serviceId,
  serviceName,
  categoryId,
  categoryName,
}: SubCategoryItemProps) {
  const dispatch = useAppDispatch();
  const cartItemId = `${serviceId}_${categoryId}_${item.id}`;
  const quantity = useAppSelector(selectItemQuantity(cartItemId));

  const handleAdd = () => {
    dispatch(
      addToCart({
        id: cartItemId,
        serviceId,
        serviceName,
        categoryId,
        categoryName,
        subCategoryId: item.id,
        subCategoryName: item.name,
        price: item.price,
      })
    );
  };

  const handleRemove = () => dispatch(removeFromCart(cartItemId));

  return (
    <View style={styles.itemRow}>
      {/* ✅ Plain View — no goBack here */}
      <View style={styles.itemIconWrap}>
        <MaterialCommunityIcons name={item.icon} size={20} color={TEAL} />
      </View>

      {/* Name + Price */}
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>₹{item.price}</Text>
      </View>

      {/* ADD or Stepper */}
      {quantity === 0 ? (
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>ADD</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.stepper}>
          <TouchableOpacity style={styles.stepBtn} onPress={handleRemove} activeOpacity={0.8}>
            <Text style={styles.stepBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.stepQty}>{quantity}</Text>
          <TouchableOpacity style={styles.stepBtn} onPress={handleAdd} activeOpacity={0.8}>
            <Text style={styles.stepBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ─── Main Screen ─── */
export default function SubCategoryScreen() {
  const cartCount = useAppSelector(selectCartCount);
  const cartTotal = useAppSelector(selectCartTotal);
  const insets = useSafeAreaInsets(); // ✅ used for footer safe area

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

      {/* Header */}
      <View style={styles.header}>
        {/* ✅ Back button with correct router.back() */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{SERVICE.name}</Text>
          <Text style={styles.headerSub}>{CATEGORY.name}</Text>
        </View>

        {/* Cart Badge */}
        <View style={styles.cartBadgeWrap}>
          <MaterialCommunityIcons name="cart-outline" size={24} color={TEXT_DARK} />
          {cartCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{cartCount}</Text>
            </View>
          )}
        </View>
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          // ✅ Extra bottom padding when footer is visible so last item isn't hidden
          { paddingBottom: cartCount > 0 ? 100 + insets.bottom : 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {SUB_ITEMS.map((item, idx) => (
            <View key={item.id}>
              <SubCategoryRow
                item={item}
                serviceId={SERVICE.id}
                serviceName={SERVICE.name}
                categoryId={CATEGORY.id}
                categoryName={CATEGORY.name}
              />
              {idx < SUB_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ✅ Sticky Cart Footer — padded above Android nav bar */}
      {cartCount > 0 && (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom > 0 ? insets.bottom + 8 : 16 },
          ]}
        >
          <View style={styles.footerLeft}>
            <Text style={styles.footerCount}>
              {cartCount} item{cartCount > 1 ? "s" : ""}
            </Text>
            <Text style={styles.footerTotal}>₹{cartTotal}</Text>
          </View>
          <TouchableOpacity onPress={()=>router.push('/cart')} style={styles.footerBtn} activeOpacity={0.85}>
            <Text style={styles.footerBtnText}>View Cart</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

/* ─── Styles ─── */
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
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_DARK,
  },
  headerSub: {
    fontSize: 12,
    color: GRAY_TEXT,
    marginTop: 1,
  },
  cartBadgeWrap: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    // paddingBottom is set dynamically inline above
  },

  /* Card */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#F2F2EE",
  },

  /* Item Row */
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: TEAL_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_DARK,
  },
  itemPrice: {
    fontSize: 13,
    color: TEXT_MID,
    marginTop: 2,
  },

  /* ADD button */
  addBtn: {
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  addBtnText: {
    color: TEAL,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  /* Stepper */
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TEAL,
    borderRadius: 8,
    overflow: "hidden",
  },
  stepBtn: {
    width: 32,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 22,
  },
  stepQty: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    paddingHorizontal: 8,
    minWidth: 24,
    textAlign: "center",
  },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,

    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#EEEEE8",
    paddingHorizontal: 1,
    paddingTop: 12,
    // paddingBottom is set dynamically inline above via insets.bottom
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  footerLeft: {
    gap: 2,
  },
  footerCount: {
    fontSize: 12,
    color: GRAY_TEXT,
    fontWeight: "500",
  },
  footerTotal: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT_DARK,
  },
  footerBtn: {
    backgroundColor: TEAL,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});