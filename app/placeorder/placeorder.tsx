// app/place-order.tsx
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';

import {
  useAppSelector, useAppDispatch,
  selectCartItems, selectCartCount, selectCartTotal,
} from '../../src/redux/store/hooks';
import { clearCart } from '../../src/redux/store/cartSlice';
import { createOrder, CreateOrderPayload } from '../../src/services/orderService';
import { useTranslation } from 'react-i18next';

const TEAL       = '#1A6B5A';
const TEAL_LIGHT = '#E8F4F1';
const GRAY_LIGHT = '#EFEFEA';
const GRAY_TEXT  = '#ABABAB';
const TEXT_DARK  = '#1A1A1A';
const TEXT_MID   = '#666666';

type PickupDay = 'Today' | 'Tomorrow';
type TimeSlot  = '10:00 AM' | '2:00 PM';

const DELIVERY_CHARGE  = 0;
const PICKUP_ADDRESS   = '123 Main Street, Mumbai, MH 400001';
const DROPOFF_ADDRESS  = '123 Main Street, Mumbai, MH 400001';
const CURRENT_CUSTOMER_ID = 'REPLACE_WITH_AUTH_CUSTOMER_ID'; // ← swap with your auth context

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function LocationRow({ label, address }: { label: string; address: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.locationRow}>
      <View style={styles.locationLeft}>
        <View style={styles.greenDot} />
        <View style={styles.locationText}>
          <View style={styles.locationTopRow}>
            <Text style={styles.locationLabel}>{label}</Text>
            <TouchableOpacity style={styles.changeBtn}>
              <MaterialCommunityIcons name="pencil-outline" size={12} color={TEAL} />
              <Text style={styles.changeBtnText}>{t('placeorder.change')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addressRow}>
            <MaterialIcons name="location-on" size={12} color={GRAY_TEXT} />
            <Text style={styles.addressText}>{address}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function PlaceOrder() {
  const { t } = useTranslation();
  const [pickupDay, setPickupDay] = useState<PickupDay>('Tomorrow');
  const [timeSlot, setTimeSlot]   = useState<TimeSlot>('10:00 AM');
  const [agreed, setAgreed]       = useState(false);
  const [loading, setLoading]     = useState(false);

  const dispatch   = useAppDispatch();
  const cartItems  = useAppSelector(selectCartItems);
  const totalItems = useAppSelector(selectCartCount);
  const itemsTotal = useAppSelector(selectCartTotal);
  const total      = itemsTotal + DELIVERY_CHARGE;

  // Build pickup ISO datetime from the pill selections
  function buildPickupISO(): string {
    const base = new Date();
    if (pickupDay === 'Tomorrow') base.setDate(base.getDate() + 1);
    const [hStr, period] = timeSlot.split(' ');
    let [hours, minutes] = hStr.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    base.setHours(hours, minutes, 0, 0);
    return base.toISOString();
  }

  const handlePlaceOrder = async () => {
    if (!agreed || loading) return;
    setLoading(true);
    try {
      const payload: CreateOrderPayload = {
        customerId: CURRENT_CUSTOMER_ID,
        cartItems,
        pickupAddress:   { address: PICKUP_ADDRESS },
        deliveryAddress: { address: DROPOFF_ADDRESS },
        pickupScheduledAt: buildPickupISO(),
        paymentMethod: 'cod',
      };

      const order = await createOrder(payload);
      dispatch(clearCart());

      router.push({
        pathname: '/payment/payment',
        params: {
          orderId:   String(order.id),
          total:     String(order.totalAmount),
          pickupDay,
          timeSlot,
        },
      });
    } catch (err: any) {
      Alert.alert(t('placeorder.order_failed'), err.message ?? t('placeorder.something_went_wrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('placeorder.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Items */}
        <SectionTitle title={`${t('placeorder.your_items')} (${totalItems})`} />
        <View style={styles.card}>
          {cartItems.map((item, idx) => (
            <View key={item.id}>
              <View style={styles.itemRow}>
                <View style={styles.itemIconWrap}>
                  <MaterialCommunityIcons name="tshirt-crew" size={20} color={TEAL} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.subCategoryName}</Text>
                  <Text style={styles.itemSub}>{item.serviceName} • ₹{item.price} x {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
              {idx < cartItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Locations */}
        <SectionTitle title={t('placeorder.pickup_drop_location')} />
        <View style={styles.card}>
          <LocationRow label={t('placeorder.pickup_from')} address={PICKUP_ADDRESS} />
          <View style={styles.locationDivider} />
          <LocationRow label={t('placeorder.dropoff_at')}  address={DROPOFF_ADDRESS} />
        </View>

        {/* Schedule */}
        <SectionTitle title={t('placeorder.schedule')} />
        <View style={styles.card}>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleBlock}>
              <View style={styles.scheduleHeader}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color={GRAY_TEXT} />
                <Text style={styles.scheduleHeaderText}>{t('placeorder.pickup_date')}</Text>
              </View>
              <View style={styles.pillRow}>
                {(['Today', 'Tomorrow'] as PickupDay[]).map(day => (
                  <TouchableOpacity key={day} onPress={() => setPickupDay(day)}
                    style={[styles.pill, pickupDay === day ? styles.pillActive : styles.pillInactive]}>
                    <Text style={[styles.pillText, pickupDay === day ? styles.pillTextActive : styles.pillTextInactive]}>{day === 'Today' ? t('placeorder.today') : t('placeorder.tomorrow')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.scheduleBlock}>
              <View style={styles.scheduleHeader}>
                <MaterialCommunityIcons name="clock-outline" size={14} color={GRAY_TEXT} />
                <Text style={styles.scheduleHeaderText}>{t('placeorder.time_slot')}</Text>
              </View>
              <View style={styles.pillRow}>
                {(['10:00 AM', '2:00 PM'] as TimeSlot[]).map(slot => (
                  <TouchableOpacity key={slot} onPress={() => setTimeSlot(slot)}
                    style={[styles.pill, timeSlot === slot ? styles.pillActive : styles.pillInactive]}>
                    <Text style={[styles.pillText, timeSlot === slot ? styles.pillTextActive : styles.pillTextInactive]}>{slot}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Bill */}
        <View style={styles.card}>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{t('placeorder.items_label')} ({totalItems})</Text>
            <Text style={styles.billValue}>₹{itemsTotal}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>{t('placeorder.delivery')}</Text>
            <Text style={styles.billFree}>{t('placeorder.free')}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotal}>{t('placeorder.total')}</Text>
            <Text style={styles.billTotal}>₹{total}</Text>
          </View>
        </View>

        {/* T&C */}
        <TouchableOpacity style={styles.tcRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed && <MaterialIcons name="check" size={13} color="#fff" />}
          </View>
          <Text style={styles.tcText}>
            {t('placeorder.agree_prefix')} <Text style={styles.tcLink}>{t('placeorder.terms_conditions')}</Text> {t('placeorder.agree_suffix')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payBtn, (!agreed || loading) && styles.payBtnDisabled]}
          activeOpacity={agreed && !loading ? 0.85 : 1}
          onPress={handlePlaceOrder}
          disabled={!agreed || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <MaterialCommunityIcons name="credit-card-outline" size={18} color={agreed ? '#fff' : GRAY_TEXT} />
              <Text style={[styles.payBtnText, !agreed && styles.payBtnTextDisabled]}>
                {t('placeorder.proceed_to_pay')} • ₹{total}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: GRAY_LIGHT },
  header: { flexDirection: 'row', alignItems: 'center',
    gap:16, paddingHorizontal: 16,
      paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: TEXT_DARK },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: TEXT_DARK, marginTop: 6, marginBottom: 2 },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  itemIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: TEAL_LIGHT, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: TEXT_DARK },
  itemSub: { fontSize: 11, color: GRAY_TEXT, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  locationRow: { paddingVertical: 4 },
  locationLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2ECC71', marginTop: 4 },
  locationText: { flex: 1 },
  locationTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  locationLabel: { fontSize: 13, fontWeight: '600', color: TEXT_DARK },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  changeBtnText: { fontSize: 12, color: TEAL, fontWeight: '600' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
  addressText: { fontSize: 11, color: GRAY_TEXT, flex: 1 },
  locationDivider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },
  scheduleRow: { flexDirection: 'row', gap: 16 },
  scheduleBlock: { flex: 1 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  scheduleHeaderText: { fontSize: 12, color: GRAY_TEXT, fontWeight: '500' },
  pillRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  pillActive: { backgroundColor: TEAL },
  pillInactive: { backgroundColor: '#EBEBE5' },
  pillText: { fontSize: 13, fontWeight: '600' },
  pillTextActive: { color: '#fff' },
  pillTextInactive: { color: TEXT_MID },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  billLabel: { fontSize: 13, color: TEXT_MID },
  billValue: { fontSize: 13, color: TEXT_DARK, fontWeight: '600' },
  billFree: { fontSize: 13, color: '#2ECC71', fontWeight: '700' },
  billTotal: { fontSize: 15, fontWeight: '800', color: TEXT_DARK },
  tcRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: GRAY_TEXT, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: TEAL, borderColor: TEAL },
  tcText: { flex: 1, fontSize: 12, color: TEXT_MID, lineHeight: 18 },
  tcLink: { color: TEAL, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: GRAY_LIGHT, borderTopWidth: 1, borderTopColor: '#E5E5E0' },
  payBtn: { backgroundColor: TEAL, borderRadius: 30, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  payBtnDisabled: { backgroundColor: '#D4D4CC' },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  payBtnTextDisabled: { color: GRAY_TEXT },
});