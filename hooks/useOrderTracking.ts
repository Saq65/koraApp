

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createOrderSocket,
  type OrderSocketPayload,
  type RiderLocation,
  type ConnectionStatus,
} from '../src/services/socketService';

export function useOrderTracking(orderNumber: string | null) {
  const disconnectRef = useRef<(() => void) | null>(null);

  const [orderState,    setOrderState]    = useState<OrderSocketPayload | null>(null);
  const [riderLocation, setRiderLocation] = useState<RiderLocation | null>(null);
  const [connStatus,    setConnStatus]    = useState<ConnectionStatus>('connecting');
  const [statusChanged, setStatusChanged] = useState(false);

  const connect = useCallback(async () => {
      console.log('[Tracking] connect called, orderNumber:', orderNumber);
    if (!orderNumber) return;
    disconnectRef.current?.();

    const disconnect = await createOrderSocket(orderNumber, {
      onState:  (data) => setOrderState(data),
      onUpdate: (data) => {
        setOrderState((prev) => {
          if (prev?.status !== data.status) {
            setStatusChanged(true);
            setTimeout(() => setStatusChanged(false), 2000);
          }
          return data;
        });
      },
      onRiderLocation: (loc) => setRiderLocation(loc),
      onStatusChange:  (s)   => setConnStatus(s),
      onError:         (msg) => console.warn('[Socket]', msg),
    });

    disconnectRef.current = disconnect;
  }, [orderNumber]);

  useEffect(() => {
    connect();
    return () => {
      disconnectRef.current?.();
      disconnectRef.current = null;
    };
  }, [connect]);

  const reconnect = useCallback(() => connect(), [connect]);

  return { orderState, riderLocation, connStatus, statusChanged, reconnect };
}