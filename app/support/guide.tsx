import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AppBackground from "@/components/AppBackground";
import { useTheme } from "../../src/theme/ThemeProvider";

type GuideSection = {
  title: string;
  dos: string[];
  donts: string[];
};

const SECTIONS: GuideSection[] = [
  {
    title: "Placing an Order",
    dos: [
      "Pick the correct category (Men, Women, Children, Linen) so your items get sorted properly.",
      "Select the exact service you want per item — Wash, Iron, or Wash+Iron.",
      "Double-check the quantity for each item before adding it to your cart.",
      "Confirm your pickup address is accurate and has a working contact number.",
    ],
    donts: [
      "Don't place separate orders for items that can go in one pickup — it saves you time and money.",
      "Don't leave delicate or high-value items unmentioned; use the complaint/notes option if you have special instructions.",
    ],
  },
  {
    title: "Pickup & Delivery",
    dos: [
      "Be available at the scheduled pickup window, or let the rider know if you'll be a few minutes late.",
      "Keep your items ready and packed before the rider arrives.",
      "Check the live tracking screen for real-time status updates on your order.",
    ],
    donts: [
      "Don't hand over items that aren't part of the order to the rider.",
      "Don't ignore rider calls — they may need help finding your address.",
    ],
  },
  {
    title: "Cancellations",
    dos: [
      "Cancel within 2 hours of placing your order (and before pickup starts) for a free cancellation.",
      "Check the countdown timer on the order card to know how much time you have left.",
      "Refunds are processed within 3 to 7 working days and may be issued as coupons or credits at Company discretion.",
    ],
    donts: [
      "Don't wait too long — cancelling after the free 2-hour window attracts a ₹50 cancellation fee.",
      "Don't expect cancellation once the order has been picked up or is already in process at the service provider.",
      "Don't expect a refund for a completed service unless damage is proven.",
    ],
  },
  {
    title: "Payments & Wallet",
    dos: [
      "Choose the payment method that works best for you at checkout — cash, UPI, or card.",
      "Check your wallet balance before checkout; refunds from cancelled orders are credited there.",
    ],
    donts: [
      "Don't share your OTP with anyone, including riders or people claiming to be from support — Kora will never ask for it over a call.",
    ],
  },
  {
    title: "Account & Profile",
    dos: [
      "Keep your mobile number and email up to date so we can reach you about your orders.",
      "Use a strong password if you signed up with email instead of Google.",
    ],
    donts: [
      "Don't share your login credentials with anyone else.",
      "Don't ignore verification prompts — they help keep your account secure.",
    ],
  },
];

export default function UserGuideScreen() {
  const { theme, isDarkMode } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top"]}>
      <AppBackground>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

        <View style={styles.header}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.card }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>User Guide</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.intro, { color: theme.subText }]}>
            A quick guide to getting the most out of Kora — what helps things go smoothly, and what to avoid.
          </Text>

          {SECTIONS.map((section) => (
            <View key={section.title} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>

              {section.dos.map((line, i) => (
                <View key={`do-${i}`} style={styles.itemRow}>
                  <Ionicons name="checkmark-circle" size={18} color={theme.primary} style={styles.itemIcon} />
                  <Text style={[styles.itemText, { color: theme.text }]}>{line}</Text>
                </View>
              ))}

              {section.donts.map((line, i) => (
                <View key={`dont-${i}`} style={styles.itemRow}>
                  <Ionicons name="close-circle" size={18} color="#E53935" style={styles.itemIcon} />
                  <Text style={[styles.itemText, { color: theme.text }]}>{line}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40, gap: 14 },
  intro: { fontSize: 13.5, lineHeight: 19, marginBottom: 4 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  sectionTitle: { fontSize: 15.5, fontWeight: "700", marginBottom: 2 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  itemIcon: { marginTop: 1 },
  itemText: { fontSize: 13.5, lineHeight: 19, flex: 1 },
});