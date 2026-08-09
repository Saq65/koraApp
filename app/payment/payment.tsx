import { createOrder } from "@/src/api/order";
import { clearCart } from "@/src/redux/store/cartSlice";
import { useAppDispatch, useAppSelector } from "@/src/redux/store/hooks";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  selectPickupAddress,
  selectDropoffAddress,
  selectPickupCoordinates,
  selectDropoffCoordinates,
} from "@/src/redux/store/addressSlice";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "@/src/theme/ThemeProvider";

/* UPI options */
const UPI_OPTIONS = [
  {
    id: "gpay",
    translationKey: "payment.google_pay",
    icon: "google",
    iconColor: "#4285F4",
    iconBg: "#E8F0FE",
  },
  {
    id: "phonepe",
    translationKey: "payment.phonepe",
    icon: "phone",
    iconColor: "#6739B7",
    iconBg: "#EDE7F6",
  },
  {
    id: "paytm",
    translationKey: "payment.paytm",
    icon: "wallet",
    iconColor: "#00BAF2",
    iconBg: "#E3F7FE",
  },
  {
    id: "otherupi",
    translationKey: "payment.other_upi",
    icon: "dots-grid",
    iconColor: "#9CA3AF",
    iconBg: "#F0F0EA",
  },
];

export default function Payment() {
  const pickupAddress = useAppSelector(selectPickupAddress);
  const dropoffAddress = useAppSelector(selectDropoffAddress);
  const pickupCoordinates = useAppSelector(selectPickupCoordinates);
  const dropoffCoordinates = useAppSelector(selectDropoffCoordinates);

  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);

  const [selected, setSelected] = useState("gpay");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);

  const { total, pickupDay, timeSlot } = useLocalSearchParams<{
    total: string;
    pickupDay: string;
    timeSlot: string;
  }>();

  const totalAmount = Number(total) || 0;
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const handlePayment = async () => {
    try {
      if (cartItems.length === 0) {
        Alert.alert(t("payment.cart_empty_title"), t("payment.cart_empty_message"));
        return;
      }

      setLoading(true);

      const formattedItems = cartItems.map((item) => ({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        categoryName: item.categoryName,
        subCategoryName: item.subCategoryName,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity,
      }));

      const payload = {
        items: formattedItems,

        pickupAddress: {
          address: pickupAddress,
          coordinates: pickupCoordinates,
        },

        deliveryAddress: {
          address: dropoffAddress,
          coordinates: dropoffCoordinates,
        },

        paymentMethod: "upi" as const,
        selectedUpiApp: selected,
        paymentStatus: "success",
        pickupDay: pickupDay ?? "",
        timeSlot: timeSlot ?? "",
      };

      console.log("ORDER PAYLOAD:", JSON.stringify(payload, null, 2));

      const response = await createOrder(payload);

      console.log("BACKEND RESPONSE:", response);

      if (response.success) {
        dispatch(clearCart());

        console.log(
          "[Payment] navigating with orderNumber:",
          response.data?.orderNumber
        );

        Alert.alert(t("payment.success_title"), t("payment.success_message"), [
          {
            text: t("common.ok"),
            onPress: () =>
              router.replace(
                `/paymentsucces?orderNumber=${response.data.orderNumber}`
              ),
          },
        ]);
      } else {
        Alert.alert(
          t("payment.payment_failed_title"),
          response?.message || t("payment.payment_failed_message")
        );
      }
    } catch (error) {
      console.log("PAYMENT ERROR:", error);
      Alert.alert(t("payment.error_title"), t("payment.error_message"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background,
        },
      ]}
    >
      <AppBackground>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.backBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.text,
              },
            ]}
          >
            {t("payment.title")}
          </Text>

          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Amount to Pay Card */}
          <View
            style={[
              styles.card,
              styles.amountCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.upiHeader}>
              <View
                style={[
                  styles.upiIconWrap,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="cash-multiple"
                  size={21}
                  color={theme.white}
                />
              </View>

              <View style={styles.headerTextContainer}>
                <Text
                  style={[
                    styles.upiTitle,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {t("payment.amount_to_pay")}
                </Text>

                <Text
                  style={[
                    styles.upiSubtitle,
                    {
                      color: theme.subText,
                    },
                  ]}
                >
                  {t("payment.includes_tax")}
                </Text>
              </View>
            </View>

            <View style={styles.amountContainer}>
              <Text
                style={[
                  styles.currencySymbol,
                  {
                    color: theme.text,
                  },
                ]}
              >
                ₹
              </Text>

              <Text
                style={[
                  styles.amountText,
                  {
                    color: theme.text,
                  },
                ]}
              >
                {totalAmount.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* UPI Payment Card */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.upiHeader}>
              <View
                style={[
                  styles.upiIconWrap,
                  {
                    backgroundColor: theme.primary,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="cellphone"
                  size={21}
                  color={theme.white}
                />
              </View>

              <View style={styles.headerTextContainer}>
                <Text
                  style={[
                    styles.upiTitle,
                    {
                      color: theme.text,
                    },
                  ]}
                >
                  {t("payment.pay_via_upi")}
                </Text>

                <Text
                  style={[
                    styles.upiSubtitle,
                    {
                      color: theme.subText,
                    },
                  ]}
                >
                  {t("payment.fast_secure_payment")}
                </Text>
              </View>
            </View>

            {/* UPI Options */}
            <View style={styles.grid}>
              {UPI_OPTIONS.map((opt) => {
                const isActive = selected === opt.id;

                return (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.8}
                    style={[
                      styles.gridItem,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.card,
                      },
                      isActive && {
                        borderColor: theme.primary,
                        backgroundColor: theme.primaryLight,
                      },
                    ]}
                    onPress={() => setSelected(opt.id)}
                  >
                    <View
                      style={[
                        styles.gridIcon,
                        {
                          backgroundColor: opt.iconBg,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={opt.icon}
                        size={18}
                        color={opt.iconColor}
                      />
                    </View>

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.gridLabel,
                        {
                          color: theme.text,
                        },
                        isActive && {
                          color: theme.primary,
                        },
                      ]}
                    >
                      {t(opt.translationKey)}
                    </Text>

                    {isActive && (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={17}
                        color={theme.primary}
                        style={styles.selectedIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View
                style={[
                  styles.dividerLine,
                  {
                    backgroundColor: theme.border,
                  },
                ]}
              />

              <Text
                style={[
                  styles.orText,
                  {
                    color: theme.subText,
                    backgroundColor: theme.card,
                  },
                ]}
              >
                {t("payment.or_enter_upi")}
              </Text>

              <View
                style={[
                  styles.dividerLine,
                  {
                    backgroundColor: theme.border,
                  },
                ]}
              />
            </View>

            {/* UPI Input */}
            <View
              style={[
                styles.inputWrap,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="at"
                size={20}
                color={theme.subText}
              />

              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                  },
                ]}
                placeholder={t("payment.upi_placeholder")}
                placeholderTextColor={theme.subText}
                value={upiId}
                onChangeText={setUpiId}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            {/* Security Message */}
            <View style={styles.secureRow}>
              <MaterialCommunityIcons
                name="shield-check-outline"
                size={16}
                color={theme.primary}
              />

              <Text
                style={[
                  styles.secureText,
                  {
                    color: theme.subText,
                  },
                ]}
              >
                {t("payment.secured_encryption")}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: theme.background,
              borderTopColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePayment}
            style={[
              styles.payBtn,
              {
                backgroundColor: theme.primary,
              },
              loading && styles.disabledButton,
            ]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={21}
                  color={theme.white}
                />

                <Text
                  style={[
                    styles.payBtnText,
                    {
                      color: theme.white,
                    },
                  ]}
                >
                  {t("payment.pay_amount", { amount: totalAmount.toFixed(2) })}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    gap:16,
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  headerPlaceholder: {
    width: 38,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
  },

  card: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },

  /*
   * Creates proper spacing between the Amount card
   * and the UPI payment card.
   */
  amountCard: {
    marginBottom: 20,
  },

  upiHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },

  upiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginRight: 12,
  },

  /*
   * flex: 1 and minWidth: 0 keep long text
   * inside the available width.
   */
  headerTextContainer: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },

  upiTitle: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 21,
  },

  upiSubtitle: {
    width: "100%",
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    flexShrink: 1,
  },

  amountContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 18,
  },

  currencySymbol: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 34,
    marginRight: 2,
  },

  amountText: {
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
    rowGap: 12,
  },

  gridItem: {
    width: "48.3%",
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderWidth: 1,
    borderRadius: 13,
  },

  gridIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    marginRight: 8,
  },

  gridLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "600",
  },

  selectedIcon: {
    marginLeft: 4,
  },

  dividerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 22,
    marginBottom: 16,
  },

  dividerLine: {
    flex: 1,
    height: 1,
  },

  orText: {
    paddingHorizontal: 10,
    fontSize: 12,
    fontWeight: "500",
  },

  inputWrap: {
    width: "100%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
    paddingVertical: 13,
    fontSize: 14,
  },

  secureRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },

  secureText: {
    marginLeft: 6,
    fontSize: 12,
    lineHeight: 17,
  },

  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  payBtn: {
    minHeight: 54,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 20,
  },

  payBtnText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.65,
  },
});