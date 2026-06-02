import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";

/* ─── Constants ─── */
const TEAL       = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#EFEFEA";
const GRAY_TEXT  = "#ABABAB";
const TEXT_DARK  = "#1A1A1A";
const TEXT_MID   = "#666666";
const GREEN      = "#2ECC71";

/* ─── Types ─── */
export type OrderStatus =
  | "placed"
  | "picked_up"
  | "processing"
  | "out_for_delivery"
  | "delivered";

interface TrackStep {
  icon: string;
  label: string;
  desc: string;
  time: string;
  isEst?: boolean;
  status: OrderStatus;
}

/* ─── Step definitions ─── */
const STEPS: TrackStep[] = [
  {
    icon: "package-variant",
    label: "Picked Up",
    desc: "Rider collected your clothes",
    time: "10:30 AM",
    status: "picked_up",
  },
  {
    icon: "tshirt-crew",
    label: "In Process",
    desc: "Your clothes are being washed",
    time: "11:00 AM",
    status: "processing",
  },
  {
    icon: "truck-delivery",
    label: "Out for Delivery",
    desc: "Rider is on the way",
    time: "Est. 4:30 PM",
    isEst: true,
    status: "out_for_delivery",
  },
  {
    icon: "check-circle-outline",
    label: "Delivered",
    desc: "Enjoy your fresh clothes!",
    time: "",
    status: "delivered",
  },
];

/* Maps OrderStatus → how many steps are "done" */
const STATUS_TO_STEP: Record<OrderStatus, number> = {
  placed: 0,
  picked_up: 1,
  processing: 2,
  out_for_delivery: 3,
  delivered: 4,
};

const STATUS_SEQUENCE: OrderStatus[] = [
  "placed",
  "picked_up",
  "processing",
  "out_for_delivery",
  "delivered",
];

/* ─── Progress bar labels ─── */
const PROGRESS_LABELS: Record<OrderStatus, string> = {
  placed: "Order placed",
  picked_up: "Rider picked up",
  processing: "Being cleaned",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered!",
};

/* ─── Radar / Live Tracking visual ─── */
function LiveTrackingBanner({ orderStatus }: { orderStatus: OrderStatus }) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  const delivered = orderStatus === "delivered";

  useEffect(() => {
    if (delivered) return;

    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = createPulse(pulse1, 0);
    const a2 = createPulse(pulse2, 900);
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [delivered]);

  const pulseStyle = (anim: Animated.Value) => ({
    position: "absolute" as const,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: delivered ? "#2ECC71" : TEAL,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] }),
      },
    ],
  });

  return (
    <View
      style={[
        styles.radarCard,
        delivered && { backgroundColor: "#E8F8EF" },
      ]}
    >
      <View style={styles.ring4} />
      <View style={styles.ring3} />
      <View style={styles.ring2} />
      <View style={styles.ring1} />

      {!delivered && (
        <>
          <Animated.View style={pulseStyle(pulse1)} />
          <Animated.View style={pulseStyle(pulse2)} />
        </>
      )}

      <View
        style={[
          styles.radarCenter,
          delivered && { backgroundColor: GREEN },
        ]}
      >
        <MaterialCommunityIcons
          name={delivered ? "check-circle" : "truck-delivery"}
          size={26}
          color="#fff"
        />
      </View>

      <Text
        style={[
          styles.radarLabel,
          delivered && { color: "#1A8A4A" },
        ]}
      >
        {delivered ? "Order Delivered!" : "Live Tracking"}
      </Text>
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

/* ─── Animated Progress Bar ─── */
function ProgressBar({ orderStatus }: { orderStatus: OrderStatus }) {
  const doneCount = STATUS_TO_STEP[orderStatus];
  const pct = (doneCount / STEPS.length) * 100;

  const animPct = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animPct, {
      toValue: pct,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = animPct.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressMeta}>
        <Text style={styles.progressLabel}>
          {PROGRESS_LABELS[orderStatus]}
        </Text>
        <Text style={styles.progressPct}>{Math.round(pct)}% complete</Text>
      </View>
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width }]} />
      </View>
    </View>
  );
}

/* ─── Timeline Step ─── */
function StepRow({
  step,
  done,
  isActive,
  isLast,
}: {
  step: TrackStep;
  done: boolean;
  isActive: boolean;
  isLast: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(done ? 1 : 0.85)).current;
  const fadeAnim  = useRef(new Animated.Value(done ? 1 : 0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: done ? 1 : 0.85,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: done ? 1 : 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [done]);

  return (
    <View style={styles.stepRow}>
      {/* Left: icon + line */}
      <View style={styles.stepLeft}>
        <Animated.View
          style={[
            styles.stepIconWrap,
            done ? styles.stepIconDone : styles.stepIconPending,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <MaterialCommunityIcons
            name={step.icon}
            size={18}
            color={done ? "#fff" : GRAY_TEXT}
          />
        </Animated.View>
        {!isLast && (
          <View
            style={[
              styles.stepLine,
              done ? styles.stepLineDone : styles.stepLinePending,
            ]}
          />
        )}
      </View>

      {/* Right: text */}
      <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
        <View style={styles.stepLabelRow}>
          <Text
            style={[
              styles.stepLabel,
              !done && styles.stepLabelPending,
            ]}
          >
            {step.label}
          </Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>In Progress</Text>
            </View>
          )}
          {done && !isActive && (
            <View style={styles.doneBadge}>
              <MaterialCommunityIcons name="check" size={10} color={TEAL} />
              <Text style={styles.doneBadgeText}>Done</Text>
            </View>
          )}
        </View>
        <Text style={styles.stepDesc}>{step.desc}</Text>
        {step.time !== "" && (
          <Text
            style={[
              styles.stepTime,
              step.isEst && !done && styles.stepTimeEst,
            ]}
          >
            {step.time}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}

/* ─── Main Screen ─── */
export default function TrackOrder() {
  // In production: derive from Redux or route params
  // e.g. const orderStatus = useAppSelector(selectOrderStatus);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("picked_up");

  const doneCount = STATUS_TO_STEP[orderStatus];

  // Dev helper: cycle through statuses
  const advanceStatus = () => {
    const idx = STATUS_SEQUENCE.indexOf(orderStatus);
    if (idx < STATUS_SEQUENCE.length - 1) {
      setOrderStatus(STATUS_SEQUENCE[idx + 1]);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
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
        <LiveTrackingBanner orderStatus={orderStatus} />

        {/* Rider Card */}
        <RiderCard />

        {/* Animated Progress Bar */}
        <ProgressBar orderStatus={orderStatus} />

        {/* Order Status */}
        <Text style={styles.sectionTitle}>Order Status</Text>

        <View style={styles.timelineCard}>
          {STEPS.map((step, idx) => {
            const done     = idx < doneCount;
            const isActive = idx === doneCount - 1;
            const isLast   = idx === STEPS.length - 1;
            return (
              <StepRow
                key={step.status}
                step={step}
                done={done}
                isActive={isActive}
                isLast={isLast}
              />
            );
          })}
        </View>

        {/* Delivery Address */}
        <View style={styles.addressCard}>
          <MaterialCommunityIcons
            name="map-marker"
            size={18}
            color={GRAY_TEXT}
          />
          <View>
            <Text style={styles.addressLabel}>Delivery Address</Text>
            <Text style={styles.addressValue}>123 Main Street, Mumbai</Text>
          </View>
        </View>

        {/* ── DEV ONLY: status simulator ── 
            Remove this block in production.
            Replace `orderStatus` state with:
              const orderStatus = useAppSelector(selectOrderStatus);
        */}
        {orderStatus !== "delivered" && (
          <TouchableOpacity
            style={styles.devBtn}
            onPress={advanceStatus}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={16}
              color="#fff"
            />
            <Text style={styles.devBtnText}>
              Simulate: Next Update →{" "}
              {STATUS_SEQUENCE[STATUS_SEQUENCE.indexOf(orderStatus) + 1]}
            </Text>
          </TouchableOpacity>
        )}
        {orderStatus === "delivered" && (
          <View style={styles.deliveredBanner}>
            <MaterialCommunityIcons
              name="check-circle"
              size={18}
              color={GREEN}
            />
            <Text style={styles.deliveredText}>
              Order successfully delivered!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Styles ─── */
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
  headerText: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: TEXT_DARK },
  headerSub: { fontSize: 12, color: GRAY_TEXT, marginTop: 2 },

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
    width: 280, height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: "rgba(26,107,90,0.08)",
  },
  ring3: {
    position: "absolute",
    width: 210, height: 210,
    borderRadius: 105,
    borderWidth: 1,
    borderColor: "rgba(26,107,90,0.10)",
  },
  ring2: {
    position: "absolute",
    width: 144, height: 144,
    borderRadius: 72,
    borderWidth: 1.5,
    borderColor: "rgba(26,107,90,0.13)",
  },
  ring1: {
    position: "absolute",
    width: 88, height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: "rgba(26,107,90,0.18)",
  },
  radarCenter: {
    width: 56, height: 56,
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
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  riderInitial: { color: "#fff", fontSize: 18, fontWeight: "800" },
  riderInfo: { flex: 1 },
  riderName: { fontSize: 14, fontWeight: "700", color: TEXT_DARK },
  riderRole: { fontSize: 12, color: GRAY_TEXT, marginTop: 2 },
  riderActions: { flexDirection: "row", gap: 8 },
  riderBtn: {
    width: 38, height: 38,
    borderRadius: 19,
    backgroundColor: TEAL_LIGHT,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ── Progress Bar ── */
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressLabel: { fontSize: 12, color: TEXT_MID, fontWeight: "500" },
  progressPct: { fontSize: 12, color: TEAL, fontWeight: "700" },
  progressTrack: {
    height: 6,
    backgroundColor: TEAL_LIGHT,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: TEAL,
    borderRadius: 99,
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
  stepRow: { flexDirection: "row", minHeight: 64 },
  stepLeft: { width: 44, alignItems: "center" },
  stepIconWrap: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  stepIconDone: { backgroundColor: TEAL },
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
  stepLineDone: { backgroundColor: TEAL },
  stepLinePending: { backgroundColor: "#E0E0DA" },
  stepContent: {
    flex: 1,
    paddingLeft: 12,
    paddingBottom: 16,
  },
  stepLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  stepDesc: { fontSize: 12, color: TEXT_MID, marginTop: 2 },
  stepTime: {
    fontSize: 12,
    color: GRAY_TEXT,
    marginTop: 3,
    fontWeight: "500",
  },
  stepTimeEst: { color: TEAL, fontWeight: "600" },

  /* Badges */
  activeBadge: {
    backgroundColor: "#FFF4E0",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#B07B00",
  },
  doneBadge: {
    backgroundColor: TEAL_LIGHT,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  doneBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: TEAL,
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
  addressLabel: { fontSize: 12, color: GRAY_TEXT, fontWeight: "500" },
  addressValue: {
    fontSize: 14,
    fontWeight: "600",
    color: TEXT_DARK,
    marginTop: 2,
  },

  /* ── Dev simulator ── */
  devBtn: {
    backgroundColor: TEAL,
    borderRadius: 30,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  devBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  deliveredBanner: {
    backgroundColor: "#E8F8EF",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  deliveredText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A8A4A",
  },
});