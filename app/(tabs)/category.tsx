import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const { width: W, height: H } = Dimensions.get("window");
const s = (n: number) => Math.round((W / 375) * n);
const vs = (n: number) => Math.round((H / 812) * n);
const ms = (n: number, f = 0.4) => n + (s(n) - n) * f;

const TEAL = "#2d7a6e";
const TEAL_DARK = "#1f5c54";
const TEAL_LIGHT = "#e8f5f3";

const categories = [
    {
        id: "men",
        label: "Men",
        desc: "Shirts, pants, kurtas & more",
        icon: "person-outline",
        route: "/(tabs)/subcategory?category=Men",
    },
    {
        id: "women",
        label: "Women",
        desc: "Tops, sarees, dresses & more",
        icon: "person-outline",
        route: "/(tabs)/subcategory?category=Women",    
    },
    {
        id: "children",
        label: "Children",
        desc: "Kids clothing & uniforms",
        icon: "happy-outline",
    },
    {
        id: "linen",
        label: "Linen",
        desc: "Bedsheets, curtains, towels",
        icon: "bed-outline",
    },
];

export default function CategoryScreen() {
    return (
        <SafeAreaView style={styles.container} edges={["top"]}>
            {/* ── HEADER ── */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.back()}
                    activeOpacity={0.7}
                >
                    <Ionicons name="chevron-back" size={s(20)} color="#1a1a1a" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.headerSuper}>Laundry</Text>
                    <Text style={styles.headerTitle}>Choose Category</Text>
                </View>
            </View>

            {/* ── GRID ── */}
            <ScrollView
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={false}
            >
                {categories.map((cat) => (
                    <CategoryCard key={cat.id} {...cat} />
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Category Card ─────────────────────────────────────────────
function CategoryCard({
    label,
    desc,
    icon,
    route,
}: {
    id: string;
    label: string;
    desc: string;
    icon: string;
    route?: string;
}) {
    const cardWidth = (W - s(16) * 2 - s(12)) / 2; // 2 columns with gap

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => route && router.push(route as any)}
            style={[styles.card, { width: cardWidth }]}
        >
            {/* Icon box */}
            <View style={styles.iconBox}>
                <Ionicons name={icon as any} size={s(24)} color="#fff" />
            </View>

            {/* Text */}
            <Text style={styles.cardLabel}>{label}</Text>
            <Text style={styles.cardDesc}>{desc}</Text>

            {/* Browse link */}
            <View style={styles.browseRow}>
                <Text style={styles.browseText}>Browse</Text>
                <Ionicons name="chevron-forward" size={s(13)} color={TEAL} />
            </View>
        </TouchableOpacity>
    );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f0f4f3",
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: s(16),
        paddingTop: vs(12),
        paddingBottom: vs(16),
        gap: s(12),
    },
    backBtn: {
        width: s(36),
        height: s(36),
        borderRadius: s(18),
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    headerText: { flex: 1 },
    headerSuper: {
        fontSize: ms(12),
        color: "#888",
        fontWeight: "500",
        marginBottom: vs(2),
    },
    headerTitle: {
        fontSize: ms(22),
        fontWeight: "800",
        color: "#1a1a1a",
    },

    // Grid
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: s(16),
        gap: s(12),
        paddingBottom: vs(24),
    },

    // Card
    card: {
        backgroundColor: "#fff",
        borderRadius: s(18),
        padding: s(16),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#ececec",
    },
    iconBox: {
        width: s(48),
        height: s(48),
        borderRadius: s(14),
        backgroundColor: TEAL,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: vs(14),
    },
    cardLabel: {
        fontSize: ms(15),
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: vs(4),
    },
    cardDesc: {
        fontSize: ms(12),
        color: "#888",
        lineHeight: ms(17),
        marginBottom: vs(14),
    },
    browseRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: s(2),
    },
    browseText: {
        fontSize: ms(13),
        fontWeight: "600",
        color: TEAL,
    },
});