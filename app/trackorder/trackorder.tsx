import { router } from "expo-router";
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
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

/* ─── Constants ─── */
const TEAL       = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#EFEFEA";
const GRAY_TEXT  = "#ABABAB";
const TEXT_DARK  = "#1A1A1A";
const TEXT_MID   = "#666666";

/* ─── Tracking Steps ─── */
interface TrackStep {
  icon: string;
  label: string;
  desc: string;
  time: string;
  done: boolean;
  isEst?: boolean;
}

const STEPS: TrackStep[] = [
  {
    icon: "package-variant",
    label: "Picked Up",
    desc: "Rider collected your clothes",
    time: "10:30 AM",
    done: true,
  },
  {
    icon: "tshirt-crew",
    label: "In Process",
    desc: "Your clothes are being washed",
    time: "11:00 AM",
    done: true,
  },
  {
    icon: "truck-delivery",
    label: "Out for Delivery",
    desc: "Rider is on the way",
    time: "Est. 4:30 PM",
    done: false,
    isEst: true,
  },
  {
    icon: "check-circle-outline",
    label: "Delivered",
    desc: "Enjoy your fresh clothes!",
    time: "",
    done: false,
  },
];

/* ─── Radar / Live Tracking visual ─── */
function LiveTrackingBanner() {
  return (
    <View style={styles.radarCard}>
      {/* Concentric rings */}
      <View style={styles.ring4} />
      <View style={styles.ring3} />
      <View style={styles.ring2} />
      <View style={styles.ring1} />
      {/* Center icon */}
      <View style={styles.radarCenter}>
        <MaterialCommunityIcons name="truck-delivery" size={26} color="#fff" />
      </View>
      <Text style={styles.radarLabel}>Live Tracking</Text>
    </View>
  );
}

/* ─── Rider Card ─── */
function RiderCard() {
  return (
    <View style={styles.riderCard}>
      <View style={styles.riderAvatar}>
        <Text style={styles.riderInitial}>R</Text>
      </View>
      <View style={styles.riderInfo}>
        <Text style={styles.riderName}>Rahul Kumar</Text>
        <Text style={styles.riderRole}>Your delivery rider</Text>
      </View>
      <View style={styles.riderActions}>
        <TouchableOpacity style={styles.riderBtn}>
          <MaterialCommunityIcons name="phone" size={18} color={TEAL} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.riderBtn}>
          <MaterialCommunityIcons name="map-marker" size={18} color={TEAL} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── Main Screen ─── */
export default function TrackOrder() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Order #KR-2847</Text>
          <Text style={styles.headerSub}>Wash + Iron • 8 items</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Tracking Banner */}
        <LiveTrackingBanner />

        {/* Rider Card */}
        <RiderCard />

        {/* Order Status */}
        <Text style={styles.sectionTitle}>Order Status</Text>

        <View style={styles.timelineCard}>
          {STEPS.map((step, idx) => {
            const isLast = idx === STEPS.length - 1;
            return (
              <View key={idx} style={styles.stepRow}>
                {/* Left: icon + line */}
                <View style={styles.stepLeft}>
                  <View style={[
                    styles.stepIconWrap,
                    step.done ? styles.stepIconDone : styles.stepIconPending,
                  ]}>
                    <MaterialCommunityIcons
                      name={step.icon}
                      size={18}
                      color={step.done ? "#fff" : GRAY_TEXT}
                    />
                  </View>
                  {!isLast && (
                    <View style={[
                      styles.stepLine,
                      step.done ? styles.stepLineDone : styles.stepLinePending,
                    ]} />
                  )}
                </View>

                {/* Right: text */}
                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepLabel,
                    !step.done && styles.stepLabelPending,
                  ]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                  {step.time !== "" && (
                    <Text style={[
                      styles.stepTime,
                      step.isEst && styles.stepTimeEst,
                    ]}>
                      {step.time}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Delivery Address */}
        <View style={styles.addressCard}>
          <MaterialCommunityIcons name="map-marker" size={18} color={GRAY_TEXT} />
          <View>
            <Text style={styles.addressLabel}>Delivery Address</Text>
            <Text style={styles.addressValue}>123 Main Street, Mumbai</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: GRAY_LIGHT,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  headerText: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT_DARK,
  },
  headerSub: {
    fontSize: 12,
    color: GRAY_TEXT,
    marginTop: 2,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },

  /* ── Radar Banner ── */
  radarCard: {
    height: 180,
    backgroundColor: TEAL_LIGHT,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  ring4: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: "rgba(26,107,90,0.08)",
  },
  ring3: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: "rgba(26,107,90,0.10)",
  },
  ring2: {
    position: "absolute",
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 1.5,
    borderColor: "rgba(26,107,90,0.13)",
  },
  ring1: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: "rgba(26,107,90,0.18)",
  },
  radarCenter: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: TEAL,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  radarLabel: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: "600",
    color: TEAL,
  },

  /* ── Rider Card ── */
  riderCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  riderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  riderInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_DARK,
  },
  riderRole: {
    fontSize: 12,
    color: GRAY_TEXT,
    marginTop: 2,
  },
  riderActions: {
    flexDirection: "row",
    gap: 8,
  },
  riderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: TEAL_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Section title */
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT_DARK,
    marginTop: 4,
  },

  /* ── Timeline ── */
  timelineCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stepRow: {
    flexDirection: "row",
    minHeight: 64,
  },
  stepLeft: {
    width: 44,
    alignItems: "center",
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  stepIconDone: {
    backgroundColor: TEAL,
  },
  stepIconPending: {
    backgroundColor: "#F0F0EA",
    borderWidth: 1.5,
    borderColor: "#DDD",
  },
  stepLine: {
    width: 2,
    flex: 1,
    marginTop: 2,
    marginBottom: -2,
  },
  stepLineDone: {
    backgroundColor: TEAL,
  },
  stepLinePending: {
    backgroundColor: "#E0E0DA",
  },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_DARK,
  },
  stepLabelPending: {
    color: GRAY_TEXT,
    fontWeight: "500",
  },
  stepDesc: {
    fontSize: 12,
    color: TEXT_MID,
    marginTop: 2,
  },
  stepTime: {
    fontSize: 12,
    color: GRAY_TEXT,
    marginTop: 3,
    fontWeight: "500",
  },
  stepTimeEst: {
    color: TEAL,
    fontWeight: "600",
  },

  /* ── Address Card ── */
  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addressLabel: {
    fontSize: 12,
    color: GRAY_TEXT,
    fontWeight: "500",
  },
  addressValue: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_DARK,
    marginTop: 2,
  },
});