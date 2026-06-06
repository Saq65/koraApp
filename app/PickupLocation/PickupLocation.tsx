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
  StatusBar,
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
import { getSavedAddresses, createSavedAddress } from '../../src/services/customer'
import { useTheme } from '../../src/theme/ThemeProvider'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

type LocationType = 'pickup' | 'dropoff'
type ViewMode = 'list' | 'map'

type SavedAddress = {
  _id: string
  label: 'home' | 'office' | 'other'
  customLabel?: string | null
  address: string
  coordinates: { lat: number; lng: number }
  isDefault: boolean
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
  theme: any
}

const DEFAULT_REGION: Region = {
  latitude: 19.076, longitude: 72.8777,
  latitudeDelta: 0.01, longitudeDelta: 0.01,
}

const SavedAddressIcon = ({ label, theme }: { label: SavedAddress['label']; theme: any }) => {
  const color = theme.subText
  if (label === 'home') return <MaterialCommunityIcons name="home" size={20} color={color} />
  if (label === 'office') return <MaterialCommunityIcons name="office-building" size={20} color={color} />
  return <MaterialIcons name="location-on" size={20} color={color} />
}

const getDisplayLabel = (addr: SavedAddress): string => {
  if (addr.label === 'other' && addr.customLabel) return addr.customLabel
  return addr.label.charAt(0).toUpperCase() + addr.label.slice(1)
}

// SearchBar component with theme
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
  theme,
}: SearchBarProps) => {
  const styles = getStyles(theme)

  return (
    <View style={{ zIndex: 999 }}>
      <View style={[styles.searchWrap, isOnMap && styles.searchWrapMap]}>
        {searchLoading
          ? <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
          : <Ionicons name="search-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
        }
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${locationType === 'pickup' ? 'pickup' : 'drop-off'} location...`}
          placeholderTextColor={theme.subText}
          value={searchText}
          onChangeText={onSearchChange}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={onClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={theme.subText} />
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && predictions.length > 0 && (
        <View style={[styles.dropdown, isOnMap && styles.dropdownMap]}>
          <FlatList
            data={predictions}
            keyExtractor={(item) => item.place_id}
            keyboardShouldPersistTaps="always"
            scrollEnabled={predictions.length > 4}
            ItemSeparatorComponent={() => <View style={[styles.dropdownSep, { backgroundColor: theme.border }]} />}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dropdownRow}
                activeOpacity={0.7}
                onPress={() => onPredictionSelect(item, !isOnMap)}
              >
                <View style={[styles.dropdownIcon, { backgroundColor: theme.primaryLight }]}>
                  <MaterialIcons name="location-on" size={16} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dropdownMain, { color: theme.text }]} numberOfLines={1}>{item.main_text}</Text>
                  {!!item.secondary_text && (
                    <Text style={[styles.dropdownSub, { color: theme.subText }]} numberOfLines={1}>{item.secondary_text}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={14} color={theme.subText} />
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  )
}

export default function PickupLocation() {
  const { type } = useLocalSearchParams<{ type: LocationType }>()
  const dispatch = useDispatch()
  const { theme, isDarkMode } = useTheme()
  const styles = getStyles(theme)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchText, setSearchText] = useState('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)

  const [region, setRegion] = useState<Region>(DEFAULT_REGION)
  const [markerCoord, setMarkerCoord] = useState({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  })
  const [resolvedAddress, setResolvedAddress] = useState('')
  const [resolving, setResolving] = useState(false)

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [addressesError, setAddressesError] = useState(false)

  const mapRef = useRef<MapView>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reverseGeocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const locationType: LocationType = type === 'dropoff' ? 'dropoff' : 'pickup'
  const title = locationType === 'pickup' ? 'Pickup Location' : 'Drop-off Location'

  // Fetch saved addresses
  const fetchSavedAddresses = useCallback(async () => {
    setAddressesLoading(true)
    setAddressesError(false)
    try {
      const data = await getSavedAddresses()
      setSavedAddresses(data)
    } catch (e) {
      console.error('Failed to load saved addresses:', e)
      setAddressesError(true)
      setSavedAddresses([])
    } finally {
      setAddressesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSavedAddresses()
  }, [fetchSavedAddresses])

  // Save address logic
  const saveAddressWithLabel = async (
    label: 'home' | 'office' | 'other',
    customLabel?: string | null,
    addressOverride?: string,
    coordsOverride?: { latitude: number; longitude: number }
  ) => {
    setSavingAddress(true)
    try {
      const addressToSave = addressOverride ?? resolvedAddress
      const latToSave = coordsOverride?.latitude ?? markerCoord.latitude
      const lngToSave = coordsOverride?.longitude ?? markerCoord.longitude

      await createSavedAddress({
        label,
        customLabel: label === 'other' ? (customLabel ?? null) : null,
        address: addressToSave,
        coordinates: { lat: latToSave, lng: lngToSave },
        isDefault: false,
      })
      Alert.alert('Success', 'Address saved successfully')
      fetchSavedAddresses()
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save address')
    } finally {
      setSavingAddress(false)
    }
  }

  const handleSaveCurrentLocation = async () => {
    if (!resolvedAddress) {
      Alert.alert('No location', 'Please select a location on the map or search first.')
      return
    }
    Alert.alert(
      'Save Address',
      'Choose a label for this address',
      [
        { text: 'Home', onPress: () => saveAddressWithLabel('home') },
        { text: 'Office', onPress: () => saveAddressWithLabel('office') },
        {
          text: 'Other',
          onPress: () => {
            Alert.prompt(
              'Enter custom label',
              'Give this address a name',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Save',
                  onPress: (customLabel) => {
                    if (customLabel && customLabel.trim())
                      saveAddressWithLabel('other', customLabel.trim())
                    else Alert.alert('Error', 'Label cannot be empty')
                  },
                },
              ],
              'plain-text'
            )
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    )
  }

  // Reverse geocode
  const reverseGeocode = async (lat: number, lng: number) => {
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
      } catch { /* ignore */ }
      setResolvedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setResolving(false)
    }
  }

  const debouncedReverseGeocode = useCallback((lat: number, lng: number) => {
    if (reverseGeocodeTimeoutRef.current) clearTimeout(reverseGeocodeTimeoutRef.current)
    reverseGeocodeTimeoutRef.current = setTimeout(() => reverseGeocode(lat, lng), 300)
  }, [])

  // Search places
  const searchPlaces = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setPredictions([]); setShowDropdown(false); setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    try {
      const url = `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(text)}&countrycodes=in&limit=6&addressdetails=1`
      const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'KORAApp/1.0' } })
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
        setPredictions(formatted); setShowDropdown(true)
      } else {
        setPredictions([]); setShowDropdown(false)
      }
    } catch {
      setPredictions([]); setShowDropdown(false)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  const onSearchChange = useCallback((text: string) => {
    setSearchText(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.trim().length < 2) {
      setPredictions([]); setShowDropdown(false); setSearchLoading(false)
      return
    }
    setSearchLoading(true)
    debounceRef.current = setTimeout(() => searchPlaces(text), 500)
  }, [searchPlaces])

  const handleClear = useCallback(() => {
    setSearchText(''); setPredictions([]); setShowDropdown(false)
  }, [])

  const onPredictionSelect = useCallback((prediction: Prediction, confirmNow: boolean) => {
    setSearchText(prediction.main_text)
    setShowDropdown(false)
    setPredictions([])
    const lat = parseFloat(prediction.lat)
    const lng = parseFloat(prediction.lon)
    if (isNaN(lat) || isNaN(lng)) return
    const newCoord = { latitude: lat, longitude: lng }
    const newRegion = { ...newCoord, latitudeDelta: 0.008, longitudeDelta: 0.008 }
    setMarkerCoord(newCoord)
    setRegion(newRegion)
    setResolvedAddress(prediction.display_name)
    if (reverseGeocodeTimeoutRef.current) clearTimeout(reverseGeocodeTimeoutRef.current)
    mapRef.current?.animateToRegion(newRegion, 600)
    if (confirmNow) handleSelect(prediction.display_name, newCoord)
  }, [])

  const handleSelect = (address: string, coords?: { latitude: number; longitude: number }) => {
    const finalCoords = coords || markerCoord
    dispatch(setAddress({ type: locationType, address, coordinates: [finalCoords.latitude, finalCoords.longitude] }))
    router.back()
  }

  const fetchCurrentLocation = async (confirmNow = false) => {
    setFetchingLocation(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to use this feature.')
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const newCoord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      const newRegion = { ...newCoord, latitudeDelta: 0.005, longitudeDelta: 0.005 }
      setMarkerCoord(newCoord)
      setRegion(newRegion)
      mapRef.current?.animateToRegion(newRegion, 800)
      if (confirmNow) {
        const url = `${NOMINATIM_URL}/reverse?format=json&lat=${newCoord.latitude}&lon=${newCoord.longitude}&zoom=18`
        const res = await fetch(url, { headers: { 'User-Agent': 'KORAApp/1.0' } })
        const data = await res.json()
        const address = data.display_name || `${newCoord.latitude}, ${newCoord.longitude}`
        handleSelect(address, newCoord)
      } else {
        await reverseGeocode(newCoord.latitude, newCoord.longitude)
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not fetch location.')
    } finally {
      setFetchingLocation(false)
    }
  }

  const handleSavedSelect = (addr: SavedAddress) => {
    const newCoord = {
      latitude: addr.coordinates.lat,
      longitude: addr.coordinates.lng,
    }
    setMarkerCoord(newCoord)
    setResolvedAddress(addr.address)
    handleSelect(addr.address, newCoord)
  }

  useEffect(() => {
    if (viewMode === 'map' && markerCoord.latitude && markerCoord.longitude) {
      debouncedReverseGeocode(markerCoord.latitude, markerCoord.longitude)
    }
    return () => { if (reverseGeocodeTimeoutRef.current) clearTimeout(reverseGeocodeTimeoutRef.current) }
  }, [markerCoord.latitude, markerCoord.longitude, viewMode])

  useEffect(() => {
    if (viewMode === 'map' && markerCoord.latitude && markerCoord.longitude && !resolvedAddress) {
      reverseGeocode(markerCoord.latitude, markerCoord.longitude)
    }
  }, [viewMode])

  const renderSavedAddresses = () => {
    if (addressesLoading) {
      return (
        <View style={styles.savedFeedback}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.savedFeedbackText, { color: theme.subText }]}>Loading saved addresses...</Text>
        </View>
      )
    }
    if (addressesError) {
      return (
        <TouchableOpacity style={styles.savedFeedback} onPress={fetchSavedAddresses}>
          <MaterialIcons name="refresh" size={18} color={theme.primary} />
          <Text style={[styles.savedFeedbackText, { color: theme.primary }]}>Failed to load. Tap to retry.</Text>
        </TouchableOpacity>
      )
    }
    if (savedAddresses.length === 0) {
      return (
        <View style={styles.savedFeedback}>
          <MaterialIcons name="bookmark-border" size={18} color={theme.subText} />
          <Text style={[styles.savedFeedbackText, { color: theme.subText }]}>No saved addresses yet.</Text>
        </View>
      )
    }
    return savedAddresses.map((addr, idx) => (
      <React.Fragment key={addr._id}>
        <TouchableOpacity style={styles.listRow} activeOpacity={0.8} onPress={() => handleSavedSelect(addr)}>
          <View style={[styles.savedIcon, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
            <SavedAddressIcon label={addr.label} theme={theme} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.listRowTitle, { color: theme.text }]}>{getDisplayLabel(addr)}</Text>
              {addr.isDefault && (
                <View style={[styles.defaultBadge, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                  <Text style={[styles.defaultBadgeText, { color: theme.primary }]}>Default</Text>
                </View>
              )}
            </View>
            <Text style={[styles.listRowSub, { color: theme.subText }]} numberOfLines={1}>{addr.address}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.subText} />
        </TouchableOpacity>
        {idx < savedAddresses.length - 1 && <View style={[styles.innerDivider, { backgroundColor: theme.border }]} />}
      </React.Fragment>
    ))
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <AppBackground>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
            <TouchableOpacity
              style={[styles.toggleBtn, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
              onPress={() => { setShowDropdown(false); setViewMode(viewMode === 'list' ? 'map' : 'list') }}
              activeOpacity={0.8}
            >
              {viewMode === 'list'
                ? <><MaterialIcons name="map" size={15} color={theme.primary} /><Text style={[styles.toggleText, { color: theme.primary }]}> Map</Text></>
                : <><MaterialIcons name="list" size={15} color={theme.primary} /><Text style={[styles.toggleText, { color: theme.primary }]}> List</Text></>
              }
            </TouchableOpacity>
          </View>

          {/* MAP VIEW */}
          {viewMode === 'map' ? (
            <View style={{ flex: 1 }}>
              <MapView
                ref={mapRef}
                provider={PROVIDER_DEFAULT}
                style={StyleSheet.absoluteFillObject}
                region={region}
                onRegionChangeComplete={(r) => {
                  setMarkerCoord({ latitude: r.latitude, longitude: r.longitude })
                  setRegion(r)
                }}
                onPress={(e) => {
                  const { coordinate } = e.nativeEvent
                  if (coordinate) {
                    setMarkerCoord({ latitude: coordinate.latitude, longitude: coordinate.longitude })
                    const newRegion = { ...coordinate, latitudeDelta: region.latitudeDelta, longitudeDelta: region.longitudeDelta }
                    setRegion(newRegion)
                    mapRef.current?.animateToRegion(newRegion, 300)
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
                    reverseGeocode(coord.latitude, coord.longitude)
                  }}
                />
              </MapView>

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
                  theme={theme}
                />
              </View>

              <TouchableOpacity style={[styles.fab, { backgroundColor: theme.card }]} onPress={() => fetchCurrentLocation(false)} activeOpacity={0.85}>
                {fetchingLocation
                  ? <ActivityIndicator size="small" color={theme.primary} />
                  : <MaterialIcons name="my-location" size={22} color={theme.primary} />
                }
              </TouchableOpacity>

              {/* Bottom sheet */}
              <View style={[styles.mapSheet, { backgroundColor: theme.card }]}>
                <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
                <Text style={[styles.sheetLabel, { color: theme.subText }]}>{locationType === 'pickup' ? 'PICKUP FROM' : 'DROP-OFF AT'}</Text>
                {resolving ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={{ fontSize: 14, color: theme.subText }}>Fetching address...</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 16 }}>
                    <MaterialIcons name="location-on" size={18} color={theme.primary} style={{ marginTop: 2 }} />
                    <Text style={[styles.sheetAddress, { color: theme.text }]} numberOfLines={2}>
                      {resolvedAddress || 'Drag the pin or tap on map to select a location'}
                    </Text>
                  </View>
                )}
                {!!resolvedAddress && !resolving && (
                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: theme.secondary || theme.primary }, savingAddress && styles.saveBtnDisabled]}
                    onPress={handleSaveCurrentLocation}
                    disabled={savingAddress}
                  >
                    {savingAddress ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialIcons name="save" size={18} color="#fff" />
                        <Text style={styles.saveBtnText}>  Save this location</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.confirmBtn, (!resolvedAddress || resolving) && styles.confirmDisabled]}
                  disabled={!resolvedAddress || resolving}
                  onPress={() => resolvedAddress && handleSelect(resolvedAddress)}
                >
                  <MaterialIcons name="check-circle-outline" size={18} color="#fff" />
                  <Text style={styles.confirmText}>  Confirm Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* LIST VIEW */
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
                  theme={theme}
                />
              </View>

              <ScrollView
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={() => setShowDropdown(false)}
                showsVerticalScrollIndicator={false}
              >
                <TouchableOpacity style={[styles.mapRow, { backgroundColor: theme.primaryLight, borderColor: theme.border }]} activeOpacity={0.85} onPress={() => setViewMode('map')}>
                  <View style={[styles.mapRowIcon, { backgroundColor: theme.primary }]}>
                    <MaterialCommunityIcons name="map-marker-radius" size={22} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.mapRowTitle, { color: theme.primary }]}>Pick on Map</Text>
                    <Text style={[styles.mapRowSub, { color: theme.subText }]}>Tap or drag the pin to choose</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.subText} />
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <TouchableOpacity style={styles.listRow} activeOpacity={0.85} onPress={() => fetchCurrentLocation(true)}>
                  <View style={[styles.listRowIcon, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                    {fetchingLocation
                      ? <ActivityIndicator size="small" color={theme.primary} />
                      : <MaterialIcons name="my-location" size={20} color={theme.primary} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listRowTitle, { color: theme.text }]}>Use Current Location</Text>
                    <Text style={[styles.listRowSub, { color: theme.subText }]}>Detect using GPS</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.subText} />
                </TouchableOpacity>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <Text style={[styles.sectionLabel, { color: theme.subText }]}>Saved Addresses</Text>
                {renderSavedAddresses()}

                {/* Add New Address button */}
                <TouchableOpacity
                  style={[styles.addAddressRow, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
                  onPress={async () => {
                    setFetchingLocation(true)
                    try {
                      const { status } = await Location.requestForegroundPermissionsAsync()
                      if (status !== 'granted') {
                        Alert.alert('Permission Denied', 'Allow location access to save your current location.')
                        return
                      }
                      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
                      const coord = { lat: loc.coords.latitude, lng: loc.coords.longitude }
                      const url = `${NOMINATIM_URL}/reverse?format=json&lat=${coord.lat}&lon=${coord.lng}&zoom=18`
                      const res = await fetch(url, { headers: { 'User-Agent': 'KORAApp/1.0' } })
                      const data = await res.json()
                      const address = data.display_name || `${coord.lat}, ${coord.lng}`
                      await saveAddressWithLabel('other', address, { latitude: coord.lat, longitude: coord.lng })
                      fetchSavedAddresses()
                      setShowDropdown(false)
                    } catch (err: any) {
                      Alert.alert('Error', err.message || 'Could not fetch current location')
                    } finally {
                      setFetchingLocation(false)
                    }
                  }}
                >
                  <MaterialIcons name="add-location" size={22} color={theme.primary} />
                  <Text style={[styles.addAddressText, { color: theme.primary }]}>Add current location as saved address</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      </AppBackground>
    </SafeAreaView>
  )
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    safeArea: { flex: 1 },
    root: { flex: 1 },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    headerTitle: { fontSize: 17, fontWeight: '700' },
    toggleBtn: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 7,
      borderRadius: 20, borderWidth: 1,
    },
    toggleText: { fontSize: 13, fontWeight: '600' },

    listSearchWrap: {
      paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4,
      zIndex: 999,
    },
    searchWrap: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.card, borderRadius: 12,
      borderWidth: 1, borderColor: theme.border,
      paddingHorizontal: 12, height: 48,
    },
    searchWrapMap: {
      elevation: 10, shadowColor: '#000', shadowOpacity: 0.18,
      shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
      borderColor: theme.card,
    },
    searchInput: { flex: 1, fontSize: 14, color: theme.text, paddingVertical: 0 },

    dropdown: {
      marginTop: 4, backgroundColor: theme.card,
      borderRadius: 12, borderWidth: 1, borderColor: theme.border,
      maxHeight: 300, overflow: 'hidden',
      elevation: 12, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12,
    },
    dropdownMap: { elevation: 20, shadowOpacity: 0.2 },
    dropdownRow: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 14, paddingVertical: 13,
    },
    dropdownIcon: {
      width: 32, height: 32, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    dropdownMain: { fontSize: 14, fontWeight: '600' },
    dropdownSub: { fontSize: 12, marginTop: 1 },
    dropdownSep: { height: 1, marginLeft: 58 },

    mapSearchFloat: {
      position: 'absolute', top: 12, left: 12, right: 12, zIndex: 999,
    },
    fab: {
      position: 'absolute', right: 16, bottom: 240,
      width: 48, height: 48, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center',
      elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
    },
    mapSheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12,
      elevation: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16,
    },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    sheetLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
    sheetAddress: { flex: 1, fontSize: 15, fontWeight: '600', lineHeight: 22 },

    mapRow: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginTop: 14, marginBottom: 2,
      borderRadius: 14, borderWidth: 1, padding: 14,
    },
    mapRowIcon: {
      width: 44, height: 44, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center', marginRight: 14,
    },
    mapRowTitle: { fontSize: 15, fontWeight: '700' },
    mapRowSub: { fontSize: 12, marginTop: 2 },

    listRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    listRowIcon: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center', marginRight: 14,
      borderWidth: 1,
    },
    listRowTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
    listRowSub: { fontSize: 12 },

    savedIcon: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center', marginRight: 14,
      borderWidth: 1,
    },

    savedFeedback: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingHorizontal: 16, paddingVertical: 14,
    },
    savedFeedbackText: { fontSize: 13 },

    defaultBadge: {
      borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
      borderWidth: 1,
    },
    defaultBadgeText: { fontSize: 10, fontWeight: '700' },

    divider: { height: 1, marginVertical: 4 },
    innerDivider: { height: 1, marginLeft: 70, marginRight: 16 },
    sectionLabel: {
      fontSize: 11, fontWeight: '700', letterSpacing: 1,
      textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
    },

    confirmBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 15,
      marginTop: 12,
    },
    confirmDisabled: { backgroundColor: theme.subText },
    confirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    saveBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      borderRadius: 12, paddingVertical: 12,
      marginBottom: 8,
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

    addAddressRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      marginHorizontal: 16, marginVertical: 12,
      paddingVertical: 12, paddingHorizontal: 16,
      borderRadius: 14, borderWidth: 1,
    },
    addAddressText: { fontSize: 14, fontWeight: '500' },
  })