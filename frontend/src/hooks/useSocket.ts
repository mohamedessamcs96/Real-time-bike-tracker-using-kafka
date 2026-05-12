import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LocationUpdate, Alert } from '../types';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3001';

interface SocketState {
  connected: boolean;
  clientsCount: number;
  lastLocation: LocationUpdate | null;
  lastAlert: Alert | null;
  locationUpdates: LocationUpdate[];
  alerts: Alert[];
}

export function useSocket(onLocation?: (update: LocationUpdate) => void) {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<SocketState>({
    connected: false,
    clientsCount: 0,
    lastLocation: null,
    lastAlert: null,
    locationUpdates: [],
    alerts: [],
  });

  useEffect(() => {
    const socket = io(WS_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setState(s => ({ ...s, connected: true }));
      console.log('🔌 Connected to NextBike WebSocket');
    });

    socket.on('disconnect', () => {
      setState(s => ({ ...s, connected: false }));
    });

    socket.on('clients_count', (count: number) => {
      setState(s => ({ ...s, clientsCount: count }));
    });

    socket.on('bike_location', (update: LocationUpdate) => {
      onLocation?.(update);
      setState(s => ({
        ...s,
        lastLocation: update,
        locationUpdates: [update, ...s.locationUpdates.slice(0, 49)],
      }));
    });

    socket.on('alert', (alert: Alert) => {
      setState(s => ({
        ...s,
        lastAlert: alert,
        alerts: [alert, ...s.alerts.slice(0, 19)],
      }));
    });

    return () => { socket.disconnect(); };
  }, []);

  const sendPing = useCallback(() => {
    socketRef.current?.emit('ping', {});
  }, []);

  return { ...state, sendPing };
}
