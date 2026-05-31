import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native'
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { useDispatch } from 'react-redux'
import { SafeAreaView } from 'react-native-safe-area-context'
import MapView, { Marker, Region, PROVIDER_DEFAULT } from 'react-native-maps'
import * as Location from 'expo-location'
import Ionicons from 'react-native-vector-icons/Ionicons'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { setAddress } from '../../src/redux/store/addressSlice'
import AppBackground from '@/components/AppBackground'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

type LocationType = 'pickup' | 'dropoff'
type ViewMode = 'list' | 'map'

type SavedAddress = {
  id: string
  label: string
  address: string
  icon: 'home' | 'office'
  lat: number
  lng: number
}

type Prediction = {
  place_id: string
  display_name: string
  main_text: string
  secondary_text: string
  lat: string
  lon: string
}

type SearchBarProps = {
  isOnMap?: boolean
  searchText: string
  searchLoading: boolean
  showDropdown: boolean
  predictions: Prediction[]
  locationType: LocationType
  onSearchChange: (text: string) => void
  onClear: () => void
  onPredictionSelect: (prediction: Prediction, confirmNow: boolean) => void
}

const SAVED_ADDRESSES: SavedAddress[] = [
  { id: '1', label: 'Home', address: 'Hazratganj, Lucknow, UP 226001', icon: 'home', lat: 19.076, lng: 72.8777 },
  { id: '2', label: 'Office', address: '456 Business Park, Andheri, MH 400069', icon: 'office', lat: 19.1136, lng: 72.8697 },
]

const DEFAULT_REGION: Region = {
  latitude: 19.076, longitude: 72.8777,
  latitudeDelta: 0.01, longitudeDelta: 0.01,
}

const TEAL = '#1A6B5A'
const TEAL_LIGHT = '#E8F4F1'

// SearchBar component (unchanged)
const SearchBar = ({
  isOnMap = false,
  searchText,
  searchLoading,
  showDropdown,
  predictions,
  locationType,
  onSearchChange,
  onClear,
  onPredictionSelect,
}: SearchBarProps) => (
  <View style={{ zIndex: 999 }}>
    <View style={[styles.searchWrap, isOnMap && styles.searchWrapMap]}>
      {searchLoading
        ? <ActivityIndicator size="small" color={TEAL} style={{ marginRight: 8 }} />
        : <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 8 }} />
      }
      <TextInput
        style={styles.searchInput}
        placeholder={`Search ${locationType === 'pickup' ? 'pickup' : 'drop-off'} location...`}
        placeholderTextColor="#bbb"
        value={searchText}
        onChangeText={onSearchChange}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {searchText.length > 0 && (
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={18} color="#ccc" />
        </TouchableOpacity>
      )}
    </View>

    {/* Dropdown suggestions */}
    {showDropdown && predictions.length > 0 && (
      <View style={[styles.dropdown, isOnMap && styles.dropdownMap]}>
        <FlatList
          data={predictions}
          keyExtractor={(item) => item.place_id}
          keyboardShouldPersistTaps="always"
          scrollEnabled={predictions.length > 4}
          ItemSeparatorComponent={() => <View style={styles.dropdownSep} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.dropdownRow}
              activeOpacity={0.7}
              onPress={() => onPredictionSelect(item, !isOnMap)}
            >
              <View style={styles.dropdownIcon}>
                <MaterialIcons name="location-on" size={16} color={TEAL} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownMain} numberOfLines={1}>{item.main_text}</Text>
                {!!item.secondary_text && (
                  <Text style={styles.dropdownSub} numberOfLines={1}>{item.secondary_text}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={14} color="#ddd" />
            </TouchableOpacity>
          )}
        />
      </View>
    )}
  </View>
)

export default function PickupLocation() {
  const { type } = useLocalSearchParams<{ type: LocationType }>()
  const dispatch = useDispatch()

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchText, setSearchText] = useState('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [fetchingLocation, setFetchingLocation] = useState(false)

  const [region, setRegion] = useState<Region>(DEFAULT_REGION)
  const [markerCoord, setMarkerCoord] = useState({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  })
  const [resolvedAddress, setResolvedAddress] = useState('')
  const [resolving, setResolving] = useState(false)

  const mapRef = useRef<MapView>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Ref to cancel pending reverse geocode timeout
  const reverseGeocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const locationType: LocationType = type === 'dropoff' ? 'dropoff' : 'pickup'
  const title = locationType === 'pickup' ? 'Pickup Location' : 'Drop-off Location'

  // Reverse geocode function (same as before, but we'll call it appropriately)
  const reverseGeocode = async (lat: number, lng: number) => {
    // Prevent endless loading loops
    if (resolving) return
    setResolving(true)
    try {
      const url = `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'KORAApp/1.0' },
      })

      if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)

      const data = await res.json()
      if (data?.display_name) {
        setResolvedAddress(data.display_name)
        return
      }
      throw new Error('Nominatim: empty display_name')
    } catch (e: any) {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
        if (results[0]) {
          const r = results[0]
          setResolvedAddress([r.name, r.street, r.district, r.city, r.region, r.postalCode].filter(Boolean).join(', '))
          return
        }
      } catch (error) {
        // ignore
      }
      // Fallback
      setResolvedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setResolving(false)
    }
  }

  // Debounced version for region changes
  const debouncedReverseGeocode = useCallback((lat: number, lng: number) => {
    if (reverseGeocodeTimeoutRef.current) {
      clearTimeout(reverseGeocodeTimeoutRef.current)
    }
    reverseGeocodeTimeoutRef.current = setTimeout(() => {
      reverseGeocode(lat, lng)
    }, 300)
  }, [])

  // Search places (unchanged)
  const searchPlaces = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setPredictions([])
      setShowDropdown(false)
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    try {
      const url = `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(text)}&countrycodes=in&limit=6&addressdetails=1`
      const res = await fetch(url, {
        headers: { 'Accept-Language': 'en', 'User-Agent': 'KORAApp/1.0' }
      })
      const data = await res.json()

      if (data && data.length > 0) {
        const formatted: Prediction[] = data.map((item: any) => {
          const parts = item.display_name.split(', ')
          return {
            place_id: item.place_id.toString(),
            display_name: item.display_name,
            main_text: parts[0] ?? item.display_name,
            secondary_text: parts.slice(1, 3).join(', '),
            lat: item.lat,
            lon: item.lon,
          }
        })
        setPredictions(formatted)
        setShowDropdown(true)
      } else {
        setPredictions([])
        setShowDropdown(false)
      }
    } catch {
      setPredictions([])
      setShowDropdown(false)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const onSearchChange = useCallback((text: string) => {
    setSearchText(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.trim().length < 2) {
      setPredictions([])
      setShowDropdown(false)
      setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    debounceRef.current = setTimeout(() => searchPlaces(text), 500)
  }, [searchPlaces])

  const handleClear = useCallback(() => {
    setSearchText('')
    setPredictions([])
    setShowDropdown(false)
  }, [])

  const onPredictionSelect = useCallback((prediction: Prediction, confirmNow: boolean) => {
    setSearchText(prediction.main_text);
    setShowDropdown(false);
    setPredictions([]);

    const lat = parseFloat(prediction.lat);
    const lng = parseFloat(prediction.lon);
    if (isNaN(lat) || isNaN(lng)) return;

    const newCoord = { latitude: lat, longitude: lng };
    const newRegion = { ...newCoord, latitudeDelta: 0.008, longitudeDelta: 0.008 };
    setMarkerCoord(newCoord);
    setRegion(newRegion);
    setResolvedAddress(prediction.display_name);
    if (reverseGeocodeTimeoutRef.current) clearTimeout(reverseGeocodeTimeoutRef.current);
    mapRef.current?.animateToRegion(newRegion, 600);

    if (confirmNow) {
      // ✅ Pass coordinates directly
      handleSelect(prediction.display_name, newCoord);
    }
  }, []);

  const handleSelect = (address: string, coords?: { latitude: number; longitude: number }) => {
    const finalCoords = coords || markerCoord;
    console.log(`✅ Confirming ${locationType}:`, { address, coords: finalCoords });

    dispatch(
      setAddress({
        type: locationType,
        address,
        coordinates: [finalCoords.latitude, finalCoords.longitude],
      })
    );
    router.back();
  };

  const fetchCurrentLocation = async (confirmNow = false) => {
    setFetchingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to use this feature.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newCoord = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      const newRegion = { ...newCoord, latitudeDelta: 0.005, longitudeDelta: 0.005 };

      setMarkerCoord(newCoord);
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 800);

      if (confirmNow) {
        // Get address from reverse geocoding
        const url = `${NOMINATIM_URL}/reverse?format=json&lat=${newCoord.latitude}&lon=${newCoord.longitude}&zoom=18`;
        const res = await fetch(url, { headers: { 'User-Agent': 'KORAApp/1.0' } });
        const data = await res.json();
        const address = data.display_name || `${newCoord.latitude}, ${newCoord.longitude}`;
        // ✅ Pass coordinates directly
        handleSelect(address, newCoord);
      } else {
        await reverseGeocode(newCoord.latitude, newCoord.longitude);
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not fetch location.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSavedSelect = (addr: SavedAddress) => {
    const newCoord = { latitude: addr.lat, longitude: addr.lng };
    setMarkerCoord(newCoord);
    setResolvedAddress(addr.address);
    // ✅ Pass coordinates directly
    handleSelect(addr.address, newCoord);
  };
  // Effect to update address when marker moves (due to region change or drag)
  // Using debounced reverse geocode to avoid excessive calls
  useEffect(() => {
    if (viewMode === 'map' && markerCoord.latitude && markerCoord.longitude) {
      debouncedReverseGeocode(markerCoord.latitude, markerCoord.longitude)
    }
    // Cleanup timeout on unmount or when marker changes quickly
    return () => {
      if (reverseGeocodeTimeoutRef.current) {
        clearTimeout(reverseGeocodeTimeoutRef.current)
      }
    }
  }, [markerCoord.latitude, markerCoord.longitude, viewMode])

  // When switching to map mode, ensure we fetch address for current marker
  useEffect(() => {
    if (viewMode === 'map' && markerCoord.latitude && markerCoord.longitude && !resolvedAddress) {
      reverseGeocode(markerCoord.latitude, markerCoord.longitude)
    }
  }, [viewMode])

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <AppBackground>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => { setShowDropdown(false); setViewMode(viewMode === 'list' ? 'map' : 'list') }}
            activeOpacity={0.8}
          >
            {viewMode === 'list'
              ? <><MaterialIcons name="map" size={15} color={TEAL} /><Text style={styles.toggleText}> Map</Text></>
              : <><MaterialIcons name="list" size={15} color={TEAL} /><Text style={styles.toggleText}> List</Text></>
            }
          </TouchableOpacity>
        </View>

        {/* ══ MAP VIEW ══ */}
        {viewMode === 'map' ? (
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_DEFAULT}
              style={StyleSheet.absoluteFillObject}
              region={region}
              onRegionChangeComplete={(r) => {
                // Update markerCoord to center of map
                setMarkerCoord({
                  latitude: r.latitude,
                  longitude: r.longitude,
                })
                setRegion(r)
              }}
              onPress={(e) => {
                // When user taps directly on map, move marker to tapped location
                const { coordinate } = e.nativeEvent
                if (coordinate) {
                  setMarkerCoord({
                    latitude: coordinate.latitude,
                    longitude: coordinate.longitude,
                  })
                  // Animate to new region
                  const newRegion = {
                    ...coordinate,
                    latitudeDelta: region.latitudeDelta,
                    longitudeDelta: region.longitudeDelta,
                  }
                  setRegion(newRegion)
                  mapRef.current?.animateToRegion(newRegion, 300)
                  // Reverse geocode will be triggered by useEffect due to markerCoord change
                }
                setShowDropdown(false)
              }}
              showsUserLocation
              showsMyLocationButton={false}
            >
              <Marker
                draggable
                coordinate={markerCoord}
                onDragEnd={(e) => {
                  const coord = e.nativeEvent.coordinate
                  setMarkerCoord(coord)
                  // Immediately reverse geocode (no debounce for drag)
                  reverseGeocode(coord.latitude, coord.longitude)
                }}
              />
            </MapView>

            {/* Floating search on map */}
            <View style={styles.mapSearchFloat}>
              <SearchBar
                isOnMap
                searchText={searchText}
                searchLoading={searchLoading}
                showDropdown={showDropdown}
                predictions={predictions}
                locationType={locationType}
                onSearchChange={onSearchChange}
                onClear={handleClear}
                onPredictionSelect={onPredictionSelect}
              />
            </View>

            {/* GPS FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => fetchCurrentLocation(false)} activeOpacity={0.85}>
              {fetchingLocation
                ? <ActivityIndicator size="small" color={TEAL} />
                : <MaterialIcons name="my-location" size={22} color={TEAL} />
              }
            </TouchableOpacity>

            {/* Bottom confirm sheet */}
            <View style={styles.mapSheet}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetLabel}>{locationType === 'pickup' ? 'PICKUP FROM' : 'DROP-OFF AT'}</Text>
              {resolving ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <ActivityIndicator size="small" color={TEAL} />
                  <Text style={{ fontSize: 14, color: '#888' }}>Fetching address...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 16 }}>
                  <MaterialIcons name="location-on" size={18} color={TEAL} style={{ marginTop: 2 }} />
                  <Text style={styles.sheetAddress} numberOfLines={2}>
                    {resolvedAddress || 'Drag the pin or tap on map to select a location'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.confirmBtn, (!resolvedAddress || resolving) && styles.confirmDisabled]}
                disabled={!resolvedAddress || resolving}
                onPress={() => resolvedAddress && handleSelect(resolvedAddress)} // markerCoord is already up-to-date
              >
                <MaterialIcons name="check-circle-outline" size={18} color="#fff" />
                <Text style={styles.confirmText}>  Confirm Location</Text>
              </TouchableOpacity>
            </View>
          </View>

        ) : (

          /* ══ LIST VIEW ══ */
          <View style={{ flex: 1 }}>
            <View style={styles.listSearchWrap}>
              <SearchBar
                isOnMap={false}
                searchText={searchText}
                searchLoading={searchLoading}
                showDropdown={showDropdown}
                predictions={predictions}
                locationType={locationType}
                onSearchChange={onSearchChange}
                onClear={handleClear}
                onPredictionSelect={onPredictionSelect}
              />
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: 40 }}
              keyboardShouldPersistTaps="handled"
              onScrollBeginDrag={() => setShowDropdown(false)}
              showsVerticalScrollIndicator={false}
            >
              {/* Pick on Map */}
              <TouchableOpacity style={styles.mapRow} activeOpacity={0.85} onPress={() => setViewMode('map')}>
                <View style={styles.mapRowIcon}>
                  <MaterialCommunityIcons name="map-marker-radius" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.mapRowTitle}>Pick on Map</Text>
                  <Text style={styles.mapRowSub}>Tap or drag the pin to choose</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#c8e8e4" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Current Location */}
              <TouchableOpacity style={styles.listRow} activeOpacity={0.85} onPress={() => fetchCurrentLocation(true)}>
                <View style={styles.listRowIcon}>
                  {fetchingLocation
                    ? <ActivityIndicator size="small" color={TEAL} />
                    : <MaterialIcons name="my-location" size={20} color={TEAL} />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.listRowTitle}>Use Current Location</Text>
                  <Text style={styles.listRowSub}>Detect using GPS</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ccc" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Saved Addresses */}
              <Text style={styles.sectionLabel}>Saved Addresses</Text>
              {SAVED_ADDRESSES.map((addr, idx) => (
                <React.Fragment key={addr.id}>
                  <TouchableOpacity style={styles.listRow} activeOpacity={0.8} onPress={() => handleSavedSelect(addr)}>
                    <View style={styles.savedIcon}>
                      {addr.icon === 'home'
                        ? <MaterialCommunityIcons name="home" size={20} color="#555" />
                        : <MaterialCommunityIcons name="office-building" size={20} color="#555" />
                      }
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listRowTitle}>{addr.label}</Text>
                      <Text style={styles.listRowSub} numberOfLines={1}>{addr.address}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#ccc" />
                  </TouchableOpacity>
                  {idx < SAVED_ADDRESSES.length - 1 && <View style={styles.innerDivider} />}
                </React.Fragment>
              ))}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
      </AppBackground>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  root: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fff',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: TEAL_LIGHT, borderRadius: 20, borderWidth: 1, borderColor: '#c8e8e4',
  },
  toggleText: { fontSize: 13, color: TEAL, fontWeight: '600' },

  listSearchWrap: {
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
    backgroundColor: '#fff', zIndex: 999,
  },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: '#e0e0e0',
    paddingHorizontal: 12, height: 48,
  },
  searchWrapMap: {
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.18,
    shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
    borderColor: '#fff',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#222', paddingVertical: 0 },

  dropdown: {
    marginTop: 4, backgroundColor: '#fff',
    borderRadius: 12, borderWidth: 1, borderColor: '#e8e8e8',
    maxHeight: 300, overflow: 'hidden',
    elevation: 12, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12,
  },
  dropdownMap: { elevation: 20, shadowOpacity: 0.2 },
  dropdownRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 13,
  },
  dropdownIcon: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: TEAL_LIGHT,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  dropdownMain: { fontSize: 14, fontWeight: '600', color: '#1a1a1a' },
  dropdownSub: { fontSize: 12, color: '#999', marginTop: 1 },
  dropdownSep: { height: 1, backgroundColor: '#f5f5f5', marginLeft: 58 },

  mapSearchFloat: {
    position: 'absolute', top: 12, left: 12, right: 12, zIndex: 999,
  },
  fab: {
    position: 'absolute', right: 16, bottom: 240,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
  },
  mapSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#e0e0e0', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetLabel: { fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 1, marginBottom: 8 },
  sheetAddress: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1a1a1a', lineHeight: 22 },

  mapRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 14, marginBottom: 2,
    backgroundColor: TEAL_LIGHT, borderRadius: 14,
    borderWidth: 1, borderColor: '#c8e8e4', padding: 14,
  },
  mapRowIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: TEAL,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  mapRowTitle: { fontSize: 15, fontWeight: '700', color: TEAL },
  mapRowSub: { fontSize: 12, color: '#6aada6', marginTop: 2 },

  listRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  listRowIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0fafa',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
    borderWidth: 1, borderColor: '#d0eeea',
  },
  listRowTitle: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  listRowSub: { fontSize: 12, color: '#888' },

  savedIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
    borderWidth: 1, borderColor: '#e8e8e8',
  },

  divider: { height: 8, backgroundColor: '#f5f5f5', marginVertical: 4 },
  innerDivider: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 70, marginRight: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#aaa', letterSpacing: 1,
    textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
  },

  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: TEAL, borderRadius: 12, paddingVertical: 15,
  },
  confirmDisabled: { backgroundColor: '#ccc' },
  confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})