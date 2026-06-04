// src/services/socketService.ts
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type OrderStatus } from './orderService';

export const SOCKET_URL = __DEV__
    ? 'http://192.168.1.126:5000'
    : 'https://your-production-api.com';

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
    deliveryAddress: { coordinates?: [number, number]; address: string };
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

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
    console.log('[Socket] token found:', !!token, '| orderNumber:', orderNumber);

    if (!token) {
        callbacks.onError('Not authenticated');
        callbacks.onStatusChange('error');
        return () => {};
    }

    callbacks.onStatusChange('connecting');

    const socket: Socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
    });

    /* ── Lifecycle ── */
    socket.on('connect', () => {
        console.log('[Socket] connected, joining order:', orderNumber);
        callbacks.onStatusChange('connected');
        socket.emit('join_order', { orderNumber });
    });

    socket.on('disconnect', () => {
        console.log('[Socket] disconnected');
        callbacks.onStatusChange('disconnected');
    });

    socket.on('connect_error', (err) => {
        console.log('[Socket] connect_error:', err.message);
        callbacks.onStatusChange('error');
    });

    /* ── Order events ── */
    socket.on('order_state', (data: OrderSocketPayload) => {
        console.log('[Socket] order_state received:', data.status);
        callbacks.onState(data);
    });

    socket.on('order_update', (data: OrderSocketPayload) => {
        console.log('[Socket] order_update received:', data.status);
        callbacks.onUpdate(data);
        if (data.status === 'delivered' || data.status === 'cancelled') {
            socket.disconnect();
        }
    });

    /* ── Rider GPS ── */
    socket.on('rider_location', (loc: RiderLocation) => {
        console.log('[Socket] rider_location:', loc);
        callbacks.onRiderLocation(loc);
    });

    /* ── Server errors ── */
    socket.on('error', (err: { message: string }) => {
        console.log('[Socket] server error:', err.message);
        callbacks.onError(err.message);
    });

    return () => socket.disconnect();
}