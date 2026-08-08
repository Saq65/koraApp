// app/orders.tsx  –  wired to MongoDB-backed API
import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { getUserOrders, cancelOrder, Order } from '../../src/services/orderService';
import { useTranslation } from 'react-i18next';

const TEAL        = '#1A6B5A';
const TEAL_LIGHT  = '#E8F4F1';
const GRAY_LIGHT  = '#EFEFEA';
const GRAY_TEXT   = '#ABABAB';
const TEXT_DARK   = '#1A1A1A';
const TEXT_MID    = '#666666';

const CURRENT_CUSTOMER_ID = 'REPLACE_WITH_AUTH_CUSTOMER_ID'; 

const UI_STATUS_COLOR: Record<string, string> = {
  'Delivered':  TEAL,
  'Cancelled':  '#E53935',
  'In Process': '#F5A623',
};

// Pick a sensible icon from the first item's service
const SERVICE_ICON: Record<string, string> = {
  wash: 'washing-machine',
  iron: 'iron',
  both: 'tshirt-crew',
};
function orderIcon(order: Order) {
  return SERVICE_ICON[order.items[0]?.service] ?? 'tshirt-crew';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─── Active Order Card ─────────────────────────────────────────────────────── */
function ActiveOrderCard({ order, onCancel }: { order: Order; onCancel: () => void }) {
  const { t } = useTranslation();
  const [cancelling, setCancelling] = useState(false);

  const minsElapsed = (Date.now() - new Date(order.createdAt).getTime()) / 60000;
  const minsLeft    = Math.max(0, Math.round(120 - minsElapsed));
  const canCancel   = minsLeft > 0 && !['picked_up','at_sp','cleaned','rider_delivery_assigned','delivered','cancelled'].includes(order.status);

  const handleCancel = () => {
    Alert.alert(t('orders.cancel_order_title'), t('orders.cancel_order_message'), [
      { text: t('orders.no'), style: 'cancel' },
      {
        text: t('orders.yes_cancel'), style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelOrder(String(order.id), CURRENT_CUSTOMER_ID);
            onCancel();
          } catch (err: any) {
            Alert.alert(t('orders.cannot_cancel'), err.message ?? t('orders.something_went_wrong'));
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.activeCard}>
      {/* Summary row */}
      <View style={styles.activeSummaryRow}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={orderIcon(order)} size={22} color={TEAL} />
        </View>
        <View style={styles.cardCenter}>
          <View style={styles.row}>
            <Text style={styles.orderId}>{String(order.id).slice(-8).toUpperCase()}</Text>
            <Text style={[styles.statusText, { color: UI_STATUS_COLOR[order.uiStatus] }]}>
              {order.uiStatus}
            </Text>
          </View>
          <Text style={styles.orderMeta}>
            {order.items[0]?.service?.toUpperCase()} • {order.totalItems} {t('orders.items')}
          </Text>
          <View style={styles.row}>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
            <Text style={styles.price}>₹{order.totalAmount}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Tracking Timeline */}
      <View style={styles.timeline}>
        {order.trackingSteps.map((step, index) => {
          const isLast       = index === order.trackingSteps.length - 1;
          const isNextPending = !step.completed && (index === 0 || order.trackingSteps[index - 1].completed);
          return (
            <View key={index} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                {step.completed ? (
                  <View style={styles.dotCompleted}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={TEAL} />
                  </View>
                ) : (
                  <View style={[styles.dotEmpty, isNextPending && styles.dotCurrent]} />
                )}
                {!isLast && (
                  <View style={[styles.timelineLine, step.completed ? styles.timelineLineDone : styles.timelineLinePending]} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.stepLabel, !step.completed && styles.stepLabelPending]}>
                  {step.label}
                </Text>
                {step.time && (
                  <Text style={styles.stepTime}>
                    {new Date(step.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Cancellation window notice */}
      {canCancel && (
        <View style={styles.cancelNotice}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={TEAL} />
          <Text style={styles.cancelNoticeText}>
            {t('orders.free_cancellation', { mins: minsLeft })}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionRow}>
        {canCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} disabled={cancelling} activeOpacity={0.8}>
            {cancelling
              ? <ActivityIndicator color="#E53935" size="small" />
              : <Text style={styles.cancelBtnText}>{t('orders.cancel_order_btn')}</Text>}
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.trackBtn, !canCancel && { flex: 1 }]} activeOpacity={0.8}>
          <Text style={styles.trackBtnText}>{t('orders.live_tracking')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ─── History Order Card ─────────────────────────────────────────────────────── */
function OrderCard({ order }: { order: Order }) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name={orderIcon(order)} size={22} color={TEAL} />
      </View>
      <View style={styles.cardCenter}>
        <View style={styles.row}>
          <Text style={styles.orderId}>{String(order.id).slice(-8).toUpperCase()}</Text>
          <Text style={[styles.statusText, { color: UI_STATUS_COLOR[order.uiStatus] }]}>
            {order.uiStatus}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.orderMeta}>
            {order.items[0]?.service?.toUpperCase()} • {order.totalItems} {t('orders.items')}
          </Text>
          <Text style={styles.price}>₹{order.totalAmount}</Text>
        </View>
        <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={22} color={GRAY_TEXT} />
    </TouchableOpacity>
  );
}

/* ─── Main Screen ─────────────────────────────────────────────────────────────── */
export default function Orders() {
  const { t } = useTranslation();
  const [activeTab,  setActiveTab]  = useState<'active' | 'history'>('active');
  const [orders,     setOrders]     = useState<Order[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const fetchOrders = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const data = await getUserOrders(CURRENT_CUSTOMER_ID, activeTab);
      setOrders(data);
    } catch (err: any) {
      setError(err.message ?? t('orders.failed_to_load'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={GRAY_LIGHT} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={TEXT_DARK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('orders.title')} </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.tabRow}>
        {(['active', 'history'] as const).map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
            style={activeTab === tab ? styles.tabActive : styles.tabInactive}>
            <Text style={activeTab === tab ? styles.tabActiveText : styles.tabInactiveText}>
              {tab === 'active' ? t('orders.active') : t('orders.history')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={TEAL} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centerWrap}>
          <MaterialCommunityIcons name="alert-circle-outline" size={40} color={GRAY_TEXT} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchOrders()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('orders.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchOrders(true)} tintColor={TEAL} />}
        >
          {orders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="package-variant" size={52} color={GRAY_TEXT} />
              <Text style={styles.emptyText}>
                {activeTab === 'active' ? t('orders.no_active_orders') : t('orders.no_past_orders')}
              </Text>
            </View>
          ) : activeTab === 'active' ? (
            orders.map(o => <ActiveOrderCard key={String(o.id)} order={o} onCancel={() => fetchOrders()} />)
          ) : (
            orders.map(o => <OrderCard key={String(o.id)} order={o} />)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:       { flex: 1, backgroundColor: GRAY_LIGHT },
  centerWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  header:         { flexDirection: 'row', alignItems: 'center',gap:15, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4 },
  headerTitle:    { fontSize: 17, fontWeight: '700', color: TEXT_DARK },
  tabRow:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, backgroundColor: '#E2E2DA', borderRadius: 30, padding: 4 },
  tabActive:      { flex: 1, backgroundColor: TEAL, borderRadius: 26, paddingVertical: 10, alignItems: 'center' },
  tabActiveText:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  tabInactive:    { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabInactiveText: { color: GRAY_TEXT, fontWeight: '600', fontSize: 14 },
  scrollContent:  { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  card:           { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  activeCard:     { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  activeSummaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  divider:        { height: 1, backgroundColor: '#F0F0F0', marginBottom: 16 },
  iconWrap:       { width: 44, height: 44, borderRadius: 22, backgroundColor: TEAL_LIGHT, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardCenter:     { flex: 1, gap: 3 },
  row:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId:        { fontSize: 14, fontWeight: '700', color: TEXT_DARK },
  statusText:     { fontSize: 13, fontWeight: '700' },
  orderMeta:      { fontSize: 12, color: TEXT_MID, flex: 1 },
  price:          { fontSize: 14, fontWeight: '800', color: TEXT_DARK },
  orderDate:      { fontSize: 11, color: GRAY_TEXT },
  timeline:       { marginBottom: 16, paddingLeft: 4 },
  timelineRow:    { flexDirection: 'row', minHeight: 44 },
  timelineLeft:   { width: 28, alignItems: 'center' },
  dotCompleted:   { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  dotEmpty:       { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#D0D0D0', backgroundColor: '#fff', marginTop: 1, zIndex: 1 },
  dotCurrent:     { borderColor: TEAL },
  timelineLine:   { width: 2, flex: 1, marginTop: 2, marginBottom: -2 },
  timelineLineDone:    { backgroundColor: TEAL },
  timelineLinePending: { backgroundColor: '#E0E0E0' },
  timelineContent:     { flex: 1, paddingLeft: 10, paddingBottom: 12 },
  stepLabel:       { fontSize: 13, fontWeight: '600', color: TEXT_DARK },
  stepLabelPending: { color: GRAY_TEXT, fontWeight: '500' },
  stepTime:        { fontSize: 11, color: TEXT_MID, marginTop: 1 },
  cancelNotice:    { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: TEAL_LIGHT, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14 },
  cancelNoticeText: { fontSize: 12, color: TEAL, fontWeight: '500', flex: 1 },
  actionRow:  { flexDirection: 'row', gap: 10 },
  cancelBtn:  { flex: 1, borderWidth: 1.5, borderColor: '#E53935', borderRadius: 30, paddingVertical: 13, alignItems: 'center' },
  cancelBtnText: { color: '#E53935', fontWeight: '700', fontSize: 14 },
  trackBtn:   { flex: 1, backgroundColor: TEAL, borderRadius: 30, paddingVertical: 13, alignItems: 'center' },
  trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyWrap:  { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 12 },
  emptyText:  { fontSize: 15, color: GRAY_TEXT, fontWeight: '500' },
  retryBtn:   { backgroundColor: TEAL, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText:  { color: '#fff', fontWeight: '600', fontSize: 14 },
});