// src/screens/TrackOrderScreen.tsx
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

import { useOrderTracking } from "../../hooks/useOrderTracking";

// ↓ Import ONLY from socketService — these don't exist in orderService
import {
    type LiveTrackingStep,
    type LiveRider,
    type OrderSocketPayload,
} from "../../src/services/socketService";

// ↓ OrderStatus is the one shared type that IS in orderService
import { type OrderStatus } from "../../src/services/orderService";

/* ─── STATUS helpers (moved here — not exported by orderService) ─── */
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

/* ─── Design tokens ─── */
const TEAL = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#EFEFEA";
const GRAY_TEXT = "#ABABAB";
const TEXT_DARK = "#1A1A1A";
const TEXT_MID = "#666666";
const GREEN = "#2ECC71";
const RED = "#E53935";

/* ─── Progress ─── */
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
    const dot = status === "connecting" ? "#F59E0B" : RED;
    const label = status === "connecting" ? "Connecting…" : "Reconnecting…";
    return (
        <View style={styles.connBadge}>
            <View style={[styles.connDot, { backgroundColor: dot }]} />
            <Text style={styles.connText}>{label}</Text>
        </View>
    );
}

/* ════════════════════════════════════════════════
   LIVE MAP
════════════════════════════════════════════════ */
function LiveMap({ riderLat, riderLng, destLat, destLng }: {
    riderLat?: number; riderLng?: number;
    destLat?: number; destLng?: number;
}) {
    const hasRider = riderLat != null && riderLng != null;
    const hasDest = destLat != null && destLng != null;
    const initialRegion = hasRider
        ? { latitude: riderLat!, longitude: riderLng!, latitudeDelta: 0.02, longitudeDelta: 0.02 }
        : hasDest
            ? { latitude: destLat!, longitude: destLng!, latitudeDelta: 0.02, longitudeDelta: 0.02 }
            : { latitude: 18.5204, longitude: 73.8567, latitudeDelta: 0.05, longitudeDelta: 0.05 };

    return (
        <View style={styles.mapCard}>
            <MapView style={styles.map} provider={PROVIDER_GOOGLE} initialRegion={initialRegion}
                scrollEnabled={false} zoomEnabled={false} pitchEnabled={false} rotateEnabled={false}>
                {hasRider && (
                    <Marker coordinate={{ latitude: riderLat!, longitude: riderLng! }} anchor={{ x: 0.5, y: 0.5 }}>
                        <View style={styles.riderMarker}>
                            <MaterialCommunityIcons name="motorbike" size={18} color="#fff" />
                        </View>
                    </Marker>
                )}
                {hasDest && (
                    <Marker coordinate={{ latitude: destLat!, longitude: destLng! }}>
                        <View style={styles.destMarker}>
                            <MaterialCommunityIcons name="map-marker" size={22} color={TEAL} />
                        </View>
                    </Marker>
                )}
                {hasRider && hasDest && (
                    <Polyline
                        coordinates={[
                            { latitude: riderLat!, longitude: riderLng! },
                            { latitude: destLat!, longitude: destLng! },
                        ]}
                        strokeColor={TEAL} strokeWidth={2} lineDashPattern={[6, 4]}
                    />
                )}
            </MapView>
            <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
            </View>
        </View>
    );
}

/* ════════════════════════════════════════════════
   RADAR BANNER
════════════════════════════════════════════════ */
function RadarBanner({ status, statusChanged }: { status: OrderStatus; statusChanged: boolean }) {
    const pulse1 = useRef(new Animated.Value(0)).current;
    const pulse2 = useRef(new Animated.Value(0)).current;
    const flashAnim = useRef(new Animated.Value(1)).current;
    const delivered = status === "delivered";

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
            Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 0.3, duration: 150, useNativeDriver: true }),
            Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
    }, [statusChanged]);

    const pulseStyle = (anim: Animated.Value) => ({
        position: "absolute" as const, width: 56, height: 56, borderRadius: 28,
        borderWidth: 1.5, borderColor: delivered ? GREEN : TEAL,
        opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
        transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3.5] }) }],
    });

    return (
        <Animated.View style={[styles.radarCard, delivered && { backgroundColor: "#E8F8EF" }, { opacity: flashAnim }]}>
            <View style={styles.ring4} /><View style={styles.ring3} />
            <View style={styles.ring2} /><View style={styles.ring1} />
            {!delivered && (<><Animated.View style={pulseStyle(pulse1)} /><Animated.View style={pulseStyle(pulse2)} /></>)}
            <View style={[styles.radarCenter, delivered && { backgroundColor: GREEN }]}>
                <MaterialCommunityIcons name={delivered ? "check-circle" : "truck-delivery"} size={26} color="#fff" />
            </View>
            <Text style={[styles.radarLabel, delivered && { color: "#1A8A4A" }]}>
                {delivered ? "Order Delivered!" : STATUS_LABEL[status] ?? "Live Tracking"}
            </Text>
        </Animated.View>
    );
}

/* ════════════════════════════════════════════════
   RIDER CARD  — uses LiveRider from socketService
════════════════════════════════════════════════ */
function RiderCard({ rider, role }: { rider: LiveRider; role: "pickup" | "delivery" }) {
    return (
        <View style={styles.riderCard}>
            <View style={styles.riderAvatar}>
                <Text style={styles.riderInitial}>{rider.name?.[0]?.toUpperCase() ?? "R"}</Text>
            </View>
            <View style={styles.riderInfo}>
                <Text style={styles.riderName}>{rider.name}</Text>
                <Text style={styles.riderRole}>{role === "delivery" ? "Delivery rider" : "Pickup rider"}</Text>
            </View>
            <View style={styles.riderActions}>
                {rider.phone && (
                    <TouchableOpacity style={styles.riderBtn} onPress={() => Linking.openURL(`tel:${rider.phone}`)}>
                        <MaterialCommunityIcons name="phone" size={18} color={TEAL} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

/* ════════════════════════════════════════════════
   PROGRESS BAR
════════════════════════════════════════════════ */
function ProgressBar({ status }: { status: OrderStatus }) {
    const pct = statusToProgress(status);
    const animPct = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animPct, { toValue: pct, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    }, [pct]);

    const width = animPct.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });

    return (
        <View style={styles.progressCard}>
            <View style={styles.progressMeta}>
                <Text style={styles.progressLabel}>{PROGRESS_LABEL[status] ?? STATUS_LABEL[status]}</Text>
                <Text style={styles.progressPct}>{Math.round(pct)}%</Text>
            </View>
            <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width }]} />
            </View>
        </View>
    );
}

/* ════════════════════════════════════════════════
   TIMELINE STEP  — uses LiveTrackingStep from socketService
════════════════════════════════════════════════ */
function StepRow({ step, isActive, isLast }: {
    step: LiveTrackingStep; isActive: boolean; isLast: boolean;
}) {
    const scaleAnim = useRef(new Animated.Value(step.completed ? 1 : 0.85)).current;
    const fadeAnim = useRef(new Animated.Value(step.completed ? 1 : 0.45)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: step.completed ? 1 : 0.85, useNativeDriver: true }),
            Animated.timing(fadeAnim, { toValue: step.completed ? 1 : 0.45, duration: 400, useNativeDriver: true }),
        ]).start();
    }, [step.completed]);

    return (
        <View style={styles.stepRow}>
            <View style={styles.stepLeft}>
                <Animated.View style={[
                    styles.stepIconWrap,
                    step.completed ? styles.stepIconDone : styles.stepIconPending,
                    { transform: [{ scale: scaleAnim }] },
                ]}>
                    <MaterialCommunityIcons name={step.icon} size={18} color={step.completed ? "#fff" : GRAY_TEXT} />
                </Animated.View>
                {!isLast && <View style={[styles.stepLine, step.completed ? styles.stepLineDone : styles.stepLinePending]} />}
            </View>

            <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
                <View style={styles.stepLabelRow}>
                    <Text style={[styles.stepLabel, !step.completed && styles.stepLabelPending]}>{step.label}</Text>
                    {isActive && <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>In Progress</Text></View>}
                    {step.completed && !isActive && (
                        <View style={styles.doneBadge}>
                            <MaterialCommunityIcons name="check" size={10} color={TEAL} />
                            <Text style={styles.doneBadgeText}>Done</Text>
                        </View>
                    )}
                </View>
                {!!step.time && (
                    <Text style={[styles.stepTime, step.isEst && !step.completed && styles.stepTimeEst]}>
                        {step.time}
                    </Text>
                )}
            </Animated.View>
        </View>
    );
}

/* ════════════════════════════════════════════════
   MAIN SCREEN
════════════════════════════════════════════════ */
export default function TrackOrderScreen() {
    const { orderNumber } = useLocalSearchParams<{ orderNumber: string }>();
    const { orderId } = useLocalSearchParams<{ orderId: string }>();
    const { orderState, riderLocation, connStatus, statusChanged, reconnect } =
        useOrderTracking(orderId ?? null);

    /* Loading */
    if (!orderState && connStatus === "connecting") {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color={TEAL} />
                <Text style={styles.loadingText}>Connecting to live tracking…</Text>
            </SafeAreaView>
        );
    }

    /* Error */
    if (!orderState) {
        return (
            <SafeAreaView style={styles.centered}>
                <MaterialCommunityIcons name="wifi-off" size={48} color={GRAY_TEXT} />
                <Text style={styles.errorText}>Could not load order.{"\n"}Check your connection.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={reconnect}>
                    <Text style={styles.retryBtnText}>Retry</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const { status, trackingSteps, riderPickup, riderDelivery, deliveryAddress, estimatedDelivery } = orderState;

    const activeIdx = [...trackingSteps].map(s => s.completed).lastIndexOf(true);
    const visibleRider = riderDelivery ?? riderPickup;
    const riderRole = riderDelivery ? "delivery" : "pickup";
    const showMap = riderLocation != null && status !== "delivered" && status !== "cancelled";
    const [destLng, destLat] = deliveryAddress?.coordinates ?? [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>Order #{orderState.orderNumber}</Text>
                    <Text style={styles.headerSub}>{orderState.statusLabel}</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <ConnBadge status={connStatus} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {showMap ? (
                    <LiveMap riderLat={riderLocation!.lat} riderLng={riderLocation!.lng} destLat={destLat} destLng={destLng} />
                ) : (
                    <RadarBanner status={status} statusChanged={statusChanged} />
                )}

                {visibleRider && <RiderCard rider={visibleRider} role={riderRole} />}

                <ProgressBar status={status} />

                <Text style={styles.sectionTitle}>Order Status</Text>
                <View style={styles.timelineCard}>
                    {trackingSteps.map((step, idx) => (
                        <StepRow
                            key={step.status}
                            step={step}
                            isActive={idx === activeIdx}
                            isLast={idx === trackingSteps.length - 1}
                        />
                    ))}
                </View>

                <View style={styles.addressCard}>
                    <MaterialCommunityIcons name="map-marker" size={18} color={GRAY_TEXT} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.addressLabel}>Delivery Address</Text>
                        <Text style={styles.addressValue}>{deliveryAddress?.address ?? "—"}</Text>
                    </View>
                </View>

                {estimatedDelivery && status !== "delivered" && (
                    <View style={styles.estCard}>
                        <MaterialCommunityIcons name="clock-outline" size={18} color={TEAL} />
                        <View>
                            <Text style={styles.estLabel}>Estimated Delivery</Text>
                            <Text style={styles.estValue}>
                                {new Date(estimatedDelivery).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                            </Text>
                        </View>
                    </View>
                )}

                {status === "delivered" && (
                    <View style={styles.deliveredBanner}>
                        <MaterialCommunityIcons name="check-circle" size={18} color={GREEN} />
                        <Text style={styles.deliveredText}>Order successfully delivered!</Text>
                    </View>
                )}
                {status === "cancelled" && (
                    <View style={[styles.deliveredBanner, { backgroundColor: "#FDECEA" }]}>
                        <MaterialCommunityIcons name="close-circle" size={18} color={RED} />
                        <Text style={[styles.deliveredText, { color: "#C62828" }]}>This order was cancelled.</Text>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

/* ════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════ */
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: GRAY_LIGHT },
    centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: GRAY_LIGHT },
    loadingText: { fontSize: 14, color: GRAY_TEXT },
    errorText: { fontSize: 14, color: TEXT_MID, textAlign: "center", paddingHorizontal: 32 },
    retryBtn: { marginTop: 4, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: TEAL, borderRadius: 20 },
    retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

    connBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center", marginBottom: 4, backgroundColor: "#FFF9E6", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
    connDot: { width: 7, height: 7, borderRadius: 4 },
    connText: { fontSize: 12, fontWeight: "600", color: "#92600A" },

    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 2, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4 },
    headerText: { alignItems: "center" },
    headerTitle: { fontSize: 16, fontWeight: "700", color: TEXT_DARK },
    headerSub: { fontSize: 12, color: GRAY_TEXT, marginTop: 2 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },

    mapCard: { borderRadius: 20, overflow: "hidden", height: 220, position: "relative" },
    map: { flex: 1 },
    riderMarker: { width: 36, height: 36, borderRadius: 18, backgroundColor: TEAL, alignItems: "center", justifyContent: "center", elevation: 4 },
    destMarker: { alignItems: "center", justifyContent: "center" },
    liveBadge: { position: "absolute", top: 12, left: 12, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: GREEN },
    liveText: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 1 },

    radarCard: { height: 180, backgroundColor: TEAL_LIGHT, borderRadius: 20, alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" },
    ring4: { position: "absolute", width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: "rgba(26,107,90,0.08)" },
    ring3: { position: "absolute", width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: "rgba(26,107,90,0.10)" },
    ring2: { position: "absolute", width: 144, height: 144, borderRadius: 72, borderWidth: 1.5, borderColor: "rgba(26,107,90,0.13)" },
    ring1: { position: "absolute", width: 88, height: 88, borderRadius: 44, borderWidth: 1.5, borderColor: "rgba(26,107,90,0.18)" },
    radarCenter: { width: 56, height: 56, borderRadius: 28, backgroundColor: TEAL, alignItems: "center", justifyContent: "center", elevation: 4, shadowColor: TEAL, shadowOpacity: 0.3, shadowRadius: 8 },
    radarLabel: { marginTop: 12, fontSize: 13, fontWeight: "600", color: TEAL },

    riderCard: { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    riderAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: TEAL, alignItems: "center", justifyContent: "center", marginRight: 12 },
    riderInitial: { color: "#fff", fontSize: 18, fontWeight: "800" },
    riderInfo: { flex: 1 },
    riderName: { fontSize: 14, fontWeight: "700", color: TEXT_DARK },
    riderRole: { fontSize: 12, color: GRAY_TEXT, marginTop: 2 },
    riderActions: { flexDirection: "row", gap: 8 },
    riderBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: TEAL_LIGHT, alignItems: "center", justifyContent: "center" },

    progressCard: { backgroundColor: "#fff", borderRadius: 14, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    progressMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
    progressLabel: { fontSize: 12, color: TEXT_MID, fontWeight: "500" },
    progressPct: { fontSize: 12, color: TEAL, fontWeight: "700" },
    progressTrack: { height: 6, backgroundColor: TEAL_LIGHT, borderRadius: 99, overflow: "hidden" },
    progressFill: { height: 6, backgroundColor: TEAL, borderRadius: 99 },

    sectionTitle: { fontSize: 15, fontWeight: "700", color: TEXT_DARK, marginTop: 4 },

    timelineCard: { backgroundColor: "#fff", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    stepRow: { flexDirection: "row", minHeight: 64 },
    stepLeft: { width: 44, alignItems: "center" },
    stepIconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", zIndex: 1 },
    stepIconDone: { backgroundColor: TEAL },
    stepIconPending: { backgroundColor: "#F0F0EA", borderWidth: 1.5, borderColor: "#DDD" },
    stepLine: { width: 2, flex: 1, marginTop: 2, marginBottom: -2 },
    stepLineDone: { backgroundColor: TEAL },
    stepLinePending: { backgroundColor: "#E0E0DA" },
    stepContent: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
    stepLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    stepLabel: { fontSize: 14, fontWeight: "700", color: TEXT_DARK },
    stepLabelPending: { color: GRAY_TEXT, fontWeight: "500" },
    stepTime: { fontSize: 12, color: GRAY_TEXT, marginTop: 3, fontWeight: "500" },
    stepTimeEst: { color: TEAL, fontWeight: "600" },
    activeBadge: { backgroundColor: "#FFF4E0", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
    activeBadgeText: { fontSize: 10, fontWeight: "700", color: "#B07B00" },
    doneBadge: { backgroundColor: TEAL_LIGHT, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, flexDirection: "row", alignItems: "center", gap: 3 },
    doneBadgeText: { fontSize: 10, fontWeight: "700", color: TEAL },

    addressCard: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
    addressLabel: { fontSize: 12, color: GRAY_TEXT, fontWeight: "500" },
    addressValue: { fontSize: 14, fontWeight: "600", color: TEXT_DARK, marginTop: 2 },

    estCard: { backgroundColor: TEAL_LIGHT, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 10 },
    estLabel: { fontSize: 12, color: TEXT_MID, fontWeight: "500" },
    estValue: { fontSize: 14, fontWeight: "700", color: TEAL, marginTop: 2 },

    deliveredBanner: { backgroundColor: "#E8F8EF", borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
    deliveredText: { fontSize: 14, fontWeight: "600", color: "#1A8A4A" },
});