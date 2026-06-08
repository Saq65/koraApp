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
import { useTranslation } from "react-i18next";
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
import { useTheme } from "../../src/theme/ThemeProvider";
import AppBackground from "@/components/AppBackground";

type PickupDay = "today" | "tomorrow";
type TimeSlot = "10:00 AM" | "2:00 PM";
type LocationType = "pickup" | "dropoff";

const DELIVERY_CHARGE = 0;

function SectionTitle({ title, theme }: { title: string; theme: any }) {
  const styles = getSectionTitleStyles(theme);
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const getSectionTitleStyles = (theme: any) =>
  StyleSheet.create({
    sectionTitle: { fontSize: 14, fontWeight: "700", color: theme.text, marginTop: 6, marginBottom: 2 },
  });

function LocationRow({
  label,
  address,
  onChangePress,
  changeLabel,
  theme,
}: {
  label: string;
  address: string;
  onChangePress: () => void;
  changeLabel: string;
  theme: any;
}) {
  const styles = getLocationRowStyles(theme);
  return (
    <View style={styles.locationRow}>
      <View style={styles.locationLeft}>
        <View style={styles.greenDot} />
        <View style={styles.locationText}>
          <View style={styles.locationTopRow}>
            <Text style={styles.locationLabel}>{label}</Text>
            <TouchableOpacity style={styles.changeBtn} onPress={onChangePress} activeOpacity={0.7}>
              <MaterialCommunityIcons name="pencil-outline" size={12} color={theme.primary} />
              <Text style={[styles.changeBtnText, { color: theme.primary }]}>{changeLabel}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressRow}>
            <MaterialIcons name="location-on" size={12} color={theme.subText} />
            <Text style={[styles.addressText, { color: theme.subText }]}>{address}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const getLocationRowStyles = (theme: any) =>
  StyleSheet.create({
    locationRow: { paddingVertical: 4 },
    locationLeft: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2ECC71", marginTop: 4 },
    locationText: { flex: 1 },
    locationTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    locationLabel: { fontSize: 13, fontWeight: "600", color: theme.text },
    changeBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
    changeBtnText: { fontSize: 12, fontWeight: "600" },
    addressRow: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 3 },
    addressText: { fontSize: 11, flex: 1 },
  });

export default function PlaceOrder() {
  const { t } = useTranslation();
  const { theme, isDarkMode } = useTheme();

  const [pickupDay, setPickupDay] = useState<PickupDay>("tomorrow");
  const [timeSlot, setTimeSlot] = useState<TimeSlot>("10:00 AM");

  const pickupAddress = useAppSelector(selectPickupAddress);
  const dropoffAddress = useAppSelector(selectDropoffAddress);
  const cartItems = useAppSelector(selectCartItems);
  const totalItems = useAppSelector(selectCartCount);
  const itemsTotal = useAppSelector(selectCartTotal);
  const total = itemsTotal + DELIVERY_CHARGE;

  const openLocationScreen = (type: LocationType) => {
    router.push({
      pathname: "/PickupLocation/PickupLocation",
      params: { type },
    });
  };

  const styles = getGlobalStyles(theme);

  const pickupDays: { key: PickupDay; label: string }[] = [
    { key: "today", label: t("place_order.today") },
    { key: "tomorrow", label: t("place_order.tomorrow") },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <AppBackground>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{t("place_order.title")}</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Your Items */}
          <SectionTitle title={t("place_order.your_items", { count: totalItems })} theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            {cartItems.map((item, idx) => (
              <View key={item.id}>
                <View style={styles.itemRow}>
                  <View style={[styles.itemIconWrap, { backgroundColor: theme.primaryLight }]}>
                    <MaterialCommunityIcons name="tshirt-crew" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.text }]}>{item.subCategoryName}</Text>
                    <Text style={[styles.itemSub, { color: theme.subText }]}>
                      {item.serviceName} • {item.quantity}{" "}
                      {item.quantity > 1
                        ? t("place_order.pieces")
                        : t("place_order.piece")}
                    </Text>
                  </View>
                  <Text style={[styles.itemPrice, { color: theme.text }]}>₹{item.price * item.quantity}</Text>
                </View>
                {idx < cartItems.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              </View>
            ))}
          </View>

          {/* Pickup & Drop Location */}
          <SectionTitle title={t("place_order.pickup_drop_location")} theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <LocationRow
              label={t("place_order.pickup_from")}
              address={pickupAddress}
              onChangePress={() => openLocationScreen("pickup")}
              changeLabel={t("place_order.change")}
              theme={theme}
            />
            <View style={[styles.locationDivider, { backgroundColor: theme.border }]} />
            <LocationRow
              label={t("place_order.dropoff_at")}
              address={dropoffAddress}
              onChangePress={() => openLocationScreen("dropoff")}
              changeLabel={t("place_order.change")}
              theme={theme}
            />
          </View>

          {/* Schedule */}
          <SectionTitle title={t("place_order.schedule")} theme={theme} />
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleBlock}>
                <View style={styles.scheduleHeader}>
                  <MaterialCommunityIcons name="calendar-outline" size={14} color={theme.subText} />
                  <Text style={[styles.scheduleHeaderText, { color: theme.subText }]}>{t("place_order.pickup_date")}</Text>
                </View>
                <View style={styles.pillRow}>
                  {pickupDays.map(({ key, label }) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setPickupDay(key)}
                      style={[
                        styles.pill,
                        pickupDay === key
                          ? [styles.pillActive, { backgroundColor: theme.primary }]
                          : [styles.pillInactive, { backgroundColor: theme.border }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          pickupDay === key
                            ? styles.pillTextActive
                            : [styles.pillTextInactive, { color: theme.subText }],
                        ]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.scheduleBlock}>
                <View style={styles.scheduleHeader}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={theme.subText} />
                  <Text style={[styles.scheduleHeaderText, { color: theme.subText }]}>{t("place_order.time_slot")}</Text>
                </View>
                <View style={styles.pillRow}>
                  {(["10:00 AM", "2:00 PM"] as TimeSlot[]).map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => setTimeSlot(slot)}
                      style={[
                        styles.pill,
                        timeSlot === slot
                          ? [styles.pillActive, { backgroundColor: theme.primary }]
                          : [styles.pillInactive, { backgroundColor: theme.border }],
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          timeSlot === slot
                            ? styles.pillTextActive
                            : [styles.pillTextInactive, { color: theme.subText }],
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Bill Summary */}
          <View style={[styles.card, { backgroundColor: theme.card }]}>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: theme.subText }]}>{t("place_order.your_items", { count: totalItems })}</Text>
              <Text style={[styles.billValue, { color: theme.text }]}>₹{itemsTotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: theme.subText }]}>{t("place_order.delivery")}</Text>
              <Text style={[styles.billFree, { color: theme.primary }]}>{t("place_order.free")}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={styles.billRow}>
              <Text style={[styles.billTotal, { color: theme.text }]}>{t("common.total")}</Text>
              <Text style={[styles.billTotal, { color: theme.text }]}>₹{total}</Text>
            </View>
          </View>

        </ScrollView>

        {/* Sticky CTA */}
        <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: "/payment/payment",
                params: { total: String(total), pickupDay, timeSlot },
              })
            }
          >
            <MaterialCommunityIcons name="credit-card-outline" size={18} color="#fff" />
            <Text style={styles.payBtnText}>{t("place_order.proceed_to_pay", { total })}</Text>
          </TouchableOpacity>
        </View>
      </AppBackground>
    </SafeAreaView>
  );
}

const getGlobalStyles = (theme: any) =>
  StyleSheet.create({
    safeArea: { flex: 1 },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 16, paddingVertical: 12,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card,
      alignItems: "center", justifyContent: "center",
      shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    headerTitle: { fontSize: 17, fontWeight: "700" },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
    card: {
      borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
      shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    },
    divider: { height: 1, marginVertical: 10 },
    itemRow: { flexDirection: "row", alignItems: "center" },
    itemIconWrap: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: "center", justifyContent: "center", marginRight: 10,
    },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: "600" },
    itemSub: { fontSize: 11, marginTop: 2 },
    itemPrice: { fontSize: 14, fontWeight: "700" },
    locationDivider: { height: 1, marginVertical: 12 },
    scheduleRow: { flexDirection: "row", gap: 16 },
    scheduleBlock: { flex: 1 },
    scheduleHeader: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
    scheduleHeaderText: { fontSize: 12, fontWeight: "500" },
    pillRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
    pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
    pillActive: {},
    pillInactive: {},
    pillText: { fontSize: 13, fontWeight: "600" },
    pillTextActive: { color: "#fff" },
    pillTextInactive: {},
    billRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 3 },
    billLabel: { fontSize: 13 },
    billValue: { fontSize: 13, fontWeight: "600" },
    billFree: { fontSize: 13, fontWeight: "700" },
    billTotal: { fontSize: 15, fontWeight: "800" },
    footer: {
      paddingHorizontal: 16, paddingVertical: 12,
      borderTopWidth: 1,
    },
    payBtn: {
      borderRadius: 30, paddingVertical: 15,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    },
    payBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  });