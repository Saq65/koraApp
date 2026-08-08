import { router } from "expo-router";
import { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ScrollView,
    StyleSheet,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

/* ─── Constants ─── */
const TEAL = "#1A6B5A";
const TEAL_LIGHT = "#E8F4F1";
const GRAY_LIGHT = "#EFEFEA";
const GRAY_TEXT = "#ABABAB";
const TEXT_DARK = "#1A1A1A";
const TEXT_MID = "#666666";
const TOTAL = 520;

/* ─── UPI Options ─── */
type UpiOption = {
    id: string;
    labelKey: string;
    icon: string;          // MaterialCommunityIcons name
    iconColor: string;
    iconBg: string;
};

const UPI_OPTIONS: UpiOption[] = [
    { id: "gpay", labelKey: "Google Pay", icon: "google", iconColor: "#4285F4", iconBg: "#E8F0FE" },
    { id: "phonepe", labelKey: "PhonePe", icon: "phone", iconColor: "#6739B7", iconBg: "#EDE7F6" },
    { id: "paytm", labelKey: "Paytm", icon: "wallet", iconColor: "#00BAF2", iconBg: "#E3F7FE" },
    { id: "otherupi", labelKey: "payment.other_upi", icon: "dots-grid", iconColor: GRAY_TEXT, iconBg: "#F0F0EA" },
];

/* ─── Main Screen ─── */
export default function Payment() {
    const { t } = useTranslation();
    const [selected, setSelected] = useState<string>("gpay");
    const [upiId, setUpiId] = useState("");

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t("payment.title")}</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Total Amount ── */}
                <View style={styles.totalWrap}>
                    <Text style={styles.totalLabel}>{t("payment.total_amount")}</Text>
                    <Text style={styles.totalAmount}>₹{TOTAL}</Text>
                </View>

                {/* ── Pay via UPI card ── */}
                <View style={styles.card}>
                    {/* Section header */}
                    <View style={styles.upiHeader}>
                        <View style={styles.upiIconWrap}>
                            <MaterialCommunityIcons name="cellphone" size={20} color="#fff" />
                        </View>
                        <View>
                            <Text style={styles.upiTitle}>{t("payment.pay_via_upi")}</Text>
                            <Text style={styles.upiSubtitle}>{t("payment.fast_secure")}</Text>
                        </View>
                    </View>

                    {/* 2×2 Grid */}
                    <View style={styles.grid}>
                        {UPI_OPTIONS.map((opt) => {
                            const isActive = selected === opt.id;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.gridItem, isActive && styles.gridItemActive]}
                                    onPress={() => setSelected(opt.id)}
                                    activeOpacity={0.75}
                                >
                                    <View style={[styles.gridIcon, { backgroundColor: opt.iconBg }]}>
                                        <MaterialCommunityIcons name={opt.icon} size={18} color={opt.iconColor} />
                                    </View>
                                    <Text style={[styles.gridLabel, isActive && styles.gridLabelActive]}>
                                        {opt.labelKey.startsWith("payment.") ? t(opt.labelKey) : opt.labelKey}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* OR enter UPI ID */}
                    <Text style={styles.orText}>{t("payment.or_enter_upi")}</Text>
                    <View style={styles.inputWrap}>
                        <TextInput
                            style={styles.input}
                            placeholder="yourname@upi"
                            placeholderTextColor={GRAY_TEXT}
                            value={upiId}
                            onChangeText={setUpiId}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    {/* Security note */}
                    <View style={styles.secureRow}>
                        <MaterialCommunityIcons name="shield-check-outline" size={14} color={TEAL} />
                        <Text style={styles.secureText}>{t("payment.secure_note")}</Text>
                    </View>
                </View>
            </ScrollView>

            {/* ── Sticky Pay Button ── */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={() => router.push('/paymentsucces')} style={styles.payBtn} activeOpacity={0.85}>
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                    <Text style={styles.payBtnText}>{t("payment.pay_button")} ₹{TOTAL}</Text>
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
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: TEXT_DARK,
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 20,
    },

    /* Total */
    totalWrap: {
        alignItems: "center",
        paddingVertical: 8,
    },
    totalLabel: {
        fontSize: 13,
        color: TEXT_MID,
        fontWeight: "500",
        marginBottom: 4,
    },
    totalAmount: {
        fontSize: 36,
        fontWeight: "800",
        color: TEXT_DARK,
        letterSpacing: -0.5,
    },

    /* Card */
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 18,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        gap: 16,
    },

    /* UPI Header */
    upiHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    upiIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: TEAL,
        alignItems: "center",
        justifyContent: "center",
    },
    upiTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: TEXT_DARK,
    },
    upiSubtitle: {
        fontSize: 12,
        color: GRAY_TEXT,
        marginTop: 1,
    },

    /* 2×2 Grid */
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    gridItem: {
        width: "47.5%",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderWidth: 1.5,
        borderColor: "#E8E8E2",
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 12,
        backgroundColor: "#fff",
    },
    gridItemActive: {
        borderColor: TEAL,
        backgroundColor: TEAL_LIGHT,
    },
    gridIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    gridLabel: {
        fontSize: 13,
        fontWeight: "600",
        color: TEXT_DARK,
    },
    gridLabelActive: {
        color: TEAL,
    },

    /* OR / UPI input */
    orText: {
        fontSize: 13,
        color: TEXT_MID,
        fontWeight: "500",
    },
    inputWrap: {
        borderWidth: 1.5,
        borderColor: "#E0E0D8",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: "#FAFAF8",
    },
    input: {
        fontSize: 14,
        color: TEXT_DARK,
        padding: 0,
    },

    /* Secure */
    secureRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    secureText: {
        fontSize: 12,
        color: TEXT_MID,
        fontWeight: "500",
    },

    /* Footer */
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: GRAY_LIGHT,
        borderTopWidth: 1,
        borderTopColor: "#E5E5E0",
    },
    payBtn: {
        backgroundColor: TEAL,
        borderRadius: 30,
        paddingVertical: 15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    payBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});