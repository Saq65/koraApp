import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  TextInput,
  Animated,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

// ─── Responsive helpers ────────────────────────────────────────
const { width: W, height: H } = Dimensions.get("window");
const r  = (n: number) => Math.round((W / 375) * n);
const rv = (n: number) => Math.round((H / 812) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;

// ─── Design tokens ─────────────────────────────────────────────
const C = {
  teal:       "#1a7a6e",
  tealLight:  "#e0f5f2",
  tealXLight: "#eef9f7",
  tealDark:   "#0f5249",
  surface:    "#ffffff",
  bg:         "#f2f6f5",
  ink:        "#0e1c1a",
  inkMid:     "#4a6360",
  inkLight:   "#8aa8a4",
  border:     "#dce8e6",
  red:        "#e53935",
  redLight:   "#fdecea",
  amber:      "#f59e0b",
  amberLight: "#fef3c7",
  placeholder:"#a0b8b5",
} as const;

const ios_shadow = {
  shadowColor: "#0a3530",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
};

// ─── Types ─────────────────────────────────────────────────────
type AddressType = "home" | "office" | "other";

interface Address {
  id: string;
  type: AddressType;
  label: string;
  line1: string;
  line2?: string;
  isDefault: boolean;
}

// ─── Icon per address type ──────────────────────────────────────
function AddressIcon({ type, size = 22 }: { type: AddressType; size?: number }) {
  const iconProps = { size: r(size), color: C.teal };
  switch (type) {
    case "home":   return <Ionicons name="home-outline" {...iconProps} />;
    case "office": return <MaterialCommunityIcons name="briefcase-outline" {...iconProps} />;
    default:       return <Ionicons name="location-outline" {...iconProps} />;
  }
}

// ─── Default sample data ────────────────────────────────────────
const INITIAL_ADDRESSES: Address[] = [
  {
    id: "1",
    type: "home",
    label: "Home",
    line1: "Flat 302, Sunshine Apartments, MG Road,",
    line2: "Pune 411001",
    isDefault: true,
  },
  {
    id: "2",
    type: "office",
    label: "Office",
    line1: "Tower B, 5th Floor, Tech Park, Hinjewadi",
    line2: "Phase 2, Pune 411057",
    isDefault: false,
  },
  {
    id: "3",
    type: "other",
    label: "Mom's Place",
    line1: "12 Rose Villa, Koregaon Park, Pune 411001",
    isDefault: false,
  },
];

// ─── Inline Add Form ──────────────────────────────────────────
function AddAddressForm({
  onSave,
  onCancel,
}: {
  onSave: (label: string, address: string) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [label, setLabel]     = useState("");
  const [address, setAddress] = useState("");

  const handleSave = () => {
    const trimLabel   = label.trim();
    const trimAddress = address.trim();
    if (!trimLabel || !trimAddress) {
      Alert.alert(t("savedaddress.missing_info_title"), t("savedaddress.missing_info_message"));
      return;
    }
    Keyboard.dismiss();
    onSave(trimLabel, trimAddress);
  };

  return (
    <View style={formStyles.card}>
      {/* Label input */}
      <TextInput
        style={formStyles.input}
        placeholder={t("savedaddress.label_placeholder")}
        placeholderTextColor={C.placeholder}
        value={label}
        onChangeText={setLabel}
        returnKeyType="next"
        autoCapitalize="words"
      />

      {/* Address input */}
      <TextInput
        style={[formStyles.input, { marginTop: rv(10) }]}
        placeholder={t("savedaddress.address_placeholder")}
        placeholderTextColor={C.placeholder}
        value={address}
        onChangeText={setAddress}
        returnKeyType="done"
        onSubmitEditing={handleSave}
        autoCapitalize="sentences"
      />

      {/* Action buttons */}
      <View style={formStyles.btnRow}>
        <TouchableOpacity
          style={formStyles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Text style={formStyles.saveBtnText}>{t("common.save")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={formStyles.cancelBtn}
          onPress={() => {
            Keyboard.dismiss();
            onCancel();
          }}
          activeOpacity={0.75}
        >
          <Text style={formStyles.cancelBtnText}>{t("common.cancel")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const formStyles = StyleSheet.create({
  card: {
    backgroundColor: C.surface,
    borderRadius: r(16),
    padding: r(16),
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: r(4),
    ...Platform.select({ ios: ios_shadow }),
  },
  input: {
    height: rv(44),
    backgroundColor: C.bg,
    borderRadius: r(10),
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: r(14),
    fontSize: rm(14),
    color: C.ink,
    fontWeight: "400",
  },
  btnRow: {
    flexDirection: "row",
    gap: r(10),
    marginTop: rv(14),
  },
  saveBtn: {
    flex: 1,
    height: rv(42),
    backgroundColor: C.teal,
    borderRadius: r(22),
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { ...ios_shadow, shadowOpacity: 0.15 },
      android: { elevation: 3 },
    }),
  },
  saveBtnText: {
    fontSize: rm(14),
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.1,
  },
  cancelBtn: {
    flex: 1,
    height: rv(42),
    backgroundColor: C.surface,
    borderRadius: r(22),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  cancelBtnText: {
    fontSize: rm(14),
    fontWeight: "600",
    color: C.inkMid,
  },
});

// ─── Address Card ──────────────────────────────────────────────
function AddressCard({
  address,
  onSetDefault,
  onRemove,
}: {
  address: Address;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      {/* Left icon */}
      <View style={styles.iconCircle}>
        <AddressIcon type={address.type} />
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Label row */}
        <View style={styles.labelRow}>
          <Text style={styles.cardLabel}>{address.label}</Text>
          {address.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>{t("savedaddress.default_badge")}</Text>
            </View>
          )}
        </View>

        {/* Address text */}
        <Text style={styles.addressLine}>{address.line1}</Text>
        {address.line2 && (
          <Text style={styles.addressLine}>{address.line2}</Text>
        )}

        {/* Actions row */}
        <View style={styles.actionsRow}>
          {!address.isDefault && (
            <TouchableOpacity
              style={styles.defaultBtn}
              onPress={() => onSetDefault(address.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="star-outline"
                size={r(13)}
                color={C.teal}
                style={{ marginRight: r(4) }}
              />
              <Text style={styles.defaultBtnText}>{t("savedaddress.set_default")}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.removeBtn, address.isDefault && { marginLeft: 0 }]}
            onPress={() => onRemove(address.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="trash-outline"
              size={r(13)}
              color={C.red}
              style={{ marginRight: r(4) }}
            />
            <Text style={styles.removeBtnText}>{t("common.remove")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function SavedAddressScreen() {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState<Address[]>(INITIAL_ADDRESSES);
  const [showForm, setShowForm]   = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSetDefault = (id: string) => {
    setAddresses(prev =>
      prev.map(a => ({ ...a, isDefault: a.id === id }))
    );
  };

  const handleRemove = (id: string) => {
    Alert.alert(
      t("savedaddress.remove_address_title"),
      t("savedaddress.remove_address_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.remove"),
          style: "destructive",
          onPress: () =>
            setAddresses(prev => {
              const filtered = prev.filter(a => a.id !== id);
              if (filtered.length > 0 && !filtered.some(a => a.isDefault)) {
                filtered[0].isDefault = true;
              }
              return filtered;
            }),
        },
      ]
    );
  };

  const handleAdd = () => {
    setShowForm(true);
    // Scroll to top so form is visible
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }, 50);
  };

  const handleSave = (label: string, address: string) => {
    const newAddress: Address = {
      id: Date.now().toString(),
      type: "other",
      label,
      line1: address,
      isDefault: addresses.length === 0,
    };
    setAddresses(prev => [...prev, newAddress]);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={r(20)} color={C.ink} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t("savedaddress.title")}</Text>

        <TouchableOpacity
          style={[
            styles.addBtn,
            showForm && { backgroundColor: C.teal, borderColor: C.teal },
          ]}
          onPress={showForm ? handleCancel : handleAdd}
          activeOpacity={0.8}
        >
          <Ionicons
            name={showForm ? "close" : "add"}
            size={r(16)}
            color={showForm ? "#fff" : C.teal}
          />
          <Text style={[styles.addBtnText, showForm && { color: "#fff" }]}>
            {showForm ? t("common.close") : t("savedaddress.add")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── LIST ── */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── INLINE ADD FORM (appears at top) ── */}
        {showForm && (
          <AddAddressForm onSave={handleSave} onCancel={handleCancel} />
        )}

        {addresses.length === 0 && !showForm ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={r(40)} color={C.tealLight} />
            </View>
            <Text style={styles.emptyTitle}>{t("savedaddress.no_addresses")}</Text>
            <Text style={styles.emptySubtitle}>
              {t("savedaddress.no_addresses_sub")}
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={handleAdd}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={r(16)} color="#fff" />
              <Text style={styles.emptyAddBtnText}>{t("savedaddress.add_address")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onSetDefault={handleSetDefault}
              onRemove={handleRemove}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: r(16),
    paddingTop: rv(8),
    paddingBottom: rv(12),
    backgroundColor: C.bg,
  },
  backBtn: {
    width: r(36),
    height: r(36),
    alignItems: "center",
    justifyContent: "center",
    borderRadius: r(18),
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({ ios: ios_shadow }),
  },
  headerTitle: {
    flex: 1,
    fontSize: rm(18),
    fontWeight: "700",
    color: C.ink,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(4),
    paddingHorizontal: r(12),
    paddingVertical: rv(7),
    borderRadius: r(20),
    backgroundColor: C.tealLight,
    borderWidth: 1,
    borderColor: C.teal + "40",
  },
  addBtnText: {
    fontSize: rm(13),
    fontWeight: "700",
    color: C.teal,
  },

  // List
  listContent: {
    paddingHorizontal: r(16),
    paddingTop: rv(8),
    paddingBottom: rv(32),
    gap: r(12),
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: C.surface,
    borderRadius: r(16),
    padding: r(16),
    gap: r(14),
    borderWidth: 1,
    borderColor: C.border,
    ...Platform.select({ ios: ios_shadow }),
  },
  iconCircle: {
    width: r(44),
    height: r(44),
    borderRadius: r(22),
    backgroundColor: C.tealXLight,
    borderWidth: 1.5,
    borderColor: C.tealLight,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: rv(2),
  },
  cardContent: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(8),
    marginBottom: rv(4),
  },
  cardLabel: {
    fontSize: rm(15),
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.2,
  },
  defaultBadge: {
    backgroundColor: C.tealLight,
    borderRadius: r(6),
    paddingHorizontal: r(7),
    paddingVertical: rv(2),
  },
  defaultBadgeText: {
    fontSize: rm(9.5),
    fontWeight: "800",
    color: C.tealDark,
    letterSpacing: 0.5,
  },
  addressLine: {
    fontSize: rm(12.5),
    fontWeight: "400",
    color: C.inkMid,
    lineHeight: rm(18),
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: rv(10),
    gap: r(16),
  },
  defaultBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  defaultBtnText: {
    fontSize: rm(12),
    fontWeight: "600",
    color: C.teal,
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto" as any,
  },
  removeBtnText: {
    fontSize: rm(12),
    fontWeight: "600",
    color: C.red,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: rv(80),
    paddingHorizontal: r(32),
    gap: rv(10),
  },
  emptyIcon: {
    width: r(88),
    height: r(88),
    borderRadius: r(44),
    backgroundColor: C.tealXLight,
    borderWidth: 2,
    borderColor: C.tealLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: rv(6),
  },
  emptyTitle: {
    fontSize: rm(17),
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: rm(13),
    fontWeight: "400",
    color: C.inkMid,
    textAlign: "center",
    lineHeight: rm(19),
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(6),
    marginTop: rv(16),
    backgroundColor: C.teal,
    borderRadius: r(14),
    paddingHorizontal: r(24),
    paddingVertical: rv(13),
    ...Platform.select({
      ios: { ...ios_shadow, shadowOpacity: 0.15 },
      android: { elevation: 4 },
    }),
  },
  emptyAddBtnText: {
    fontSize: rm(14),
    fontWeight: "700",
    color: "#fff",
  },
});