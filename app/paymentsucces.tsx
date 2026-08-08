import { router } from "expo-router";
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

/* ─── Constants ─── */
const TEAL       = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#EFEFEA";
const GRAY_TEXT  = "#ABABAB";
const TEXT_DARK  = "#1A1A1A";
const TEXT_MID   = "#666666";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

      <View style={styles.container}>
        {/* ── Icon ── */}
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <MaterialCommunityIcons name="check" size={32} color="#fff" />
          </View>
        </View>

        {/* ── Text ── */}
        <Text style={styles.title}>{t("payment_success.title")}</Text>
        <Text style={styles.subtitle}>
          {t("payment_success.subtitle")}
        </Text>

        {/* ── Track Order Button ── */}
        <TouchableOpacity onPress={()=>router.push('/trackorder/trackorder')} style={styles.trackBtn} activeOpacity={0.85}>
          <Text style={styles.trackBtnText}>{t("payment_success.track_order")}</Text>
        </TouchableOpacity>

        {/* ── Back to Home ── */}
        <TouchableOpacity onPress={()=>router.push('/')} activeOpacity={0.7}>
          <Text style={styles.backText}>{t("payment_success.back_home")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GRAY_LIGHT,
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
    backgroundColor: TEAL_LIGHT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  iconInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Text */
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT_DARK,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: TEXT_MID,
    textAlign: "center",
    lineHeight: 22,
  },

  /* Track button */
  trackBtn: {
    backgroundColor: TEAL,
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 48,
    marginTop: 8,
    shadowColor: TEAL,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  trackBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  /* Back to Home */
  backText: {
    fontSize: 14,
    color: TEAL,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});