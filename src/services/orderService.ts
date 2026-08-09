// src/services/orderService.ts
// All order-related API calls. Matches the real Mongoose schema.

import { API_BASE_URL } from '../config/api';

const BASE_URL = API_BASE_URL;

// ─── Types mirroring the Mongoose schema ─────────────────────────────────────

export type ServiceType = 'wash' | 'iron' | 'both';

// Matches OrderItemSchema
export interface OrderItem {
  _id?: string;
  category?: string;
  subCategory?: string;
  productName: string;
  service: ServiceType;
  quantity: number;
  price: number;
}

// Matches pickupAddress / deliveryAddress in OrderSchema
export interface OrderAddress {
  coordinates?: [number, number]; // [lng, lat]
  address: string;
}

// Tracking step shape (built server-side from STATUS_TIMELINE)
export interface TrackingStep {
  label: string;
  completed: boolean;
  time: string | null;
}

// Raw DB statuses from the schema enum
export type OrderStatus =
  | 'pending_sp'
  | 'sp_assigned'
  | 'sp_accepted'
  | 'rider_pickup_assigned'
  | 'picked_up'
  | 'at_sp'
  | 'cleaned'
  | 'rider_delivery_assigned'
  | 'delivered'
  | 'cancelled';

// Simplified 3-state label the UI renders
export type UIStatus = 'In Process' | 'Delivered' | 'Cancelled';

// Full order shape returned by the API (after formatOrder())
export interface Order {
  id: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
  totalItems: number;
  status: OrderStatus;   // raw DB value
  uiStatus: UIStatus;      // simplified label for tabs/badges
  trackingSteps: TrackingStep[];
  pickupAddress: OrderAddress;
  deliveryAddress: OrderAddress;
  serviceProvider: { _id: string; name: string; phone?: string } | null;
  riderPickup: { _id: string; name: string; phone?: string } | null;
  riderDelivery: { _id: string; name: string; phone?: string } | null;
  pickupScheduledAt: string | null;
  deliveryScheduledAt: string | null;
  paymentMethod: string | null;
  paymentStatus: string;
  createdAt: string;
}

// ─── Payload for creating an order ───────────────────────────────────────────
// items come straight from your Redux cartSlice; we map them here.

export interface CartItem {
  id: string;
  serviceId: string;       // 'wash' | 'iron' | 'combo' (from Redux)
  serviceName: string;       // 'Wash' | 'Iron' | 'Wash+Iron'
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  price: number;
  quantity: number;
}

export interface CreateOrderPayload {
  customerId: string;
  cartItems: CartItem[];
  pickupAddress: OrderAddress;
  deliveryAddress: OrderAddress;
  pickupScheduledAt?: string;        // ISO string, optional
  deliveryScheduledAt?: string;
  paymentMethod?: string;
}

// ─── Cart → OrderItem mapper ──────────────────────────────────────────────────
// Maps your Redux cart shape to what the backend OrderItemSchema expects.
function SERVICE_ID_MAP(serviceId: string): ServiceType {
  if (serviceId === 'wash') return 'wash';
  if (serviceId === 'iron') return 'iron';
  if (serviceId === 'combo') return 'both';
  return 'wash'; // safe fallback
}

function cartItemsToOrderItems(cartItems: CartItem[]): OrderItem[] {
  return cartItems.map(item => ({
    category: item.categoryName,
    subCategory: item.subCategoryName,
    productName: item.subCategoryName,           // e.g. "Shirt"
    service: SERVICE_ID_MAP(item.serviceId),
    quantity: item.quantity,
    price: item.price,
  }));
}

// ─── History order shape (matches getOrderHistory controller) ─
export interface HistoryOrder {
  id: string;
  service: string;
  items: number;
  date: string;
  price: number;
  status: "Delivered" | "Cancelled";
  iconName: string;
}

/** Delivered + cancelled order history. */
export async function getOrderHistory(): Promise<HistoryOrder[]> {
  const res = await apiRequest<{ success: boolean; data: HistoryOrder[] }>("/orders/history");
  return res.data;
}

// ─── Generic fetch helper ─────────────────────────────────────────────────────

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  // ✅ Token lo AsyncStorage se
  const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
  const token = await AsyncStorage.getItem('token'); // ← apna key check karo

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ token add karo
      ...options.headers,
    },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `HTTP ${response.status}`);
  return data as T;
}

// ─── API calls ────────────────────────────────────────────────────────────────

/** Place a new order. Converts Redux cart items → OrderItems internally. */
export async function createOrder(payload: CreateOrderPayload): Promise<Order> {
  const body = {
    customerId: payload.customerId,
    items: cartItemsToOrderItems(payload.cartItems),
    pickupAddress: payload.pickupAddress,
    deliveryAddress: payload.deliveryAddress,
    pickupScheduledAt: payload.pickupScheduledAt,
    deliveryScheduledAt: payload.deliveryScheduledAt,
    paymentMethod: payload.paymentMethod,
  };

  const res = await apiRequest<{ success: boolean; order: Order }>('/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.order;
}

/** Fetch a single order by MongoDB _id. Includes full tracking timeline. */
export async function getOrder(orderId: string): Promise<Order> {
  const res = await apiRequest<{ success: boolean; data: any }>(
    `/orders/${encodeURIComponent(orderId)}`
  );
  return res.data; // ← `res.order` ki jagah `res.data`
}

/**
 * Fetch all orders for a customer.
 * @param tab  "active"  → pending/in-progress statuses
 *             "history" → delivered + cancelled
 */
export async function getUserOrders(customerId: string, tab: 'active' | 'history' = 'active'): Promise<Order[]> {
  const res = await apiRequest<{ success: boolean; total: number; orders: Order[] }>(
    `/orders/customer/${encodeURIComponent(customerId)}?tab=${tab}`
  );
  return res.orders;
}

/** Cancel an order (only within the 2-hour window and before it's picked up). */
export async function cancelOrder(orderId: string, customerId: string): Promise<Order> {
  const res = await apiRequest<{ success: boolean; order: Order }>(
    `/orders/${encodeURIComponent(orderId)}/cancel`,
    { method: 'PATCH', body: JSON.stringify({ customerId }) }
  );
  return res.order;
}

export async function getOrderDetails(orderId: string) {
  return getOrder(orderId);
}