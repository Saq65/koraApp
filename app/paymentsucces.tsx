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
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/theme/ThemeProvider";

export default function PaymentSuccess() {
  const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
  const { theme, isDarkMode } = useTheme();
  const { t } = useTranslation();

  console.log("[PaymentSuccess] orderNumber:", orderNumber);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.background}
      />

      <View style={styles.container}>
        <View
          style={[
            styles.iconOuter,
            { backgroundColor: theme.primaryLight },
          ]}
        >
          <View
            style={[
              styles.iconInner,
              { backgroundColor: theme.primary },
            ]}
          >
            <MaterialCommunityIcons
              name="check"
              size={32}
              color={theme.white}
            />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>
          {t("payment_success.title")}
        </Text>

        <Text style={[styles.subtitle, { color: theme.subText }]}>
          {t("payment_success.message")}
        </Text>

        <TouchableOpacity
          onPress={() => {
            if (!orderNumber) return;

            router.replace(
              `/trackorder/trackOrderScreen?orderId=${orderNumber}`
            );
          }}
          style={[
            styles.trackBtn,
            { backgroundColor: theme.primary },
            !orderNumber && styles.disabledButton,
          ]}
          activeOpacity={0.85}
          disabled={!orderNumber}
        >
          <Text style={[styles.trackBtnText, { color: theme.white }]}>
            {t("payment_success.track_order")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace("/")}
          activeOpacity={0.7}
        >
          <Text style={[styles.backText, { color: theme.primary }]}>
            {t("payment_success.back_home")}
          </Text>
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
  },
  iconOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 29,
    marginBottom: 10,
  },
  subtitle: {
    width: "100%",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  trackBtn: {
    minWidth: 190,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  trackBtnText: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
});