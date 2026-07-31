import { router, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "@/src/theme/ThemeProvider";

/* ─── Constants ─── */
export default function PaymentSuccess() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const { theme, isDarkMode } = useTheme();

  console.log('[PaymentSuccess] orderNumber:', orderNumber);
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={theme.background} />

      <View style={styles.container}>
        {/* ── Icon ── */}
        <View style={[styles.iconOuter, { backgroundColor: theme.primaryLight }]}> 
          <View style={[styles.iconInner, { backgroundColor: theme.primary }]}> 
            <MaterialCommunityIcons name="check" size={32} color={theme.white} />
          </View>
        </View>

        {/* ── Text ── */}
        <Text style={[styles.title, { color: theme.text }]}>Payment Successful!</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}> 
          Your order has been placed successfully. We'll{"\n"}pick up your clothes soon.
        </Text>

        {/* ── Track Order Button ── */}
        <TouchableOpacity
          onPress={() => {
            if (!orderNumber) return;
            router.replace(`/trackorder/trackOrderScreen?orderId=${orderNumber}`);
          }}
          style={[styles.trackBtn, { backgroundColor: theme.primary }, !orderNumber && { opacity: 0.5 }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.trackBtnText, { color: theme.white }]}>Track Order</Text>
        </TouchableOpacity>

        {/* ── Back to Home ── */}
        <TouchableOpacity onPress={() => router.push('/')} activeOpacity={0.7}>
          <Text style={[styles.backText, { color: theme.primary }]}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },

  /* Icon */
  iconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Text */
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },

  /* Track button */
  trackBtn: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 8,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  trackBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },

  /* Back to Home */
  backText: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});