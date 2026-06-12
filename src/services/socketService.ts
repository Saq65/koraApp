// src/services/socketService.ts

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type OrderStatus } from './orderService';

// API URL from .env
const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

// Socket server runs on root domain, not /api
export const SOCKET_URL = API_URL.replace('/api', '');

export interface RiderLocation {
  lat: number;
  lng: number;
}

export interface LiveTrackingStep {
  status: OrderStatus;
  label: string;
  icon: string;
  time: string;
  completed: boolean;
  isEst: boolean;
}

export interface LiveRider {
  _id: string;
  name: string;
  phone: string;
}

export interface OrderSocketPayload {
  orderNumber: string;
  status: OrderStatus;
  statusLabel: string;
  trackingSteps: LiveTrackingStep[];
  riderPickup: LiveRider | null;
  riderDelivery: LiveRider | null;
  estimatedDelivery: string | null;
  deliveryAddress: {
    coordinates?: [number, number];
    address: string;
  };
}

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface SocketCallbacks {
  onState: (data: OrderSocketPayload) => void;
  onUpdate: (data: OrderSocketPayload) => void;
  onRiderLocation: (loc: RiderLocation) => void;
  onStatusChange: (status: ConnectionStatus) => void;
  onError: (msg: string) => void;
}

export async function createOrderSocket(
  orderNumber: string,
  callbacks: SocketCallbacks
): Promise<() => void> {
  const token = await AsyncStorage.getItem('token');

  console.log('[Socket] API_URL:', API_URL);
  console.log('[Socket] SOCKET_URL:', SOCKET_URL);
  console.log('[Socket] token found:', !!token);
  console.log('[Socket] orderNumber:', orderNumber);

  if (!token) {
    callbacks.onError('Not authenticated');
    callbacks.onStatusChange('error');
    return () => {};
  }

  callbacks.onStatusChange('connecting');

  const socket: Socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    timeout: 20000,
  });

  // Connection success
  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);

    callbacks.onStatusChange('connected');

    socket.emit('join_order', {
      orderNumber,
    });
  });

  // Connection lost
  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    callbacks.onStatusChange('disconnected');
  });

  // Connection error
  socket.on('connect_error', (err) => {
    console.log('[Socket] Connect Error:', err.message);
    console.log('[Socket] URL:', SOCKET_URL);
    console.log('[Socket] Full Error:', err);

    callbacks.onStatusChange('error');
    callbacks.onError(err.message);
  });

  // Initial order state
  socket.on('order_state', (data: OrderSocketPayload) => {
    console.log('[Socket] order_state:', data.status);
    callbacks.onState(data);
  });

  // Order updates
  socket.on('order_update', (data: OrderSocketPayload) => {
    console.log('[Socket] order_update:', data.status);

    callbacks.onUpdate(data);

    // if (
    //   data.status === 'delivered' ||
    //   data.status === 'cancelled'
    // ) {
    //   socket.disconnect();
    // }
  });

  // Rider location updates
  socket.on('rider_location', (loc: RiderLocation) => {
    console.log('[Socket] rider_location:', loc);
    callbacks.onRiderLocation(loc);
  });

  // Server-side errors
  socket.on('error', (err: { message: string }) => {
    console.log('[Socket] Server Error:', err.message);

    callbacks.onError(err.message);
  });

  

  return () => {
    console.log('[Socket] Cleanup disconnect');
    socket.disconnect();
  };
}