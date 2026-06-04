import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { useRideStore } from '../store/rideStore';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

let socket: Socket | null = null;

export const connectSocket = async (): Promise<Socket> => {
  if (socket?.connected) return socket;

  const token = await SecureStore.getItemAsync('accessToken');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => console.log('🔌 Socket connected'));
  socket.on('disconnect', () => console.log('🔌 Socket disconnected'));

  // ─── Ride Events ────────────────────────────────────────────
  socket.on('ride:status_changed', (data: { rideId: string; status: string; driver?: any }) => {
    const { updateActiveRide } = useRideStore.getState();
    updateActiveRide({ status: data.status, ...(data.driver && { driver: data.driver }) });
  });

  socket.on('driver:location_update', (data: { lat: number; lng: number }) => {
    const { updateDriverLocation } = useRideStore.getState();
    updateDriverLocation(data.lat, data.lng);
  });

  return socket;
};

export const disconnectSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = () => socket;

export const emitLocationUpdate = (lat: number, lng: number, heading?: number) => {
  socket?.emit('location:update', { lat, lng, heading });
};

export const emitDriverOnline = () => socket?.emit('driver:go_online');
export const emitDriverOffline = () => socket?.emit('driver:go_offline');

export const emitSOS = (lat: number, lng: number, rideId?: string) => {
  socket?.emit('sos:trigger', { lat, lng, rideId });
};

export const sendChatMessage = (rideId: string, message: string) => {
  socket?.emit('chat:send', { rideId, message });
};
