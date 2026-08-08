import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, FlatList,
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
import { useTranslation } from 'react-i18next'
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
  placeholder: string
  onSearchChange: (text: string) => void
  onClear: () => void
  onPredictionSelect: (prediction: Prediction, confirmNow: boolean) => void
}



const SavedAddressIcon = ({ label }: { label: SavedAddress['label'] }) => {
  const { theme } = useTheme()
  if (label === 'home') return <MaterialCommunityIcons name="home" size={20} color={theme.primary} />
  if (label === 'office') return <MaterialCommunityIcons name="office-building" size={20} color={theme.primary} />
  return <MaterialIcons name="location-on" size={20} color={theme.primary} />
}

const getDisplayLabel = (addr: SavedAddress, t: any): string => {
  if (addr.label === 'other' && addr.customLabel) return addr.customLabel
  return t(`location.${addr.label}`)
}

/* ── SearchBar ── */
const SearchBar = ({
  isOnMap = false,
  searchText, searchLoading, showDropdown, predictions, placeholder,
  onSearchChange, onClear, onPredictionSelect,
}: SearchBarProps) => {
  const { theme, isDarkMode } = useTheme()
  const styles = createStyles(theme, isDarkMode)

  return (
  <View style={{ zIndex: 999 }}>
    <View style={[styles.searchWrap, isOnMap && styles.searchWrapMap]}>
      {searchLoading
        ? <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
        : <Ionicons name="search-outline" size={18} color={theme.subText} style={{ marginRight: 8 }} />
      }
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
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
          ItemSeparatorComponent={() => <View style={styles.dropdownSep} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.dropdownRow}
              activeOpacity={0.7}
              onPress={() => onPredictionSelect(item, !isOnMap)}
            >
              <View style={styles.dropdownIcon}>
                <MaterialIcons name="location-on" size={16} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dropdownMain} numberOfLines={1}>{item.main_text}</Text>
                {!!item.secondary_text && (
                  <Text style={styles.dropdownSub} numberOfLines={1}>{item.secondary_text}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={14} color={theme.border} />
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
  const { t } = useTranslation()
  const { theme, isDarkMode } = useTheme()
  const styles = createStyles(theme, isDarkMode)

  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchText, setSearchText] = useState('')
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [savingAddress, setSavingAddress] = useState(false)

  const [region, setRegion] = useState<Region | null>(null)
  const [markerCoord, setMarkerCoord] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationResolved, setLocationResolved] = useState(false)
  const [resolvedAddress, setResolvedAddress] = useState('')
  const [resolving, setResolving] = useState(false)

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [addressesError, setAddressesError] = useState(false)

  const mapRef = useRef<MapView>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reverseGeocodeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const locationType: LocationType = type === 'dropoff' ? 'dropoff' : 'pickup'
  const title = locationType === 'pickup' ? t('location.pickup_location') : t('location.dropoff_location')
  const sheetLabel = locationType === 'pickup' ? t('location.pickup_from') : t('location.dropoff_at')
  const searchPlaceholder = locationType === 'pickup' ? t('location.search_pickup') : t('location.search_dropoff')

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

  useEffect(() => { fetchSavedAddresses() }, [fetchSavedAddresses])

  useEffect(() => {
    const initializeLocation = async () => {
      try {
        await fetchCurrentLocation(false, false)
      } catch (error) {
        console.log('Initial location fetch failed', error)
      }
    }

    initializeLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSaveCurrentLocation = async () => {
    if (!resolvedAddress) {
      Alert.alert(t('location.no_location'), t('location.select_first'))
      return
    }
    Alert.alert(
      t('location.save_address'),
      t('location.choose_label'),
      [
        { text: t('location.home'), onPress: () => saveAddressWithLabel('home') },
        { text: t('location.office'), onPress: () => saveAddressWithLabel('office') },
        {
          text: t('location.other'),
          onPress: () => {
            Alert.prompt(
              t('location.enter_label'),
              t('location.label_name'),
              [
                { text: t('location.cancel'), style: 'cancel' },
                {
                  text: t('location.save'),
                  onPress: (customLabel?: string) => {
                    if (customLabel && customLabel.trim())
                      saveAddressWithLabel('other', customLabel.trim())
                    else Alert.alert(t('location.error'), t('location.label_empty'))
                  },
                },
              ],
              'plain-text'
            )
          },
        },
        { text: t('location.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    )
  }

  const saveAddressWithLabel = async (
    label: 'home' | 'office' | 'other',
    customLabel?: string | null,
    addressOverride?: string,
    coordsOverride?: { latitude: number; longitude: number }
  ) => {
    setSavingAddress(true)
    try {
      const addressToSave = addressOverride ?? resolvedAddress
      if (!coordsOverride && !markerCoord) {
        throw new Error('No location selected')
      }
      const latToSave = coordsOverride?.latitude ?? markerCoord!.latitude
      const lngToSave = coordsOverride?.longitude ?? markerCoord!.longitude
      await createSavedAddress({
        label,
        customLabel: label === 'other' ? (customLabel ?? null) : null,
        address: addressToSave,
        coordinates: { lat: latToSave, lng: lngToSave },
        isDefault: false,
      })
      Alert.alert('✓', t('location.saved_success'))
      fetchSavedAddresses()
    } catch (error: any) {
      Alert.alert(t('location.error'), error.message || 'Failed to save address')
    } finally {
      setSavingAddress(false)
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    if (resolving) return
    setResolving(true)
    try {
      const url = `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'KORAApp/1.0' } })
      if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)
      const data = await res.json()
      if (data?.display_name) { setResolvedAddress(data.display_name); return }
      throw new Error('empty display_name')
    } catch {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
        if (results[0]) {
          const r = results[0]
          setResolvedAddress([r.name, r.street, r.district, r.city, r.region, r.postalCode].filter(Boolean).join(', '))
          return
        }
      } catch { }
      setResolvedAddress(`${lat.toFixed(5)}, ${lng.toFixed(5)}`)
    } finally {
      setResolving(false)
    }
  }

  const debouncedReverseGeocode = useCallback((lat: number, lng: number) => {
    if (reverseGeocodeTimeoutRef.current) clearTimeout(reverseGeocodeTimeoutRef.current)
    reverseGeocodeTimeoutRef.current = setTimeout(() => reverseGeocode(lat, lng), 300)
  }, [])

  const searchPlaces = useCallback(async (text: string) => {
    if (text.trim().length < 2) {
      setPredictions([]); setShowDropdown(false); setSearchLoading(false); return
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
            lat: item.lat, lon: item.lon,
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
      setPredictions([]); setShowDropdown(false); setSearchLoading(false); return
    }
    setSearchLoading(true)
    debounceRef.current = setTimeout(() => searchPlaces(text), 500)
  }, [searchPlaces])

  const handleClear = useCallback(() => {
    setSearchText(''); setPredictions([]); setShowDropdown(false)
  }, [])

  const onPredictionSelect = useCallback((prediction: Prediction, confirmNow: boolean) => {
    setSearchText(prediction.main_text)
    setShowDropdown(false); setPredictions([])
    const lat = parseFloat(prediction.lat)
    const lng = parseFloat(prediction.lon)
    if (isNaN(lat) || isNaN(lng)) return
    const newCoord = { latitude: lat, longitude: lng }
    const newRegion = { ...newCoord, latitudeDelta: 0.008, longitudeDelta: 0.008 }
    setMarkerCoord(newCoord); setRegion(newRegion)
    setResolvedAddress(prediction.display_name)
    if (reverseGeocodeTimeoutRef.current) clearTimeout(reverseGeocodeTimeoutRef.current)
    mapRef.current?.animateToRegion(newRegion, 600)
    if (confirmNow) handleSelect(prediction.display_name, newCoord)
  }, [])

  const handleSelect = (address: string, coords?: { latitude: number; longitude: number }) => {
    const finalCoords = coords || markerCoord
    if (!finalCoords) return
    dispatch(setAddress({ type: locationType, address, coordinates: [finalCoords.latitude, finalCoords.longitude] }))
    router.back()
  }

const setFallbackLocation = () => {
  setRegion(null)
  setMarkerCoord(null)
  setResolvedAddress('')
  setLocationResolved(false)
}

  const fetchCurrentLocation = async (confirmNow = false, showAlertOnError = true) => {
    setFetchingLocation(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        if (showAlertOnError) {
          Alert.alert(t('location.permission_denied'), t('location.allow_location'))
        }
        setFallbackLocation()
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const newCoord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
      const newRegion = { ...newCoord, latitudeDelta: 0.005, longitudeDelta: 0.005 }
      setMarkerCoord(newCoord)
      setRegion(newRegion)
      setLocationResolved(true)
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
      if (showAlertOnError) {
        Alert.alert(t('location.error'), e?.message ?? 'Could not fetch location.')
      }
      if (!locationResolved) setFallbackLocation()
    } finally {
      setFetchingLocation(false)
    }
  }

  const handleSavedSelect = (addr: SavedAddress) => {
    const newCoord = { latitude: addr.coordinates.lat, longitude: addr.coordinates.lng }
    setMarkerCoord(newCoord)
    setResolvedAddress(addr.address)
    handleSelect(addr.address, newCoord)
  }

  useEffect(() => {
    if (viewMode === 'map' && markerCoord?.latitude && markerCoord?.longitude) {
      debouncedReverseGeocode(markerCoord.latitude, markerCoord.longitude)
    }
    return () => { if (reverseGeocodeTimeoutRef.current) clearTimeout(reverseGeocodeTimeoutRef.current) }
  }, [markerCoord?.latitude, markerCoord?.longitude, viewMode])

  useEffect(() => {
    if (viewMode === 'map' && markerCoord?.latitude && markerCoord?.longitude && !resolvedAddress) {
      reverseGeocode(markerCoord.latitude, markerCoord.longitude)
    }
  }, [viewMode, markerCoord, resolvedAddress])

  const renderSavedAddresses = () => {
    if (addressesLoading) {
      return (
        <View style={styles.savedFeedback}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={styles.savedFeedbackText}>{t('location.loading_addresses')}</Text>
        </View>
      )
    }
    if (addressesError) {
      return (
        <TouchableOpacity style={styles.savedFeedback} onPress={fetchSavedAddresses}>
          <MaterialIcons name="refresh" size={18} color={theme.primary} />
          <Text style={[styles.savedFeedbackText, { color: theme.primary }]}>{t('location.failed_load')}</Text>
        </TouchableOpacity>
      )
    }
    if (savedAddresses.length === 0) {
      return (
        <View style={styles.savedFeedback}>
          <MaterialIcons name="bookmark-border" size={18} color={theme.subText} />
          <Text style={styles.savedFeedbackText}>{t('location.no_saved')}</Text>
        </View>
      )
    }
    return savedAddresses.map((addr, idx) => (
      <React.Fragment key={addr._id}>
        <TouchableOpacity style={styles.listRow} activeOpacity={0.8} onPress={() => handleSavedSelect(addr)}>
          <View style={styles.savedIcon}>
            <SavedAddressIcon label={addr.label} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.listRowTitle}>{getDisplayLabel(addr, t)}</Text>
              {addr.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>{t('location.default')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.listRowSub} numberOfLines={1}>{addr.address}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.subText} />
        </TouchableOpacity>
        {idx < savedAddresses.length - 1 && <View style={styles.innerDivider} />}
      </React.Fragment>
    ))
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <AppBackground>
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => { setShowDropdown(false); setViewMode(viewMode === 'list' ? 'map' : 'list') }}
              activeOpacity={0.8}
            >
              {viewMode === 'list'
                ? <><MaterialIcons name="map" size={15} color={theme.primary} /><Text style={styles.toggleText}> {t('location.map')}</Text></>
                : <><MaterialIcons name="list" size={15} color={theme.primary} /><Text style={styles.toggleText}> {t('location.list')}</Text></>
              }
            </TouchableOpacity>
          </View>

          {/* MAP VIEW */}
          {viewMode === 'map' ? (
            <View style={{ flex: 1 }}>
              {region && markerCoord ? (
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
                      const newRegion = {
                        ...coordinate,
                        latitudeDelta: region.latitudeDelta,
                        longitudeDelta: region.longitudeDelta,
                      }
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
              ) : (
                <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }]}> 
                  <ActivityIndicator size="large" color={theme.primary} />
                </View>
              )}

              <View style={styles.mapSearchFloat}>
                <SearchBar
                  isOnMap
                  searchText={searchText}
                  searchLoading={searchLoading}
                  showDropdown={showDropdown}
                  predictions={predictions}
                  placeholder={searchPlaceholder}
                  onSearchChange={onSearchChange}
                  onClear={handleClear}
                  onPredictionSelect={onPredictionSelect}
                />
              </View>

              <TouchableOpacity style={styles.fab} onPress={() => fetchCurrentLocation(false, true)} activeOpacity={0.85}>
                {fetchingLocation
                  ? <ActivityIndicator size="small" color={theme.primary} />
                  : <MaterialIcons name="my-location" size={22} color={theme.primary} />
                }
              </TouchableOpacity>

              {/* Bottom sheet */}
              <View style={styles.mapSheet}>
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetLabel}>{sheetLabel}</Text>
                {resolving ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={{ fontSize: 14, color: theme.subText }}>{t('location.fetching_address')}</Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 16 }}>
                    <MaterialIcons name="location-on" size={18} color={theme.primary} style={{ marginTop: 2 }} />
                    <Text style={styles.sheetAddress} numberOfLines={2}>
                      {resolvedAddress || t('location.drag_pin')}
                    </Text>
                  </View>
                )}
                {!!resolvedAddress && !resolving && (
                  <TouchableOpacity
                    style={[styles.saveBtn, savingAddress && styles.saveBtnDisabled]}
                    onPress={handleSaveCurrentLocation}
                    disabled={savingAddress}
                  >
                    {savingAddress ? (
                      <ActivityIndicator size="small" color={theme.white} />
                    ) : (
                      <>
                        <MaterialIcons name="save" size={18} color={theme.white} />
                        <Text style={styles.saveBtnText}>  {t('location.save_location')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.confirmBtn, (!resolvedAddress || resolving) && styles.confirmDisabled]}
                  disabled={!resolvedAddress || resolving}
                  onPress={() => resolvedAddress && handleSelect(resolvedAddress)}
                >
                  <MaterialIcons name="check-circle-outline" size={18} color={theme.white} />
                  <Text style={styles.confirmText}>  {t('location.confirm_location')}</Text>
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
                  placeholder={searchPlaceholder}
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
                <TouchableOpacity style={styles.mapRow} activeOpacity={0.85} onPress={() => setViewMode('map')}>
                  <View style={styles.mapRowIcon}>
                    <MaterialCommunityIcons name="map-marker-radius" size={22} color={theme.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mapRowTitle}>{t('location.pick_on_map')}</Text>
                    <Text style={styles.mapRowSub}>{t('location.pick_on_map_sub')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#c8e8e4" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.listRow} activeOpacity={0.85} onPress={() => fetchCurrentLocation(true)}>
                  <View style={styles.listRowIcon}>
                    {fetchingLocation
                      ? <ActivityIndicator size="small" color={theme.primary} />
                      : <MaterialIcons name="my-location" size={20} color={theme.primary} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.listRowTitle}>{t('location.use_current')}</Text>
                    <Text style={styles.listRowSub}>{t('location.use_current_sub')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.subText} />
                </TouchableOpacity>

                <View style={styles.divider} />

                <Text style={styles.sectionLabel}>{t('location.saved_addresses')}</Text>
                {renderSavedAddresses()}

                <TouchableOpacity
                  style={styles.addAddressRow}
                  onPress={async () => {
                    setFetchingLocation(true)
                    try {
                      const { status } = await Location.requestForegroundPermissionsAsync()
                      if (status !== 'granted') {
                        Alert.alert(t('location.permission_denied'), t('location.allow_location_save'))
                        return
                      }
                      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
                      const coord = { lat: loc.coords.latitude, lng: loc.coords.longitude }
                      const url = `${NOMINATIM_URL}/reverse?format=json&lat=${coord.lat}&lon=${coord.lng}&zoom=18`
                      const res = await fetch(url, { headers: { 'User-Agent': 'KORAApp/1.0' } })
                      const data = await res.json()
                      const address = data.display_name || `${coord.lat}, ${coord.lng}`
                      const tmpMarkerCoord = { latitude: coord.lat, longitude: coord.lng }
                      await saveAddressWithLabel('other', address, address, tmpMarkerCoord)
                      fetchSavedAddresses()
                      setShowDropdown(false)
                    } catch (err: any) {
                      Alert.alert(t('location.error'), err.message || 'Could not fetch current location')
                    } finally {
                      setFetchingLocation(false)
                    }
                  }}
                >
                  <MaterialIcons name="add-location" size={22} color={theme.primary} />
                  <Text style={styles.addAddressText}>{t('location.add_current')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
        </KeyboardAvoidingView>
      </AppBackground>
    </SafeAreaView>
  )
}

const createStyles = (theme: any, isDarkMode: boolean) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  root: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: theme.card,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: theme.primaryLight, borderRadius: 20, borderWidth: 1, borderColor: theme.border,
  },
  toggleText: { fontSize: 13, color: theme.primary, fontWeight: '600' },
  listSearchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, backgroundColor: theme.card, zIndex: 999 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card,
    borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, height: 48,
  },
  searchWrapMap: { elevation: 10, shadowColor: theme.text, shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, borderColor: theme.card },
  searchInput: { flex: 1, fontSize: 14, color: theme.text, paddingVertical: 0 },
  dropdown: {
    marginTop: 4, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border,
    maxHeight: 300, overflow: 'hidden', elevation: 12, shadowColor: theme.text, shadowOpacity: 0.12, shadowRadius: 12,
  },
  dropdownMap: { elevation: 20, shadowOpacity: 0.2 },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
  dropdownIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  dropdownMain: { fontSize: 14, fontWeight: '600', color: theme.text },
  dropdownSub: { fontSize: 12, color: theme.subText, marginTop: 1 },
  dropdownSep: { height: 1, backgroundColor: theme.background, marginLeft: 58 },
  mapSearchFloat: { position: 'absolute', top: 12, left: 12, right: 12, zIndex: 999 },
  fab: {
    position: 'absolute', right: 16, bottom: 240, width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: theme.text, shadowOpacity: 0.15, shadowRadius: 8,
  },
  mapSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12,
    elevation: 20, shadowColor: theme.text, shadowOpacity: 0.15, shadowRadius: 16,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetLabel: { fontSize: 11, fontWeight: '700', color: theme.subText, letterSpacing: 1, marginBottom: 8 },
  sheetAddress: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.text, lineHeight: 22 },
  mapRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 14, marginBottom: 2,
    backgroundColor: theme.primaryLight, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 14,
  },
  mapRowIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  mapRowTitle: { fontSize: 15, fontWeight: '700', color: theme.primary },
  mapRowSub: { fontSize: 12, color: theme.subText, marginTop: 2 },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  listRowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1, borderColor: theme.border },
  listRowTitle: { fontSize: 14, fontWeight: '600', color: theme.text, marginBottom: 2 },
  listRowSub: { fontSize: 12, color: theme.subText },
  savedIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1, borderColor: theme.border },
  savedFeedback: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14 },
  savedFeedbackText: { fontSize: 13, color: theme.subText },
  defaultBadge: { backgroundColor: theme.primaryLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: theme.border },
  defaultBadgeText: { fontSize: 10, color: theme.primary, fontWeight: '700' },
  divider: { height: 8, backgroundColor: theme.background, marginVertical: 4 },
  innerDivider: { height: 1, backgroundColor: theme.border, marginLeft: 70, marginRight: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: theme.subText, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 15, marginTop: 12 },
  confirmDisabled: { backgroundColor: theme.border },
  confirmText: { color: theme.white, fontSize: 15, fontWeight: '700' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.primary, borderRadius: 12, paddingVertical: 12, marginBottom: 8 },
  saveBtnDisabled: { backgroundColor: theme.border },
  saveBtnText: { color: theme.white, fontSize: 14, fontWeight: '600' },
  addAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginVertical: 12, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.primaryLight, borderRadius: 14, borderWidth: 1, borderColor: theme.border },
  addAddressText: { fontSize: 14, fontWeight: '500', color: theme.primary },
})