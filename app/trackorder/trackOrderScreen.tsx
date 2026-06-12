import { useEffect, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  StatusBar, Animated, Easing, ActivityIndicator, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../src/theme/ThemeProvider";
import AppBackground from "@/components/AppBackground";

import { useOrderTracking } from "../../hooks/useOrderTracking";
import {
  type LiveTrackingStep,
  type LiveRider,
} from "../../src/services/socketService";
import { type OrderStatus } from "../../src/services/orderService";

/* ─── STATUS helpers ─── */
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending_sp: "Order Placed",
  sp_assigned: "SP Assigned",
  sp_accepted: "SP Accepted",
  rider_pickup_assigned: "Rider Assigned for Pickup",
  picked_up: "Order Picked Up",
  at_sp: "At Service Provider",
  cleaned: "Cleaned",
  rider_delivery_assigned: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const UI_STEPS: OrderStatus[] = ["picked_up", "at_sp", "rider_delivery_assigned", "delivered"];

function statusToProgress(status: OrderStatus): number {
  if (status === "cancelled") return 0;
  const idx = UI_STEPS.indexOf(status);
  return idx === -1 ? 5 : ((idx + 1) / UI_STEPS.length) * 100;
}

const PROGRESS_LABEL: Partial<Record<OrderStatus, string>> = {
  pending_sp: "Order placed",
  sp_assigned: "SP assigned",
  sp_accepted: "SP accepted",
  rider_pickup_assigned: "Rider heading to you",
  picked_up: "Rider picked up",
  at_sp: "Being cleaned",
  cleaned: "Cleaning done",
  rider_delivery_assigned: "Out for delivery",
  delivered: "Delivered! 🎉",
  cancelled: "Cancelled",
};

/* ════════════════════════════════════════════════
   CONN BADGE
════════════════════════════════════════════════ */
function ConnBadge({ status }: { status: string }) {
  if (status === "connected") return null;
  const dot = status === "connecting" ? "#F59E0B" : "#E53935";
  const label = status === "connecting" ? "Connecting…" : "Reconnecting…";
  return (
    <View style={connBadgeStyles.connBadge}>
      <View style={[connBadgeStyles.connDot, { backgroundColor: dot }]} />
      <Text style={connBadgeStyles.connText}>{label}</Text>
    </View>
  );
}
const connBadgeStyles = StyleSheet.create({
  connBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "center", marginBottom: 4,
    backgroundColor: "#FFF9E6", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  connDot: { width: 7, height: 7, borderRadius: 4 },
  connText: { fontSize: 12, fontWeight: "600", color: "#92600A" },
});

/* ════════════════════════════════════════════════
   LIVE MAP — Swiggy-style card
════════════════════════════════════════════════ */
function LiveMap({ riderLat, riderLng, destLat, destLng, theme }: {
  riderLat?: number; riderLng?: number;
  destLat?: number; destLng?: number;
  theme: any;
}) {
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const prevCoord = useRef<{ latitude: number; longitude: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const hasRider = riderLat != null && riderLng != null;
  const hasDest = destLat != null && destLng != null;
  const riderCoord = hasRider ? { latitude: riderLat!, longitude: riderLng! } : null;
  const destCoord = hasDest ? { latitude: destLat!, longitude: destLng! } : null;

  // Pulse loop
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.8, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // Camera follow on rider move
  useEffect(() => {
    if (!riderCoord || !mapReady) return;
    const isFirstFix = prevCoord.current === null;
    prevCoord.current = riderCoord;
    if (isFirstFix && destCoord) {
      mapRef.current?.fitToCoordinates([riderCoord, destCoord], {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    } else {
      mapRef.current?.animateCamera({ center: riderCoord, zoom: 15 }, { duration: 800 });
    }
  }, [riderLat, riderLng, mapReady]);

  // Re-fit on expand/collapse
  useEffect(() => {
    if (!mapReady || !riderCoord) return;
    const coords = [riderCoord, ...(destCoord ? [destCoord] : [])];
    setTimeout(() => {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }, 350);
  }, [expanded]);

  const s = getLiveMapStyles(theme);
  const mapHeight = expanded ? 360 : 220;

  return (
    <View style={[s.mapCard, { height: mapHeight }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        onMapReady={() => setMapReady(true)}
        initialRegion={
          riderCoord
            ? { ...riderCoord, latitudeDelta: 0.02, longitudeDelta: 0.02 }
            : destCoord
              ? { ...destCoord, latitudeDelta: 0.02, longitudeDelta: 0.02 }
              : { latitude: 18.5204, longitude: 73.8567, latitudeDelta: 0.05, longitudeDelta: 0.05 }
        }
        scrollEnabled={expanded}
        zoomEnabled={expanded}
        pitchEnabled={false}
        rotateEnabled={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {/* Rider marker with pulse */}
        {riderCoord && (
          <Marker coordinate={riderCoord} anchor={{ x: 0.5, y: 0.5 }} flat tracksViewChanges>
            <View style={s.riderMarkerWrap}>
              <Animated.View style={[
                s.riderPulse,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseAnim.interpolate({ inputRange: [1, 1.8], outputRange: [0.5, 0] }),
                }
              ]} />
              <View style={s.riderMarker}>
                <MaterialCommunityIcons name="motorbike" size={18} color="#fff" />
              </View>
            </View>
          </Marker>
        )}

        {/* Destination marker */}
        {destCoord && (
          <Marker coordinate={destCoord} anchor={{ x: 0.5, y: 1 }}>
            <View style={s.destPinWrap}>
              <View style={s.destPin}>
                <MaterialCommunityIcons name="home" size={16} color="#fff" />
              </View>
              <View style={[s.destPinTail, { borderTopColor: theme.primary }]} />
            </View>
          </Marker>
        )}

        {/* Dashed line */}
        {riderCoord && destCoord && (
          <Polyline
            coordinates={[riderCoord, destCoord]}
            strokeColor={theme.primary}
            strokeWidth={2.5}
            lineDashPattern={[6, 5]}
            geodesic
          />
        )}
      </MapView>

      {/* LIVE badge */}
      <View style={s.liveBadge}>
        <View style={s.liveDot} />
        <Text style={s.liveText}>LIVE</Text>
      </View>

      {/* Locating overlay */}
      {!hasRider && (
        <View style={s.waitingOverlay}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[s.waitingText, { color: theme.subText }]}>Locating rider…</Text>
        </View>
      )}

      {/* Expand toggle */}
      <TouchableOpacity
        style={[s.expandBtn, { backgroundColor: theme.card }]}
        onPress={() => setExpanded(e => !e)}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name={expanded ? "arrow-collapse" : "arrow-expand"}
          size={16}
          color={theme.primary}
        />
      </TouchableOpacity>
    </View>
  );
}

const getLiveMapStyles = (theme: any) => StyleSheet.create({
  mapCard: {
    borderRadius: 20, overflow: "hidden", position: "relative",
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  riderMarkerWrap: { alignItems: "center", justifyContent: "center", width: 54, height: 54 },
  riderPulse: {
    position: "absolute", width: 54, height: 54, borderRadius: 27,
    backgroundColor: theme.primary,
  },
  riderMarker: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2.5, borderColor: "#fff",
    elevation: 6, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 6,
  },
  destPinWrap: { alignItems: "center" },
  destPin: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: theme.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff", elevation: 4,
  },
  destPinTail: {
    width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
    borderLeftColor: "transparent", borderRightColor: "transparent",
    marginTop: -1,
  },
  liveBadge: {
    position: "absolute", top: 12, left: 12,
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#2ECC71" },
  liveText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  expandBtn: {
    position: "absolute", top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    elevation: 4, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 4,
  },
  waitingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 8,
  },
  waitingText: { fontSize: 13, fontWeight: "600" },
});

/* ════════════════════════════════════════════════
   RADAR BANNER
════════════════════════════════════════════════ */
function RadarBanner({ status, statusChanged, theme }: {
  status: OrderStatus; statusChanged: boolean; theme: any;
}) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;
  const delivered = status === "delivered";
  const s = getRadarStyles(theme);

  useEffect(() => {
    if (delivered) return;
    const make = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]));
    const a1 = make(pulse1, 0); const a2 = make(pulse2, 900);
    a1.start(); a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [delivered]);

  useEffect(() => {
    if (!statusChanged) return;
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1,   duration: 150, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 1,   duration: 150, useNativeDriver: true }),
    ]).start();
  }, [statusChanged]);

  const pulseStyle = (anim: Animated.Value) => ({
    position: "absolute" as const, width: 56, height: 56, borderRadius: 28,
    borderWidth: 1.5, borderColor: delivered ? "#2ECC71" : theme.primary,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] }) }],
  });

  return (
    <Animated.View style={[s.radarCard, delivered && { backgroundColor: "#E8F8EF" }, { opacity: flashAnim }]}>
      <View style={s.ring4} /><View style={s.ring3} />
      <View style={s.ring2} /><View style={s.ring1} />
      {!delivered && (
        <><Animated.View style={pulseStyle(pulse1)} /><Animated.View style={pulseStyle(pulse2)} /></>
      )}
      <View style={[s.radarCenter, delivered && { backgroundColor: "#2ECC71" }]}>
        <MaterialCommunityIcons name={delivered ? "check-circle" : "truck-delivery"} size={26} color="#fff" />
      </View>
      <Text style={[s.radarLabel, delivered && { color: "#1A8A4A" }]}>
        {delivered ? "Order Delivered!" : STATUS_LABEL[status] ?? "Live Tracking"}
      </Text>
    </Animated.View>
  );
}
const getRadarStyles = (theme: any) => StyleSheet.create({
  radarCard: {
    height: 180, backgroundColor: theme.primaryLight, borderRadius: 20,
    alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative",
  },
  ring4: { position: "absolute", width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: "rgba(26,107,90,0.08)" },
  ring3: { position: "absolute", width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: "rgba(26,107,90,0.10)" },
  ring2: { position: "absolute", width: 144, height: 144, borderRadius: 72, borderWidth: 1.5, borderColor: "rgba(26,107,90,0.13)" },
  ring1: { position: "absolute", width: 88, height: 88, borderRadius: 44, borderWidth: 1.5, borderColor: "rgba(26,107,90,0.18)" },
  radarCenter: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: theme.primary,
    alignItems: "center", justifyContent: "center",
    elevation: 4, shadowColor: theme.primary, shadowOpacity: 0.3, shadowRadius: 8,
  },
  radarLabel: { marginTop: 12, fontSize: 13, fontWeight: "600", color: theme.primary },
});

/* ════════════════════════════════════════════════
   RIDER CARD
════════════════════════════════════════════════ */
function RiderCard({ rider, role, theme }: { rider: LiveRider; role: "pickup" | "delivery"; theme: any }) {
  const s = getRiderCardStyles(theme);
  return (
    <View style={s.riderCard}>
      <View style={s.riderAvatar}>
        <Text style={s.riderInitial}>{rider.name?.[0]?.toUpperCase() ?? "R"}</Text>
      </View>
      <View style={s.riderInfo}>
        <Text style={s.riderName}>{rider.name}</Text>
        <Text style={s.riderRole}>{role === "delivery" ? "Delivery rider" : "Pickup rider"}</Text>
      </View>
      <View style={s.riderActions}>
        {rider.phone && (
          <TouchableOpacity style={s.riderBtn} onPress={() => Linking.openURL(`tel:${rider.phone}`)}>
            <MaterialCommunityIcons name="phone" size={18} color={theme.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
const getRiderCardStyles = (theme: any) => StyleSheet.create({
  riderCard: {
    backgroundColor: theme.card, borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  riderAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.primary,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  riderInitial: { color: "#fff", fontSize: 18, fontWeight: "800" },
  riderInfo: { flex: 1 },
  riderName: { fontSize: 14, fontWeight: "700", color: theme.text },
  riderRole: { fontSize: 12, color: theme.subText, marginTop: 2 },
  riderActions: { flexDirection: "row", gap: 8 },
  riderBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: theme.primaryLight,
    alignItems: "center", justifyContent: "center",
  },
});

/* ════════════════════════════════════════════════
   PROGRESS BAR
════════════════════════════════════════════════ */
function ProgressBar({ status, theme }: { status: OrderStatus; theme: any }) {
  const pct = statusToProgress(status);
  const animPct = useRef(new Animated.Value(0)).current;
  const s = getProgressStyles(theme);

  useEffect(() => {
    Animated.timing(animPct, {
      toValue: pct, duration: 600,
      easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [pct]);

  const width = animPct.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

  return (
    <View style={s.progressCard}>
      <View style={s.progressMeta}>
        <Text style={s.progressLabel}>{PROGRESS_LABEL[status] ?? STATUS_LABEL[status]}</Text>
        <Text style={s.progressPct}>{Math.round(pct)}%</Text>
      </View>
      <View style={s.progressTrack}>
        <Animated.View style={[s.progressFill, { width }]} />
      </View>
    </View>
  );
}
const getProgressStyles = (theme: any) => StyleSheet.create({
  progressCard: {
    backgroundColor: theme.card, borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  progressMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 12, color: theme.subText, fontWeight: "500" },
  progressPct: { fontSize: 12, color: theme.primary, fontWeight: "700" },
  progressTrack: { height: 6, backgroundColor: theme.primaryLight, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: theme.primary, borderRadius: 99 },
});

/* ════════════════════════════════════════════════
   TIMELINE STEP
════════════════════════════════════════════════ */
function StepRow({ step, isActive, isLast, theme }: {
  step: LiveTrackingStep; isActive: boolean; isLast: boolean; theme: any;
}) {
  const scaleAnim = useRef(new Animated.Value(step.completed ? 1 : 0.85)).current;
  const fadeAnim  = useRef(new Animated.Value(step.completed ? 1 : 0.45)).current;
  const s = getStepStyles(theme);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: step.completed ? 1 : 0.85, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: step.completed ? 1 : 0.45, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [step.completed]);

  return (
    <View style={s.stepRow}>
      <View style={s.stepLeft}>
        <Animated.View style={[
          s.stepIconWrap,
          step.completed ? s.stepIconDone : s.stepIconPending,
          { transform: [{ scale: scaleAnim }] },
        ]}>
          <MaterialCommunityIcons
            name={step.icon} size={18}
            color={step.completed ? "#fff" : theme.subText}
          />
        </Animated.View>
        {!isLast && (
          <View style={[s.stepLine, step.completed ? s.stepLineDone : s.stepLinePending]} />
        )}
      </View>

      <Animated.View style={[s.stepContent, { opacity: fadeAnim }]}>
        <View style={s.stepLabelRow}>
          <Text style={[s.stepLabel, !step.completed && s.stepLabelPending]}>{step.label}</Text>
          {isActive && (
            <View style={s.activeBadge}>
              <Text style={s.activeBadgeText}>In Progress</Text>
            </View>
          )}
          {step.completed && !isActive && (
            <View style={s.doneBadge}>
              <MaterialCommunityIcons name="check" size={10} color={theme.primary} />
              <Text style={s.doneBadgeText}>Done</Text>
            </View>
          )}
        </View>
        {!!step.time && (
          <Text style={[s.stepTime, step.isEst && !step.completed && s.stepTimeEst]}>
            {step.time}
          </Text>
        )}
      </Animated.View>
    </View>
  );
}
const getStepStyles = (theme: any) => StyleSheet.create({
  stepRow: { flexDirection: "row", minHeight: 64 },
  stepLeft: { width: 44, alignItems: "center" },
  stepIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", zIndex: 1 },
  stepIconDone: { backgroundColor: theme.primary },
  stepIconPending: { backgroundColor: theme.background, borderWidth: 1.5, borderColor: theme.border },
  stepLine: { width: 2, flex: 1, marginTop: 2, marginBottom: -2 },
  stepLineDone: { backgroundColor: theme.primary },
  stepLinePending: { backgroundColor: theme.border },
  stepContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  stepLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepLabel: { fontSize: 14, fontWeight: "700", color: theme.text },
  stepLabelPending: { color: theme.subText, fontWeight: "500" },
  stepTime: { fontSize: 12, color: theme.subText, marginTop: 3, fontWeight: "500" },
  stepTimeEst: { color: theme.primary, fontWeight: "600" },
  activeBadge: { backgroundColor: "#FFF4E0", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  activeBadgeText: { fontSize: 10, fontWeight: "700", color: "#B07B00" },
  doneBadge: {
    backgroundColor: theme.primaryLight, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    flexDirection: "row", alignItems: "center", gap: 3,
  },
  doneBadgeText: { fontSize: 10, fontWeight: "700", color: theme.primary },
});

/* ════════════════════════════════════════════════
   MAIN SCREEN
════════════════════════════════════════════════ */
export default function TrackOrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { theme, isDarkMode } = useTheme();
  const styles = getStyles(theme);

  const { orderState, riderLocation, connStatus, statusChanged, reconnect } =
    useOrderTracking(orderId ?? null);

  /* Loading */
  if (!orderState && connStatus === "connecting") {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.subText }]}>
          Connecting to live tracking…
        </Text>
      </SafeAreaView>
    );
  }

  /* Error */
  if (!orderState) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: theme.background }]}>
        <MaterialCommunityIcons name="wifi-off" size={48} color={theme.subText} />
        <Text style={[styles.errorText, { color: theme.subText }]}>
          Could not load order.{"\n"}Check your connection.
        </Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: theme.primary }]} onPress={reconnect}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const {
    status, trackingSteps, riderPickup, riderDelivery,
    deliveryAddress, estimatedDelivery,
  } = orderState;

  const activeIdx    = [...trackingSteps].map(s => s.completed).lastIndexOf(true);
  const visibleRider = riderDelivery ?? riderPickup;
  const riderRole    = riderDelivery ? "delivery" : "pickup";
  const showMap      = riderLocation != null && status !== "delivered" && status !== "cancelled";
  const [destLng, destLat] = deliveryAddress?.coordinates ?? [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <AppBackground>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: theme.card }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Order #{orderState.orderNumber}
            </Text>
            <Text style={[styles.headerSub, { color: theme.subText }]}>
              {orderState.statusLabel}
            </Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        <ConnBadge status={connStatus} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {showMap ? (
            <LiveMap
              riderLat={riderLocation!.lat}
              riderLng={riderLocation!.lng}
              destLat={destLat}
              destLng={destLng}
              theme={theme}
            />
          ) : (
            <RadarBanner status={status} statusChanged={statusChanged} theme={theme} />
          )}

          {visibleRider && (
            <RiderCard rider={visibleRider} role={riderRole} theme={theme} />
          )}

          <ProgressBar status={status} theme={theme} />

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Status</Text>
          <View style={[styles.timelineCard, { backgroundColor: theme.card }]}>
            {trackingSteps.map((step, idx) => (
              <StepRow
                key={step.status}
                step={step}
                isActive={idx === activeIdx}
                isLast={idx === trackingSteps.length - 1}
                theme={theme}
              />
            ))}
          </View>

          <View style={[styles.addressCard, { backgroundColor: theme.card }]}>
            <MaterialCommunityIcons name="map-marker" size={18} color={theme.subText} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.addressLabel, { color: theme.subText }]}>Delivery Address</Text>
              <Text style={[styles.addressValue, { color: theme.text }]}>
                {deliveryAddress?.address ?? "—"}
              </Text>
            </View>
          </View>

          {estimatedDelivery && status !== "delivered" && (
            <View style={[styles.estCard, { backgroundColor: theme.primaryLight }]}>
              <MaterialCommunityIcons name="clock-outline" size={18} color={theme.primary} />
              <View>
                <Text style={[styles.estLabel, { color: theme.subText }]}>Estimated Delivery</Text>
                <Text style={[styles.estValue, { color: theme.primary }]}>
                  {new Date(estimatedDelivery).toLocaleTimeString("en-IN", {
                    hour: "2-digit", minute: "2-digit", hour12: true,
                  })}
                </Text>
              </View>
            </View>
          )}

          {status === "delivered" && (
            <View style={styles.deliveredBanner}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#2ECC71" />
              <Text style={styles.deliveredText}>Order successfully delivered!</Text>
            </View>
          )}

          {status === "cancelled" && (
            <View style={[styles.deliveredBanner, { backgroundColor: "#FDECEA" }]}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#E53935" />
              <Text style={[styles.deliveredText, { color: "#C62828" }]}>
                This order was cancelled.
              </Text>
            </View>
          )}
        </ScrollView>
      </AppBackground>
    </SafeAreaView>
  );
}

/* ════════════════════════════════════════════════
   GLOBAL STYLES
════════════════════════════════════════════════ */
const getStyles = (theme: any) => StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14 },
  errorText: { fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  retryBtn: { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4,
  },
  headerText: { alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 2 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  timelineCard: {
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  addressCard: {
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  addressLabel: { fontSize: 12, fontWeight: "500" },
  addressValue: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  estCard: {
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  estLabel: { fontSize: 12, fontWeight: "500" },
  estValue: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  deliveredBanner: {
    backgroundColor: "#E8F8EF", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4,
  },
  deliveredText: { fontSize: 14, fontWeight: "600", color: "#1A8A4A" },
});