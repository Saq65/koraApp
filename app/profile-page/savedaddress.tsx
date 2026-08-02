import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import MapView, { Marker, Region } from "react-native-maps";
import * as Location from "expo-location";
import { useTranslation } from "react-i18next";

import { useTheme } from "../../src/theme/ThemeProvider";
import AppBackground from "@/components/AppBackground";
import {
  getSavedAddresses,
  createSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
} from "../../src/services/customer";

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

function AddressIcon({
  type,
  color,
}: {
  type: AddressType;
  color: string;
}) {
  switch (type) {
    case "home":
      return <Ionicons name="home-outline" size={r(22)} color={color} />;
    case "office":
      return (
        <MaterialCommunityIcons
          name="briefcase-outline"
          size={r(22)}
          color={color}
        />
      );
    default:
      return (
        <Ionicons name="location-outline" size={r(22)} color={color} />
      );
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
  const { theme } = useTheme();
  const { t } = useTranslation();

  const labelText =
    address.label === "other" && address.customLabel
      ? address.customLabel
      : t(`saved_address_page.${address.label}`);

  return (
    <View
      style={[
        styles.card,
        {
          borderColor: theme.border,
          backgroundColor: theme.card,
          shadowColor: theme.text,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.primaryLight,
            borderColor: theme.border,
          },
        ]}
      >
        <AddressIcon type={address.label} color={theme.primary} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.labelRow}>
          <Text style={[styles.cardLabel, { color: theme.text }]}>
            {labelText}
          </Text>

          {address.isDefault && (
            <View
              style={[
                styles.defaultBadge,
                { backgroundColor: theme.primaryLight },
              ]}
            >
              <Text
                style={[
                  styles.defaultBadgeText,
                  { color: theme.secondary ?? theme.primary },
                ]}
              >
                {t("saved_address_page.default")}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[styles.addressLine, { color: theme.subText }]}
          numberOfLines={2}
        >
          {address.address}
        </Text>

        <View style={styles.actionsRow}>
          {!address.isDefault && (
            <TouchableOpacity
              style={styles.defaultBtn}
              onPress={() => onSetDefault(address._id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="star-outline"
                size={r(13)}
                color={theme.primary}
                style={{ marginRight: r(4) }}
              />
              <Text
                style={[
                  styles.defaultBtnText,
                  { color: theme.primary },
                ]}
              >
                {t("saved_address_page.set_as_default")}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.removeBtn,
              address.isDefault && { marginLeft: 0 },
            ]}
            onPress={() => onRemove(address._id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="trash-outline"
              size={r(13)}
              color={theme.red ?? "#e53935"}
              style={{ marginRight: r(4) }}
            />
            <Text
              style={[
                styles.removeBtnText,
                { color: theme.red ?? "#e53935" },
              ]}
            >
              {t("saved_address_page.remove")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function AddAddressForm({
  initialLabel,
  onCancel,
  onPickOnMap,
  onSave,
}: {
  initialLabel: AddressType;
  onCancel: () => void;
  onPickOnMap: (
    label: AddressType,
    customLabel: string | null
  ) => void;
  onSave: (payload: {
    label: AddressType;
    customLabel: string | null;
    address: string;
  }) => void;
}) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [label, setLabel] = useState<AddressType>(initialLabel);
  const [customLabel, setCustomLabel] = useState("");
  const [addressText, setAddressText] = useState("");

  useEffect(() => {
    setLabel(initialLabel);
  }, [initialLabel]);

  const labelOptions: Array<{ key: AddressType; text: string }> = [
    { key: "home", text: t("saved_address_page.home") },
    { key: "office", text: t("saved_address_page.office") },
    { key: "other", text: t("saved_address_page.other") },
  ];

  return (
    <View style={{ gap: rv(12) }}>
      <View
        style={[
          styles.formCard,
          {
            borderColor: theme.border,
            backgroundColor: theme.card,
          },
        ]}
      >
        <Text style={[styles.formTitle, { color: theme.text }]}>
          {t("saved_address_page.add_saved_address")}
        </Text>

        <Text style={[styles.formLabel, { color: theme.subText }]}>
          {t("saved_address_page.label")}
        </Text>

        <View style={styles.pillRow}>
          {labelOptions.map((item) => {
            const active = label === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.pill,
                  {
                    borderColor: active
                      ? theme.primary
                      : theme.border,
                    backgroundColor: active
                      ? theme.primaryLight
                      : theme.card,
                  },
                ]}
                onPress={() => setLabel(item.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: active
                        ? theme.primary
                        : theme.subText,
                    },
                  ]}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {label === "other" && (
          <>
            <Text
              style={[
                styles.formLabel,
                {
                  color: theme.subText,
                  marginTop: rv(10),
                },
              ]}
            >
              {t("saved_address_page.custom_label")}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  color: theme.text,
                },
              ]}
              placeholder={t(
                "saved_address_page.custom_label_placeholder"
              )}
              placeholderTextColor={theme.subText}
              value={customLabel}
              onChangeText={setCustomLabel}
            />
          </>
        )}

        <Text
          style={[
            styles.formLabel,
            {
              color: theme.subText,
              marginTop: rv(10),
            },
          ]}
        >
          {t("saved_address_page.address")}
        </Text>

        <TextInput
          style={[
            styles.input,
            styles.multilineInput,
            {
              borderColor: theme.border,
              backgroundColor: theme.background,
              color: theme.text,
            },
          ]}
          placeholder={t(
            "saved_address_page.address_placeholder"
          )}
          placeholderTextColor={theme.subText}
          value={addressText}
          onChangeText={setAddressText}
          multiline
          textAlignVertical="top"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.btnSecondary,
              { borderColor: theme.border },
            ]}
            onPress={() =>
              onPickOnMap(
                label,
                label === "other"
                  ? customLabel.trim() || null
                  : null
              )
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="map-outline"
              size={r(16)}
              color={theme.primary}
              style={{ marginRight: r(6) }}
            />
            <Text
              style={[
                styles.btnSecondaryText,
                { color: theme.primary },
              ]}
            >
              {t("saved_address_page.pick_on_map")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btnPrimary,
              { backgroundColor: theme.primary },
            ]}
            onPress={() => {
              const address = addressText.trim();
              const custom =
                label === "other"
                  ? customLabel.trim() || null
                  : null;

              if (!address) {
                Alert.alert(
                  t("saved_address_page.missing_address_title"),
                  t("saved_address_page.missing_address_message")
                );
                return;
              }

              if (label === "other" && !custom) {
                Alert.alert(
                  t(
                    "saved_address_page.missing_custom_label_title"
                  ),
                  t(
                    "saved_address_page.missing_custom_label_message"
                  )
                );
                return;
              }

              onSave({
                label,
                customLabel: custom,
                address,
              });
            }}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.btnPrimaryText,
                { color: theme.white },
              ]}
            >
              {t("saved_address_page.save")}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.cancelText, { color: theme.subText }]}
          >
            {t("saved_address_page.cancel")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SavedAddressScreen() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<FormMode>("list");
  const [activeLabel, setActiveLabel] =
    useState<AddressType>("other");
  const [activeCustomLabel, setActiveCustomLabel] =
    useState<string | null>(null);

  const [region, setRegion] =
    useState<Region>(DEFAULT_REGION);
  const [marker, setMarker] = useState({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });
  const [pickedAddressText, setPickedAddressText] =
    useState("");
  const [isLoadingLocation, setIsLoadingLocation] =
    useState(false);

  const getCurrentLocation = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      throw new Error(
        t("saved_address_page.location_permission_denied")
      );
    }

    const location =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  const fetchAll = async () => {
    setLoading(true);

    try {
      const data = await getSavedAddresses();
      setAddresses(data);
    } catch (error: any) {
      Alert.alert(
        t("saved_address_page.error"),
        error?.message ??
          t("saved_address_page.load_failed")
      );
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
    } catch (error: any) {
      Alert.alert(
        t("saved_address_page.error"),
        error?.message ??
          t("saved_address_page.set_default_failed")
      );
    }
  };

  const onRemove = (id: string) => {
    Alert.alert(
      t("saved_address_page.remove_address_title"),
      t("saved_address_page.remove_address_message"),
      [
        {
          text: t("saved_address_page.cancel"),
          style: "cancel",
        },
        {
          text: t("saved_address_page.remove"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavedAddress(id);
              await fetchAll();
            } catch (error: any) {
              Alert.alert(
                t("saved_address_page.error"),
                error?.message ??
                  t("saved_address_page.remove_failed")
              );
            }
          },
        },
      ]
    );
  };

  const openAdd = (label: AddressType = "other") => {
    setActiveLabel(label);
    setActiveCustomLabel(null);
    setMode("add");
  };

  const openPickMap = async (
    label: AddressType,
    customLabel: string | null
  ) => {
    setActiveLabel(label);
    setActiveCustomLabel(customLabel);
    setPickedAddressText("");
    setMode("pick");

    try {
      setIsLoadingLocation(true);

      const currentLocation = await getCurrentLocation();
      const newRegion = {
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      setMarker(currentLocation);
    } catch (error: any) {
      Alert.alert(
        t("saved_address_page.location_error"),
        error?.message ??
          t("saved_address_page.current_location_failed")
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const saveFromForm = async (payload: {
    label: AddressType;
    customLabel: string | null;
    address: string;
  }) => {
    try {
      Alert.alert(
        t("saved_address_page.location_needed_title"),
        t("saved_address_page.location_needed_message")
      );

      setActiveLabel(payload.label);
      setActiveCustomLabel(payload.customLabel);
      setPickedAddressText(payload.address);
      setMode("pick");
    } catch (error: any) {
      Alert.alert(
        t("saved_address_page.error"),
        error?.message ??
          t("saved_address_page.prepare_save_failed")
      );
    }
  };

  const saveFromMap = async () => {
    try {
      const address = pickedAddressText.trim();

      if (!address) {
        Alert.alert(
          t("saved_address_page.confirm_address_title"),
          t("saved_address_page.confirm_address_message")
        );
        return;
      }

      await createSavedAddress({
        label: activeLabel,
        customLabel:
          activeLabel === "other"
            ? activeCustomLabel
            : null,
        address,
        coordinates: {
          lat: marker.latitude,
          lng: marker.longitude,
        },
        isDefault: false,
      } as any);

      await fetchAll();
      setMode("list");
    } catch (error: any) {
      Alert.alert(
        t("saved_address_page.error"),
        error?.message ??
          t("saved_address_page.create_failed")
      );
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: theme.background,
      }}
      edges={["top", "left", "right"]}
    >
      <AppBackground>
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.backBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{
              top: 10,
              bottom: 10,
              left: 10,
              right: 10,
            }}
          >
            <Ionicons
              name="arrow-back"
              size={r(20)}
              color={theme.text}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              { color: theme.text },
            ]}
          >
            {t("saved_address_page.title")}
          </Text>

          <TouchableOpacity
            style={[
              styles.addBtn,
              {
                backgroundColor: theme.primaryLight,
                borderColor: theme.primary,
              },
            ]}
            onPress={() => openAdd("other")}
            activeOpacity={0.85}
          >
            <Ionicons
              name="add"
              size={r(16)}
              color={theme.primary}
            />
            <Text
              style={[
                styles.addBtnText,
                { color: theme.primary },
              ]}
            >
              {t("saved_address_page.add")}
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "list" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={{ color: theme.subText }}>
                  {t("saved_address_page.loading")}
                </Text>
              </View>
            ) : addresses.length === 0 ? (
              <View style={styles.emptyState}>
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor: theme.primaryLight,
                      borderColor: theme.primary,
                    },
                  ]}
                >
                  <Ionicons
                    name="location-outline"
                    size={r(40)}
                    color={theme.primary}
                  />
                </View>

                <Text
                  style={[
                    styles.emptyTitle,
                    { color: theme.text },
                  ]}
                >
                  {t(
                    "saved_address_page.no_saved_addresses"
                  )}
                </Text>

                <Text
                  style={[
                    styles.emptySubtitle,
                    { color: theme.subText },
                  ]}
                >
                  {t("saved_address_page.empty_subtitle")}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.emptyAddBtn,
                    { backgroundColor: theme.primary },
                  ]}
                  onPress={() => openAdd("other")}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="add"
                    size={r(16)}
                    color={theme.white}
                  />
                  <Text
                    style={[
                      styles.emptyAddBtnText,
                      { color: theme.white },
                    ]}
                  >
                    {t("saved_address_page.add_address")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              addresses.map((address) => (
                <AddressCard
                  key={address._id}
                  address={address}
                  onSetDefault={onSetDefault}
                  onRemove={onRemove}
                />
              ))
            )}
          </ScrollView>
        )}

        {mode === "add" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            <AddAddressForm
              initialLabel={activeLabel}
              onCancel={() => setMode("list")}
              onPickOnMap={openPickMap}
              onSave={saveFromForm}
            />
          </ScrollView>
        )}

        {mode === "pick" && (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                styles.mapCard,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.card,
                },
              ]}
            >
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={region}
                  region={region}
                  onRegionChangeComplete={setRegion}
                  onPress={(event) => {
                    const coordinate =
                      event.nativeEvent.coordinate;

                    setMarker({
                      latitude: coordinate.latitude,
                      longitude: coordinate.longitude,
                    });
                  }}
                >
                  <Marker
                    coordinate={marker}
                    draggable
                    onDragEnd={(event) => {
                      const coordinate =
                        event.nativeEvent.coordinate;

                      setMarker({
                        latitude: coordinate.latitude,
                        longitude: coordinate.longitude,
                      });
                    }}
                  />
                </MapView>
              </View>

              {isLoadingLocation && (
                <View
                  style={[
                    styles.locationLoadingOverlay,
                    {
                      backgroundColor:
                        theme.background + "E6",
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.locationLoadingText,
                      { color: theme.text },
                    ]}
                  >
                    {t(
                      "saved_address_page.getting_current_location"
                    )}
                  </Text>
                </View>
              )}

              <View style={styles.mapFormContent}>
                <Text
                  style={[
                    styles.formTitle,
                    { color: theme.text },
                  ]}
                >
                  {t(
                    "saved_address_page.pick_exact_location"
                  )}
                </Text>

                <Text
                  style={[
                    styles.formLabel,
                    { color: theme.subText },
                  ]}
                >
                  {t("saved_address_page.address_text")}
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    styles.multilineInput,
                    {
                      borderColor: theme.border,
                      backgroundColor: theme.background,
                      color: theme.text,
                    },
                  ]}
                  placeholder={t(
                    "saved_address_page.address_confirm_placeholder"
                  )}
                  placeholderTextColor={theme.subText}
                  value={pickedAddressText}
                  onChangeText={setPickedAddressText}
                  multiline
                  textAlignVertical="top"
                />

                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.btnSecondary,
                      { borderColor: theme.border },
                    ]}
                    onPress={() => setMode("add")}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.btnSecondaryText,
                        { color: theme.primary },
                      ]}
                    >
                      {t("saved_address_page.back")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.btnPrimary,
                      { backgroundColor: theme.primary },
                    ]}
                    onPress={saveFromMap}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.btnPrimaryText,
                        { color: theme.white },
                      ]}
                    >
                      {t("saved_address_page.save")}
                    </Text>
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
    minWidth: 0,
    paddingHorizontal: r(8),
    fontSize: rm(18),
    fontWeight: "700",
    textAlign: "center",
  },
  addBtn: {
    minWidth: r(70),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: r(5),
    paddingHorizontal: r(10),
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
  },
  loadingContainer: {
    paddingVertical: rv(40),
    alignItems: "center",
  },
  locationLoadingOverlay: {
    position: "absolute",
    top: rv(16),
    left: r(16),
    right: r(16),
    padding: rv(10),
    borderRadius: r(12),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  locationLoadingText: {
    fontSize: rm(14),
    fontWeight: "600",
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: rv(70),
    paddingHorizontal: r(24),
  },
  emptyIcon: {
    width: r(88),
    height: r(88),
    borderRadius: r(44),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    marginBottom: rv(14),
  },
  emptyTitle: {
    fontSize: rm(17),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: rv(7),
  },
  emptySubtitle: {
    fontSize: rm(13),
    textAlign: "center",
    lineHeight: rm(19),
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: r(6),
    marginTop: rv(20),
    borderRadius: r(14),
    paddingHorizontal: r(24),
    paddingVertical: rv(13),
  },
  emptyAddBtnText: {
    fontSize: rm(14),
    fontWeight: "700",
  },
  card: {
    flexDirection: "row",
    borderRadius: r(16),
    padding: r(16),
    borderWidth: 1,
    marginBottom: rv(12),
  },
  iconCircle: {
    width: r(44),
    height: r(44),
    borderRadius: r(22),
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginRight: r(14),
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: rv(4),
  },
  cardLabel: {
    fontSize: rm(15),
    fontWeight: "700",
    marginRight: r(8),
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
    lineHeight: rm(18),
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: rv(10),
  },
  defaultBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: r(16),
    marginBottom: rv(4),
  },
  defaultBtnText: {
    fontSize: rm(12),
    fontWeight: "600",
  },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    marginBottom: rv(4),
  },
  removeBtnText: {
    fontSize: rm(12),
    fontWeight: "600",
  },
  formCard: {
    borderRadius: r(16),
    borderWidth: 1,
    padding: r(16),
  },
  formTitle: {
    fontSize: rm(16),
    fontWeight: "800",
    marginBottom: rv(12),
  },
  formLabel: {
    fontSize: rm(13),
    fontWeight: "600",
    marginBottom: rv(7),
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: rv(4),
  },
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: r(12),
    paddingVertical: rv(8),
    marginRight: r(8),
    marginBottom: rv(8),
  },
  pillText: {
    fontSize: rm(13),
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderRadius: r(12),
    paddingHorizontal: r(14),
    paddingVertical: rv(10),
    minHeight: rv(44),
    fontSize: rm(14),
    marginBottom: rv(4),
  },
  multilineInput: {
    minHeight: rv(76),
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: rv(12),
  },
  btnPrimary: {
    flex: 1,
    minHeight: rv(46),
    borderRadius: r(14),
    paddingHorizontal: r(10),
    paddingVertical: rv(11),
    alignItems: "center",
    justifyContent: "center",
    marginLeft: r(5),
  },
  btnPrimaryText: {
    fontSize: rm(14),
    fontWeight: "800",
    textAlign: "center",
  },
  btnSecondary: {
    flex: 1,
    minHeight: rv(46),
    flexDirection: "row",
    borderRadius: r(14),
    paddingHorizontal: r(8),
    paddingVertical: rv(11),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginRight: r(5),
  },
  btnSecondaryText: {
    flexShrink: 1,
    fontSize: rm(14),
    fontWeight: "700",
    textAlign: "center",
  },
  cancelButton: {
    alignItems: "center",
    marginTop: rv(14),
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
  mapContainer: {
    height: rv(360),
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  mapFormContent: {
    padding: r(14),
  },
});