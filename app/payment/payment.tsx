import { createOrder } from "@/src/api/order";
import { clearCart } from "@/src/redux/store/cartSlice";
import { useAppDispatch, useAppSelector } from "@/src/redux/store/hooks";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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

/* Colors */
const TEAL = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#EFEFEA";
const GRAY_TEXT = "#ABABAB";
const TEXT_DARK = "#1A1A1A";
const TEXT_MID = "#666666";

/* UPI options */
const UPI_OPTIONS = [
  { id: "gpay", label: "Google Pay", icon: "google", iconColor: "#4285F4", iconBg: "#E8F0FE" },
  { id: "phonepe", label: "PhonePe", icon: "phone", iconColor: "#6739B7", iconBg: "#EDE7F6" },
  { id: "paytm", label: "Paytm", icon: "wallet", iconColor: "#00BAF2", iconBg: "#E3F7FE" },
  { id: "otherupi", label: "Other UPI", icon: "dots-grid", iconColor: GRAY_TEXT, iconBg: "#F0F0EA" },
];

export default function Payment() {
  const pickupAddress = useAppSelector(selectPickupAddress);
  const dropoffAddress = useAppSelector(selectDropoffAddress);
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const [selected, setSelected] = useState("gpay");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const pickupCoordinates = useAppSelector(selectPickupCoordinates);
  const dropoffCoordinates = useAppSelector(selectDropoffCoordinates);
  const { pickupDay, timeSlot } = useLocalSearchParams<{
    total: string;
    pickupDay: string;
    timeSlot: string;
  }>();

  const handlePayment = async () => {
    try {
      if (cartItems.length === 0) {
        Alert.alert("Cart Empty", "Please add items first");
        return;
      }
      setLoading(true);

      const formattedItems = cartItems.map(item => ({
        serviceId: item.serviceId,
        serviceName: item.serviceName,
        categoryName: item.categoryName,
        subCategoryName: item.subCategoryName,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.price * item.quantity
      }));

      const payload = {
        items: formattedItems,
        pickupAddress: {
          address: pickupAddress,
          coordinates: pickupCoordinates,   // ✅ include (could be null)
        },
        deliveryAddress: {
          address: dropoffAddress,
          coordinates: dropoffCoordinates,  // ✅ include
        },
        paymentMethod: "upi" as const,
        selectedUpiApp: selected,
        paymentStatus: "success",
        pickupDay: pickupDay ?? "",    // ← add
        timeSlot: timeSlot ?? "",
      };

      console.log("ORDER PAYLOAD:", JSON.stringify(payload, null, 2));
      const response = await createOrder(payload);
      console.log("BACKEND RESPONSE:", response);

      if (response.success) {
        dispatch(clearCart());
        console.log('[Payment] navigating with orderNumber:', response.data?.orderNumber);
        Alert.alert("Success", "Order placed successfully", [
          {
            text: "OK",
            onPress: () => router.replace(`/paymentsucces?orderNumber=${response.data.orderNumber}`)
          }
        ]);
      }

    } catch (error) {
      console.log("PAYMENT ERROR:", error);
      Alert.alert("Error", "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppBackground>
        <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.upiHeader}>
              <View style={styles.upiIconWrap}>
                <MaterialCommunityIcons name="cellphone" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.upiTitle}>Pay via UPI</Text>
                <Text style={styles.upiSubtitle}>Fast & secure payment</Text>
              </View>
            </View>

            <View style={styles.grid}>
              {UPI_OPTIONS.map((opt) => {
                const isActive = selected === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.gridItem, isActive && styles.gridItemActive]}
                    onPress={() => setSelected(opt.id)}
                  >
                    <View style={[styles.gridIcon, { backgroundColor: opt.iconBg }]}>
                      <MaterialCommunityIcons name={opt.icon} size={18} color={opt.iconColor} />
                    </View>
                    <Text style={[styles.gridLabel, isActive && styles.gridLabelActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.orText}>Or enter UPI ID</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="yourname@upi"
                placeholderTextColor={GRAY_TEXT}
                value={upiId}
                onChangeText={setUpiId}
              />
            </View>

            <View style={styles.secureRow}>
              <MaterialCommunityIcons name="shield-check-outline" size={14} color={TEAL} />
              <Text style={styles.secureText}>Secured by 256-bit encryption</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handlePayment} style={styles.payBtn} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                <Text style={styles.payBtnText}>Continue Payment</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </AppBackground>
    </SafeAreaView>
  );
}

// ... styles remain exactly the same as you had ...
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GRAY_LIGHT,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },

  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  scrollContent: {
    padding: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    gap: 16,
  },

  upiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  upiIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: TEAL,
    justifyContent: "center",
    alignItems: "center",
  },

  upiTitle: {
    fontWeight: "700",
    fontSize: 15,
  },

  upiSubtitle: {
    color: GRAY_TEXT,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  gridItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
  },

  gridItemActive: {
    borderColor: TEAL,
    backgroundColor: TEAL_LIGHT,
  },

  gridIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  gridLabel: {
    fontWeight: "600",
  },

  gridLabelActive: {
    color: TEAL,
  },

  orText: {
    color: TEXT_MID,
  },

  inputWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 12,
  },

  input: {
    fontSize: 14,
  },

  secureRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },

  secureText: {
    fontSize: 12,
    color: TEXT_MID,
  },

  footer: {
    padding: 16,
  },

  payBtn: {
    backgroundColor: TEAL,
    padding: 15,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  payBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
});