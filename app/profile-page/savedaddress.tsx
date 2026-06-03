 import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import MapView, { Marker, Region } from "react-native-maps";
import { useTheme } from "../../src/theme/ThemeProvider";
import AppBackground from "@/components/AppBackground";
import { getSavedAddresses, createSavedAddress, deleteSavedAddress, setDefaultAddress } from "../../src/services/customer";

// ─── Responsive helpers ────────────────────────────────────────
const { width: W, height: H } = Dimensions.get("window");
const r = (n: number) => Math.round((W / 375) * n);
const rv = (n: number) => Math.round((H / 812) * n);
const rm = (n: number, f = 0.45) => n + (r(n) - n) * f;

type AddressType = "home" | "office" | "other";

type SavedAddress = {
  _id: string;
  label: AddressType;
  customLabel?: string | null;
  address: string;
  coordinates: { lat: number; lng: number };
  isDefault: boolean;
};

type FormMode = "list" | "add" | "pick";

const DEFAULT_REGION: Region = {
  latitude: 19.076,
  longitude: 72.8777,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

function displayLabel(a: SavedAddress): string {
  if (a.label === "other" && a.customLabel) return a.customLabel;
  return a.label.charAt(0).toUpperCase() + a.label.slice(1);
}

function AddressIcon({ type }: { type: AddressType }) {
  // Keep icons consistent; colors come from theme styles below.
  switch (type) {
    case "home":
      return <Ionicons name="home-outline" size={r(22)} />;
    case "office":
      return <MaterialCommunityIcons name="briefcase-outline" size={r(22)} />;
    default:
      return <Ionicons name="location-outline" size={r(22)} />;
  }
}

function AddressCard({
  address,
  onSetDefault,
  onRemove,
}: {
  address: SavedAddress;
  onSetDefault: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const { theme, isDarkMode } = (useTheme as any)();
  const labelText = displayLabel(address);

  return (
    <View style={[styles.card, { borderColor: theme.border, backgroundColor: theme.card, shadowColor: theme.text }]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}> 
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <AddressIcon type={address.label} />
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.labelRow}>
          <Text style={[styles.cardLabel, { color: theme.text }]}>{labelText}</Text>
          {address.isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.defaultBadgeText, { color: theme.secondary ?? theme.primary }]}>
                DEFAULT
              </Text>
            </View>
          )}
        </View>

        <Text style={[styles.addressLine, { color: theme.subText }]} numberOfLines={2}>
          {address.address}
        </Text>

        <View style={styles.actionsRow}>
          {!address.isDefault && (
            <TouchableOpacity
              style={styles.defaultBtn}
              onPress={() => onSetDefault(address._id)}
              activeOpacity={0.7}
            >
              <Ionicons name="star-outline" size={r(13)} color={theme.primary} style={{ marginRight: r(4) }} />
              <Text style={[styles.defaultBtnText, { color: theme.primary }]}>
                Set as default
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.removeBtn, address.isDefault && { marginLeft: 0 }]}
            onPress={() => onRemove(address._id)}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={r(13)} color={theme.red ?? "#e53935"} style={{ marginRight: r(4) }} />
            <Text style={[styles.removeBtnText, { color: theme.red ?? "#e53935" }]}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function AddAddressForm({
  mode,
  initialLabel,
  onCancel,
  onPickOnMap,
  onSave,
}: {
  mode: FormMode;
  initialLabel: AddressType;
  onCancel: () => void;
  onPickOnMap: () => void;
  onSave: (payload: { label: AddressType; customLabel: string | null; address: string }) => void;
}) {
  const { theme } = useTheme();
  const [label, setLabel] = useState<AddressType>(initialLabel);
  const [customLabel, setCustomLabel] = useState<string>("");
  const [addressText, setAddressText] = useState<string>("");

  useEffect(() => {
    setLabel(initialLabel);
  }, [initialLabel]);

  return (
    <View style={{ gap: rv(12) }}>
      <View style={[styles.formCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Text style={[styles.formTitle, { color: theme.text }]}>Add saved address</Text>

        <Text style={[styles.formLabel, { color: theme.subText }]}>Label</Text>
        <View style={{ flexDirection: "row", gap: r(8), flexWrap: "wrap" }}>
          {([
            { key: "home", text: "Home" },
            { key: "office", text: "Office" },
            { key: "other", text: "Other" },
          ] as const).map((it) => {
            const active = label === it.key;
            return (
              <TouchableOpacity
                key={it.key}
                style={[
                  styles.pill,
                  {
                    borderColor: theme.border,
                    backgroundColor: active ? theme.primaryLight : theme.card,
                  },
                ]}
                onPress={() => setLabel(it.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, { color: active ? theme.primary : theme.subText }]}>{it.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {label === "other" && (
          <>
            <Text style={[styles.formLabel, { color: theme.subText, marginTop: rv(10) }]}>Custom label</Text>
            <TextInput
              style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
              placeholder="e.g. Friend's house"
              placeholderTextColor={theme.subText}
              value={customLabel}
              onChangeText={setCustomLabel}
            />
          </>
        )}

        <Text style={[styles.formLabel, { color: theme.subText, marginTop: rv(10) }]}>Address</Text>
        <TextInput
          style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
          placeholder="Type address (optional if using map)"
          placeholderTextColor={theme.subText}
          value={addressText}
          onChangeText={setAddressText}
          multiline
        />

        <View style={{ flexDirection: "row", gap: r(10), marginTop: rv(12) }}>
          <TouchableOpacity style={[styles.btnSecondary, { borderColor: theme.border }]} onPress={onPickOnMap} activeOpacity={0.8}>
            <Ionicons name="map-outline" size={r(16)} color={theme.primary} style={{ marginRight: r(6) }} />
            <Text style={[styles.btnSecondaryText, { color: theme.primary }]}>Pick on map</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, { backgroundColor: theme.primary }]}
            onPress={() => {
              const addr = addressText.trim();
              const cust = label === "other" ? (customLabel.trim() ? customLabel.trim() : null) : null;
              if (!addr) {
                Alert.alert("Missing address", "Either type address or use Pick on map.");
                return;
              }
              if (label === "other" && !cust) {
                Alert.alert("Missing custom label", "Please provide a name for this address.");
                return;
              }
              onSave({ label, customLabel: cust, address: addr });
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.btnPrimaryText, { color: theme.white }]}>{"Save"}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={{ marginTop: rv(10) }} onPress={onCancel} activeOpacity={0.8}>
          <Text style={[styles.cancelText, { color: theme.subText }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SavedAddressScreen() {
  const { theme } = useTheme();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<FormMode>("list");
  const [activeLabel, setActiveLabel] = useState<AddressType>("other");

  // map selection
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [marker, setMarker] = useState<{ latitude: number; longitude: number }>({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
  const [pickedAddressText, setPickedAddressText] = useState<string>("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await getSavedAddresses();
      setAddresses(data);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to load saved addresses");
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await fetchAll();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to set default address");
    }
  };

  const onRemove = async (id: string) => {
    Alert.alert("Remove Address", "Are you sure you want to remove this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSavedAddress(id);
            await fetchAll();
          } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Failed to remove address");
          }
        },
      },
    ]);
  };

  const openAdd = (label: AddressType = "other") => {
    setActiveLabel(label);
    setMode("add");
  };

  const openPickMap = () => {
    setPickedAddressText("");
    setMode("pick");
  };

  const saveFromForm = async (payload: { label: AddressType; customLabel: string | null; address: string }) => {
    try {
      // Without geocoding we can't guarantee coords; ask user to pick on map.
      Alert.alert("Location needed", "Please pick this address on map to save coordinates.");
      // We keep user in pick mode.
      setActiveLabel(payload.label);
      setPickedAddressText(payload.address);
      setMode("pick");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to prepare save");
    }
  };

  const saveFromMap = async () => {
    try {
      const addr = pickedAddressText.trim();
      if (!addr) {
        Alert.alert("Missing address", "Please type/confirm address text before saving.");
        return;
      }

      await createSavedAddress({
        label: activeLabel,
        customLabel: activeLabel === "other" ? (addr.length > 0 ? null : null) : null,
        address: addr,
        coordinates: { lat: marker.latitude, lng: marker.longitude },
        isDefault: false,
      } as any);

      await fetchAll();
      setMode("list");
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to create address");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={["top", "left", "right"]}>
      <AppBackground>
        <View style={[styles.header, { backgroundColor: "transparent" }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={r(20)} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: theme.text }]}>Saved Addresses</Text>

          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
            onPress={() => openAdd("other")}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={r(16)} color={theme.primary} />
            <Text style={[styles.addBtnText, { color: theme.primary }]}>Add</Text>
          </TouchableOpacity>
        </View>

        {mode === "list" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <View style={{ paddingVertical: rv(40), alignItems: "center" }}>
                <Text style={{ color: theme.subText }}>Loading...</Text>
              </View>
            ) : addresses.length === 0 ? (
              <View style={[styles.emptyState]}>
                <View style={[styles.emptyIcon, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                  <Ionicons name="location-outline" size={r(40)} color={theme.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No saved addresses</Text>
                <Text style={[styles.emptySubtitle, { color: theme.subText }]}>
                  Add an address to speed up checkout
                </Text>
                <TouchableOpacity
                  style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
                  onPress={() => openAdd("other")}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={r(16)} color={theme.white} />
                  <Text style={styles.emptyAddBtnText}>Add Address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              addresses.map((a) => (
                <AddressCard key={a._id} address={a} onSetDefault={onSetDefault} onRemove={onRemove} />
              ))
            )}
          </ScrollView>
        )}

        {mode === "add" && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            <AddAddressForm
              mode={mode}
              initialLabel={activeLabel}
              onCancel={() => setMode("list")}
              onPickOnMap={openPickMap}
              onSave={saveFromForm}
            />
          </ScrollView>
        )}

        {mode === "pick" && (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
            <View style={[styles.mapCard, { borderColor: theme.border, backgroundColor: theme.card }]}
            >
              <View style={{ height: rv(360), borderRadius: r(16), overflow: "hidden" }}>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={region}
                  region={region}
                  onRegionChangeComplete={(r) => setRegion(r)}
                  onPress={(e) => {
                    const c = e.nativeEvent.coordinate;
                    setMarker({ latitude: c.latitude, longitude: c.longitude });
                  }}
                >
                  <Marker coordinate={marker} draggable />
                </MapView>
              </View>

              <View style={{ padding: r(14), gap: rv(10) }}>
                <Text style={[styles.formTitle, { color: theme.text }]}>Pick exact location</Text>
                <Text style={[styles.formLabel, { color: theme.subText }]}>Address text (for saving)</Text>
                <TextInput
                  style={[styles.input, { borderColor: theme.border, backgroundColor: theme.background, color: theme.text }]}
                  placeholder="Type address or confirm"
                  placeholderTextColor={theme.subText}
                  value={pickedAddressText}
                  onChangeText={setPickedAddressText}
                  multiline
                />

                <View style={{ flexDirection: "row", gap: r(10) }}>
                  <TouchableOpacity style={[styles.btnSecondary, { borderColor: theme.border }]} onPress={() => setMode("add")} activeOpacity={0.85}>
                    <Text style={[styles.btnSecondaryText, { color: theme.primary }]}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: theme.primary }]} onPress={saveFromMap} activeOpacity={0.85}>
                    <Text style={[styles.btnPrimaryText, { color: theme.white }]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        )}
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: r(16),
    paddingTop: rv(8),
    paddingBottom: rv(12),
  },
  backBtn: {
    width: r(36),
    height: r(36),
    borderRadius: r(18),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: rm(18),
    fontWeight: "700",
    textAlign: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(6),
    paddingHorizontal: r(12),
    paddingVertical: rv(8),
    borderRadius: r(20),
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: rm(13),
    fontWeight: "700",
  },

  listContent: {
    paddingHorizontal: r(16),
    paddingTop: rv(10),
    paddingBottom: rv(32),
    gap: rv(12),
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: rv(70),
    paddingHorizontal: r(24),
    gap: rv(10),
  },
  emptyIcon: {
    width: r(88),
    height: r(88),
    borderRadius: r(44),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  emptyTitle: {
    fontSize: rm(17),
    fontWeight: "700",
  },
  emptySubtitle: {
    fontSize: rm(13),
    fontWeight: "400",
    textAlign: "center",
    lineHeight: rm(19),
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: r(6),
    marginTop: rv(16),
    borderRadius: r(14),
    paddingHorizontal: r(24),
    paddingVertical: rv(13),
  },
  emptyAddBtnText: {
    fontSize: rm(14),
    fontWeight: "700",
    color: "#fff",
  },

  card: {
    flexDirection: "row",
    borderRadius: r(16),
    padding: r(16),
    gap: r(14),
    borderWidth: 1,
  },
  iconCircle: {
    width: r(44),
    height: r(44),
    borderRadius: r(22),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  },
  defaultBadge: {
    borderRadius: r(6),
    paddingHorizontal: r(7),
    paddingVertical: rv(2),
  },
  defaultBadgeText: {
    fontSize: rm(9.5),
    fontWeight: "800",
  },
  addressLine: {
    fontSize: rm(12.5),
    fontWeight: "400",
    lineHeight: rm(18),
  },
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
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto" as any,
  },
  removeBtnText: {
    fontSize: rm(12),
    fontWeight: "600",
  },

  // Add / Form
  formCard: {
    borderRadius: r(16),
    borderWidth: 1,
    padding: r(16),
    gap: rv(8),
  },
  formTitle: {
    fontSize: rm(16),
    fontWeight: "800",
  },
  formLabel: {
    fontSize: rm(13),
    fontWeight: "600",
    marginTop: rv(2),
  },
  input: {
    borderWidth: 1,
    borderRadius: r(12),
    paddingHorizontal: r(14),
    paddingVertical: rv(10),
    minHeight: rv(44),
    fontSize: rm(14),
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: r(12),
    paddingVertical: rv(8),
  },
  pillText: {
    fontSize: rm(13),
    fontWeight: "700",
  },

  // Buttons
  btnPrimary: {
    flex: 1,
    borderRadius: r(14),
    paddingVertical: rv(12),
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: {
    fontSize: rm(14),
    fontWeight: "800",
  },
  btnSecondary: {
    flex: 1,
    borderRadius: r(14),
    paddingVertical: rv(12),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  btnSecondaryText: {
    fontSize: rm(14),
    fontWeight: "700",
  },
  cancelText: {
    fontSize: rm(13),
    fontWeight: "600",
  },

  mapCard: {
    borderRadius: r(16),
    borderWidth: 1,
    overflow: "hidden",
  },
});

