import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { router } from "expo-router";
import {
  useAppDispatch, useAppSelector,
  selectCartItems, selectCartCount, selectCartTotal,
} from "../../src/redux/store/hooks";
import { addToCart, removeFromCart, deleteFromCart } from "../../src/redux/store/cartSlice";
import type { CartItem } from "../../src/redux/store/cartSlice";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";
import { useTranslation } from "react-i18next";

export default function Cart() {
  const dispatch = useAppDispatch();
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const cartItems = useAppSelector(selectCartItems);
  const totalItems = useAppSelector(selectCartCount);
  const subtotal = useAppSelector(selectCartTotal);

  const handleIncrement = (item: CartItem) => {
    dispatch(addToCart({
      id: item.id,
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      subCategoryId: item.subCategoryId,
      subCategoryName: item.subCategoryName,
      price: item.price,
      quantity: 1,
    }));
  };

  const handleDecrement = (id: string) => dispatch(removeFromCart(id));
  const handleDelete = (id: string) => dispatch(deleteFromCart(id));

  const styles = getStyles(theme);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={["top"]}>
      <AppBackground>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerMycart}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t("cart.my_cart")}</Text>
          </View>
          <Text style={styles.itemCount}>
            {totalItems} {totalItems !== 1 ? t("cart.items") : t("cart.item")}
          </Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {cartItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyCard}>
                <MaterialIcons name="shopping-cart" size={52} color={theme.subText} />
                <Text style={styles.emptyText}>{t("cart.empty")}</Text>
              </View>
            </View>
          ) : (
            <>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Cart Items */}
                <View style={styles.section}>
                  {cartItems.map((item, index) => (
                    <View key={item.id}>
                      <View style={styles.cartRow}>
                        <View style={styles.itemIconWrap}>
                          <MaterialCommunityIcons name="tshirt-crew" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.subCategoryName}</Text>
                          <Text style={styles.itemCategory}>
                            {item.categoryName} • {item.serviceName}
                          </Text>
                          <Text style={styles.itemPrice}>
                            {t("cart.qty", { count: item.quantity })}
                          </Text>
                        </View>
                        <View style={styles.itemRight}>
                          <TouchableOpacity
                            onPress={() => handleDelete(item.id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialIcons name="delete-outline" size={20} color={theme.subText} />
                          </TouchableOpacity>
                          <View style={styles.qtyRow}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => handleDecrement(item.id)}>
                              <MaterialIcons name="remove" size={15} color={theme.text} />
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
                      {index < cartItems.length - 1 && <View style={styles.rowDivider} />}
                    </View>
                  ))}
                </View>

                {/* Bill Summary */}
                <View style={styles.billCard}>
                  <Text style={styles.billTitle}>{t("cart.bill_summary")}</Text>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>
                      {t("place_order.your_items", { count: totalItems })}
                    </Text>
                    <Text style={styles.billValue}>₹{subtotal}</Text>
                  </View>
                  <View style={styles.billRow}>
                    <Text style={styles.billLabel}>{t("cart.delivery")}</Text>
                    <Text style={styles.billFree}>{t("cart.free")}</Text>
                  </View>
                  <View style={styles.billDivider} />
                  <View style={styles.billRow}>
                    <Text style={styles.billTotal}>{t("cart.total")}</Text>
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
                  <Text style={styles.placeOrderText}>{t("cart.place_order")}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </AppBackground>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
      flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12,
    },
    headerMycart: { flexDirection: "row", alignItems: "center", gap: 10 },
    backBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    headerTitle: { fontSize: 18, fontWeight: "700", color: theme.text },
    itemCount: { fontSize: 14, fontWeight: "500", color: theme.subText, minWidth: 50, textAlign: "right" },
    body: { flex: 1 },
    emptyContainer: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
    emptyCard: {
      backgroundColor: theme.card, borderRadius: 16, paddingVertical: 48,
      alignItems: "center", justifyContent: "center", gap: 14,
      shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    },
    emptyText: { fontSize: 15, color: theme.subText, fontWeight: "500" },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, gap: 12 },
    section: {
      backgroundColor: theme.card, borderRadius: 16, paddingHorizontal: 14,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    cartRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
    itemIconWrap: {
      width: 46, height: 46, borderRadius: 10, backgroundColor: theme.primaryLight,
      alignItems: "center", justifyContent: "center", marginRight: 12,
    },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: "700", color: theme.text },
    itemCategory: { fontSize: 12, color: theme.subText, marginTop: 2 },
    itemPrice: { fontSize: 12, color: theme.primary, fontWeight: "600", marginTop: 3 },
    itemRight: { alignItems: "flex-end", gap: 8 },
    qtyRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    qtyBtn: {
      width: 28, height: 28, borderRadius: 14, backgroundColor: theme.border,
      alignItems: "center", justifyContent: "center",
    },
    qtyBtnPlus: { backgroundColor: theme.primary },
    qtyText: { fontSize: 14, fontWeight: "700", color: theme.text, minWidth: 16, textAlign: "center" },
    rowDivider: { height: 1, backgroundColor: theme.border, marginLeft: 58 },
    billCard: {
      backgroundColor: theme.card, borderRadius: 16, padding: 16,
      shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, gap: 10,
    },
    billTitle: { fontSize: 14, fontWeight: "700", color: theme.text, marginBottom: 2 },
    billRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    billLabel: { fontSize: 13, color: theme.subText },
    billValue: { fontSize: 13, color: theme.text, fontWeight: "600" },
    billFree: { fontSize: 13, color: theme.primary, fontWeight: "700" },
    billDivider: { height: 1, backgroundColor: theme.border },
    billTotal: { fontSize: 15, fontWeight: "800", color: theme.text },
    billTotalValue: { fontSize: 15, fontWeight: "800", color: theme.text },
    footer: { paddingHorizontal: 16, paddingVertical: 12 },
    placeOrderBtn: {
      backgroundColor: theme.primary, borderRadius: 16, paddingVertical: 16,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
      shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    placeOrderText: { color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  });