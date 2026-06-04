import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        const { data } = await axios.post(`${BASE_URL}/auth/refresh-token`, { refreshToken });
        await SecureStore.setItemAsync('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ──────────────────────────────────────────────────────
export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, code: string) => api.post('/auth/verify-otp', { phone, code }),
};

// ─── Rides ─────────────────────────────────────────────────────
export const ridesApi = {
  estimate: (params: {
    pickupLat: number; pickupLng: number;
    dropoffLat: number; dropoffLng: number;
    vehicleType?: string;
  }) => api.post('/rides/estimate', params),

  request: (params: {
    pickupLat: number; pickupLng: number; pickupAddress: string;
    dropoffLat: number; dropoffLng: number; dropoffAddress: string;
    serviceType: string; paymentMethod: string;
  }) => api.post('/rides/request', params),

  cancel: (rideId: string, reason?: string) => api.patch(`/rides/${rideId}/cancel`, { reason }),
  getById: (rideId: string) => api.get(`/rides/${rideId}`),
  getMyRides: (page?: number) => api.get('/rides/my', { params: { page } }),

  // Driver actions
  accept: (rideId: string) => api.patch(`/rides/${rideId}/accept`),
  arrived: (rideId: string) => api.patch(`/rides/${rideId}/arrived`),
  start: (rideId: string) => api.patch(`/rides/${rideId}/start`),
  complete: (rideId: string) => api.patch(`/rides/${rideId}/complete`),
};

// ─── Drivers ───────────────────────────────────────────────────
export const driversApi = {
  register: () => api.post('/drivers/register'),
  getProfile: () => api.get('/drivers/me'),
  updateStatus: (isOnline: boolean) => api.patch('/drivers/status', { isOnline }),
  getEarnings: (period?: string) => api.get('/drivers/me/earnings', { params: { period } }),
  getMyRides: (page?: number) => api.get('/drivers/me/rides', { params: { page } }),
  submitDocuments: (documents: { docType: string; fileUrl: string }[]) =>
    api.post('/drivers/me/documents', { documents }),
};

// ─── Users ─────────────────────────────────────────────────────
export const usersApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: object) => api.patch('/users/me', data),
  getWinPoints: () => api.get('/users/me/win-points'),
  addEmergencyContact: (name: string, phone: string) =>
    api.post('/users/emergency-contacts', { name, phone }),
};

// ─── Contracts ─────────────────────────────────────────────────
export const contractsApi = {
  getMyContract: () => api.get('/contracts/my'),
  getTerms: () => api.get('/contracts/terms'),
  sign: (contractId: string, signature: string) =>
    api.post('/contracts/sign', { contractId, signature }),
};

// ─── Ratings ───────────────────────────────────────────────────
export const ratingsApi = {
  submit: (data: object) => api.post('/ratings', data),
};

// ─── Notifications ─────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  updateFcmToken: (fcmToken: string) => api.patch('/notifications/fcm-token', { fcmToken }),
};
