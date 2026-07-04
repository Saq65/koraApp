import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "../src/theme/ThemeProvider";
import AppBackground from "@/components/AppBackground";


const { width: W, height: H } = Dimensions.get("window");
const s = (n: number) => Math.round((W / 375) * n);
const vs = (n: number) => Math.round((H / 812) * n);
const ms = (n: number, f = 0.4) => n + (s(n) - n) * f;

const TEAL = "#2d7a6e";
const TEAL_DARK = "#1f5c54";
const TEAL_LIGHT = "#e8f5f3";



export default function CategoryScreen() {
    const { t } = useTranslation();
    const { theme, isDarkMode } = useTheme();

    const categories = [
        {
            id: "men",
            label: t("category.men"),
            desc: t("category.men_desc"),
            icon: "person-outline",
            route: "/subcategory?category=Men",
        },
        {
            id: "women",
            label: t("category.women"),
            desc: t("category.women_desc"),
            icon: "person-outline",
            route: "/subcategory?category=Women",
        },
        {
            id: "children",
            label: t("category.children"),
            desc: t("category.children_desc"),
            icon: "happy-outline",
            route: "/subcategory?category=Children",
        },
        {
            id: "linen",
            label: t("category.linen"),
            desc: t("category.linen_desc"),
            icon: "bed-outline",
            route: "/subcategory?category=Linen",
        },
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["top"]}>
            {/* ── HEADER ── */}
            <AppBackground>
                <StatusBar
                    barStyle={isDarkMode ? "light-content" : "dark-content"}
                    backgroundColor={theme.background}
                />
                <View style={styles.header}>
                    <TouchableOpacity
                        style={[styles.backBtn, { backgroundColor: theme.card, shadowColor: isDarkMode ? "#000" : "#000" }]}
                        onPress={() => router.back()}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={s(20)} color={theme.text} />
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={[styles.headerSuper, { color: theme.subText }]}>{t("category.laundry")}</Text>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>{t("category.choose_category")}</Text>
                    </View>
                </View>

                {/* ── GRID ── */}
                <ScrollView
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                >
                    {categories.map((cat) => (
                        <CategoryCard key={cat.id} {...cat} t={t} theme={theme} isDarkMode={isDarkMode} />
                    ))}
                </ScrollView>
            </AppBackground>
        </SafeAreaView>
    );
}

// ── Category Card ─────────────────────────────────────────────
function CategoryCard({
    label,
    desc,
    icon,
    route,
    t,
    theme,
}: {
    id: string;
    label: string;
    desc: string;
    icon: string;
    route?: string;
    t: any;
    theme: any;
    isDarkMode: boolean;
}) {
    const cardWidth = (W - s(16) * 2 - s(12)) / 2;

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => route && router.push(route as any)}
            style={[styles.card, { width: cardWidth, backgroundColor: theme.card, borderColor: theme.border }]}
        >
            {/* Icon box */}
            <View style={[styles.iconBox, { backgroundColor: theme.primary }]}>
                <Ionicons name={icon as any} size={s(24)} color="#fff" />
            </View>

            {/* Text */}
            <Text style={[styles.cardLabel, { color: theme.text }]}>{label}</Text>
            <Text style={[styles.cardDesc, { color: theme.subText }]}>{desc}</Text>

            {/* Browse link */}
            <View style={styles.browseRow}>
                <Text style={[styles.browseText, { color: theme.primary }]}>{t("common.browse")}</Text>
                <Ionicons name="chevron-forward" size={s(13)} color={theme.primary} />
            </View>
        </TouchableOpacity>
    );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
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