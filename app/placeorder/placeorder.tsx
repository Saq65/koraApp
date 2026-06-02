import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import {
  useAppSelector,
  selectCartItems,
  selectCartCount,
  selectCartTotal,
} from "../../src/redux/store/hooks";
import {
  selectPickupAddress,
  selectDropoffAddress,
} from "../../src/redux/store/addressSlice"; 

/* ─── Constants ─── */
const TEAL = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#EFEFEA";
const GRAY_TEXT = "#ABABAB";
const TEXT_DARK = "#1A1A1A";
const TEXT_MID = "#666666";

type PickupDay = "Today" | "Tomorrow";
type TimeSlot = "10:00 AM" | "2:00 PM";
type LocationType = "pickup" | "dropoff";

const DELIVERY_CHARGE = 0;

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function LocationRow({
  label,
  address,
  onChangePress,
}: {
  label: string;
  address: string;
  onChangePress: () => void;
}) {
  return (
    <View style={styles.locationRow}>
      <View style={styles.locationLeft}>
        <View style={styles.greenDot} />
        <View style={styles.locationText}>
          <View style={styles.locationTopRow}>
            <Text style={styles.locationLabel}>{label}</Text>
            <TouchableOpacity style={styles.changeBtn} onPress={onChangePress} activeOpacity={0.7}>
              <MaterialCommunityIcons name="pencil-outline" size={12} color={TEAL} />
              <Text style={styles.changeBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressRow}>
            <MaterialIcons name="location-on" size={12} color={GRAY_TEXT} />
            <Text style={styles.addressText}>{address}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function PlaceOrder() {
  const [pickupDay, setPickupDay] = useState<PickupDay>("Tomorrow");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("10:00 AM");
  const [agreed, setAgreed] = useState(false);

  // ✅ Addresses from Redux (updated by PickupLocation screen)
  const pickupAddress = useAppSelector(selectPickupAddress);
  const dropoffAddress = useAppSelector(selectDropoffAddress);

  // ✅ Navigate to PickupLocation screen with type param
  const openLocationScreen = (type: LocationType) => {
    router.push({
      pathname: "/PickupLocation/PickupLocation",
      params: { type },
    });
  };

  // Redux cart
  const cartItems = useAppSelector(selectCartItems);
  const totalItems = useAppSelector(selectCartCount);
  const itemsTotal = useAppSelector(selectCartTotal);
  const total = itemsTotal + DELIVERY_CHARGE;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Place Order</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Your Items ── */}
        <SectionTitle title={`Your Items (${totalItems})`} />
        <View style={styles.card}>
          {cartItems.map((item, idx) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemIconWrap}>
                  <MaterialCommunityIcons name="tshirt-crew" size={20} color={TEAL} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.subCategoryName}</Text>
                  <Text style={styles.itemSub}>
                    {item.serviceName} • {item.quantity}{" "}
                    {item.quantity > 1 ? "pieces" : "piece"}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
              {idx < cartItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* ── Pickup & Drop Location ── */}
        <SectionTitle title="Pickup & Drop Location" />
        <View style={styles.card}>
          <LocationRow
            label="Pickup From"
            address={pickupAddress}
            onChangePress={() => openLocationScreen("pickup")}
          />
          <View style={styles.locationDivider} />
          <LocationRow
            label="Drop-off At"
            address={dropoffAddress}
            onChangePress={() => openLocationScreen("dropoff")}
          />
        </View>

        {/* ── Schedule ── */}
        <SectionTitle title="Schedule" />
        <View style={styles.card}>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleBlock}>
              <View style={styles.scheduleHeader}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={GRAY_TEXT} />
                <Text style={styles.scheduleHeaderText}>Pickup Date</Text>
              </View>
              <View style={styles.pillRow}>
                {(["Today", "Tomorrow"] as PickupDay[]).map((day) => (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setPickupDay(day)}
                    style={[styles.pill, pickupDay === day ? styles.pillActive : styles.pillInactive]}
                  >
                    <Text style={[styles.pillText, pickupDay === day ? styles.pillTextActive : styles.pillTextInactive]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.scheduleBlock}>
              <View style={styles.scheduleHeader}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={GRAY_TEXT} />
                <Text style={styles.scheduleHeaderText}>Time Slot</Text>
              </View>
              <View style={styles.pillRow}>
                {(["10:00 AM", "2:00 PM"] as TimeSlot[]).map((slot) => (
                  <TouchableOpacity
                    key={slot}
                    onPress={() => setTimeSlot(slot)}
                    style={[styles.pill, timeSlot === slot ? styles.pillActive : styles.pillInactive]}
                  >
                    <Text style={[styles.pillText, timeSlot === slot ? styles.pillTextActive : styles.pillTextInactive]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── Bill Summary ── */}
        <View style={styles.card}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Items ({totalItems})</Text>
            <Text style={styles.billValue}>₹{itemsTotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery</Text>
            <Text style={styles.billFree}>FREE</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>Total</Text>
            <Text style={styles.billTotal}>₹{total}</Text>
          </View>
        </View>

        {/* ── T&C ── */}
        <TouchableOpacity style={styles.tcRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <MaterialIcons name="check" size={13} color="#fff" />}
          </View>
          <Text style={styles.tcText}>
            I agree to the <Text style={styles.tcLink}>Terms & Conditions</Text> of KORA.care.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, !agreed && styles.payBtnDisabled]}
          activeOpacity={agreed ? 0.85 : 1}
          disabled={!agreed}
          onPress={() =>
            router.push({
              pathname: "/payment/payment",
              params: { total: String(total), pickupDay, timeSlot },
            })
          }
        >
          <MaterialCommunityIcons name="credit-card-outline" size={18} color={agreed ? "#fff" : GRAY_TEXT} />
          <Text style={[styles.payBtnText, !agreed && styles.payBtnTextDisabled]}>
            Proceed to Pay • ₹{total}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ✅ No modal here anymore — PickupLocation is a full screen now */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: GRAY_LIGHT },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: TEXT_DARK },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: TEXT_DARK, marginTop: 6, marginBottom: 2 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  divider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 10 },
  itemRow: { flexDirection: "row", alignItems: "center" },
  itemIconWrap: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: TEAL_LIGHT,
    alignItems: "center", justifyContent: "center", marginRight: 10,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: TEXT_DARK },
  itemSub: { fontSize: 11, color: GRAY_TEXT, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: "700", color: TEXT_DARK },
  locationRow: { paddingVertical: 4 },
  locationLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2ECC71", marginTop: 4 },
  locationText: { flex: 1 },
  locationTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  locationLabel: { fontSize: 13, fontWeight: "600", color: TEXT_DARK },
  changeBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  changeBtnText: { fontSize: 12, color: TEAL, fontWeight: "600" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 3 },
  addressText: { fontSize: 11, color: GRAY_TEXT, flex: 1 },
  locationDivider: { height: 1, backgroundColor: "#F0F0F0", marginVertical: 12 },
  scheduleRow: { flexDirection: "row", gap: 16 },
  scheduleBlock: { flex: 1 },
  scheduleHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  scheduleHeaderText: { fontSize: 12, color: GRAY_TEXT, fontWeight: "500" },
  pillRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  pillActive: { backgroundColor: TEAL },
  pillInactive: { backgroundColor: "#EBEBE5" },
  pillText: { fontSize: 13, fontWeight: "600" },
  pillTextActive: { color: "#fff" },
  pillTextInactive: { color: TEXT_MID },
  billRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 3 },
  billLabel: { fontSize: 13, color: TEXT_MID },
  billValue: { fontSize: 13, color: TEXT_DARK, fontWeight: "600" },
  billFree: { fontSize: 13, color: "#2ECC71", fontWeight: "700" },
  billTotal: { fontSize: 15, fontWeight: "800", color: TEXT_DARK },
  tcRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4 },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
    borderColor: GRAY_TEXT, alignItems: "center", justifyContent: "center", marginTop: 1,
  },
  checkboxChecked: { backgroundColor: TEAL, borderColor: TEAL },
  tcText: { flex: 1, fontSize: 12, color: TEXT_MID, lineHeight: 18 },
  tcLink: { color: TEAL, fontWeight: "600", textDecorationLine: "underline" },
  footer: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: GRAY_LIGHT, borderTopWidth: 1, borderTopColor: "#E5E5E0",
  },
  payBtn: {
    backgroundColor: TEAL, borderRadius: 30, paddingVertical: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  payBtnDisabled: { backgroundColor: "#D4D4CC" },
  payBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  payBtnTextDisabled: { color: GRAY_TEXT },
});