import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { router } from "expo-router";
import {
  useAppDispatch,
  useAppSelector,
  selectCartItems,
  selectCartCount,
  selectCartTotal,
} from "../../src/redux/store/hooks";
import { addToCart, removeFromCart, deleteFromCart } from "../../src/redux/store/cartSlice";
import type { CartItem } from "../../src/redux/store/cartSlice";

export default function Cart() {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector(selectCartItems);   
  const totalItems = useAppSelector(selectCartCount);
  const subtotal = useAppSelector(selectCartTotal);

  const handleIncrement = (item: CartItem) => {
    dispatch(
      addToCart({
        id: item.id,
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        subCategoryId: item.subCategoryId,
        subCategoryName: item.subCategoryName,
        price: item.price,
      })
    );
  };

  const handleDecrement = (id: string) => dispatch(removeFromCart(id));
  const handleDelete = (id: string) => dispatch(deleteFromCart(id));

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F0" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Cart</Text>
          <Text style={styles.headerSub}>{totalItems} item{totalItems !== 1 ? "s" : ""}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Body */}
      <View style={styles.body}>
        {cartItems.length === 0 ? (
          /* ── Empty State ── */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyCard}>
              <MaterialIcons name="shopping-cart" size={52} color={GRAY_TEXT} />
              <Text style={styles.emptyText}>Your cart is empty</Text>
            </View>
          </View>
        ) : (
          /* ── Filled State ── */
          <>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Cart Items Card */}
              <View style={styles.section}>
                {cartItems.map((item, index) => (
                  <View key={item.id}>
                    <View style={styles.cartRow}>
                      {/* Icon */}
                      <View style={styles.itemIconWrap}>
                        <MaterialCommunityIcons
                          name="tshirt-crew"
                          size={24}
                          color={TEAL}
                        />
                      </View>

                      {/* Info */}
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.subCategoryName}</Text>
                        <Text style={styles.itemCategory}>
                          {item.categoryName} • {item.serviceName}
                        </Text>
                        <Text style={styles.itemPrice}>₹{item.price} each</Text>
                      </View>

                      {/* Right: delete + qty controls */}
                      <View style={styles.itemRight}>
                        <TouchableOpacity
                          onPress={() => handleDelete(item.id)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons
                            name="delete-outline"
                            size={20}
                            color={GRAY_TEXT}
                          />
                        </TouchableOpacity>
                        <View style={styles.qtyRow}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => handleDecrement(item.id)}
                          >
                            <MaterialIcons name="remove" size={15} color={TEXT_DARK} />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{item.quantity}</Text>
                          <TouchableOpacity
                            style={[styles.qtyBtn, styles.qtyBtnPlus]}
                            onPress={() => handleIncrement(item)}
                          >
                            <MaterialIcons name="add" size={15} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {index < cartItems.length - 1 && (
                      <View style={styles.rowDivider} />
                    )}
                  </View>
                ))}
              </View>

              {/* Bill Summary */}
              <View style={styles.billCard}>
                <Text style={styles.billTitle}>Bill Summary</Text>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Subtotal ({totalItems})</Text>
                  <Text style={styles.billValue}>₹{subtotal}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>Delivery</Text>
                  <Text style={styles.billFree}>FREE</Text>
                </View>
                <View style={styles.billDivider} />
                <View style={styles.billRow}>
                  <Text style={styles.billTotal}>Total</Text>
                  <Text style={styles.billTotalValue}>₹{subtotal}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Place Order Button */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => router.push("/placeorder/placeorder")}
                style={styles.placeOrderBtn}
                activeOpacity={0.85}
              >
                <MaterialIcons name="credit-card" size={20} color="#fff" />
                <Text style={styles.placeOrderText}>
                  Place Order • ₹{subtotal}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/* ─── Constants ─── */
const TEAL = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#F5F5F0";
const GRAY_MID = "#E8E8E2";
const GRAY_TEXT = "#9B9B9B";
const TEXT_DARK = "#1A1A1A";
const TEXT_MID = "#5A5A5A";

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: GRAY_LIGHT },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: GRAY_LIGHT,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  headerCenter: { alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: TEXT_DARK },
  headerSub: { fontSize: 12, color: GRAY_TEXT, marginTop: 1 },

  body: { flex: 1 },

  emptyContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  emptyCard: {
    backgroundColor: "#fff", borderRadius: 16, paddingVertical: 48,
    alignItems: "center", justifyContent: "center", gap: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  emptyText: { fontSize: 15, color: GRAY_TEXT, fontWeight: "500" },

  scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 12 },

  section: {
    backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 14,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cartRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  itemIconWrap: {
    width: 46, height: 46, borderRadius: 10, backgroundColor: TEAL_LIGHT,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "700", color: TEXT_DARK },
  itemCategory: { fontSize: 12, color: TEXT_MID, marginTop: 2 },
  itemPrice: { fontSize: 12, color: TEAL, fontWeight: "600", marginTop: 3 },
  itemRight: { alignItems: "flex-end", gap: 8 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: GRAY_MID, alignItems: "center", justifyContent: "center",
  },
  qtyBtnPlus: { backgroundColor: TEAL },
  qtyText: { fontSize: 14, fontWeight: "700", color: TEXT_DARK, minWidth: 16, textAlign: "center" },
  rowDivider: { height: 1, backgroundColor: "#F0F0EA", marginLeft: 58 },

  billCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 10,
  },
  billTitle: { fontSize: 14, fontWeight: "700", color: TEXT_DARK, marginBottom: 2 },
  billRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  billLabel: { fontSize: 13, color: TEXT_MID },
  billValue: { fontSize: 13, color: TEXT_DARK, fontWeight: "600" },
  billFree: { fontSize: 13, color: TEAL, fontWeight: "700" },
  billDivider: { height: 1, backgroundColor: "#F0F0EA" },
  billTotal: { fontSize: 15, fontWeight: "800", color: TEXT_DARK },
  billTotalValue: { fontSize: 15, fontWeight: "800", color: TEXT_DARK },

  footer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: GRAY_LIGHT },
  placeOrderBtn: {
    backgroundColor: TEAL, borderRadius: 16, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: TEAL, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  placeOrderText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
});