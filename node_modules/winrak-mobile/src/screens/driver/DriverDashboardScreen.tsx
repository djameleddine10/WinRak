import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, ScrollView, Alert, Vibration,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../../utils/theme';
import { driversApi } from '../../services/api';
import { connectSocket, emitDriverOnline, emitDriverOffline, emitLocationUpdate, getSocket } from '../../services/socket';
import { useAuthStore } from '../../store/authStore';
import RideRequestModal from './RideRequestModal';

interface EarningsSummary { total: number; trips: number; rating: number; }
interface IncomingRequest {
  rideId: string; pickup: { lat: number; lng: number; address: string };
  dropoff: { address: string }; serviceType: string; fare: number;
  estimatedDistance: number; estimatedDuration: number;
}

export default function DriverDashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const mapRef = useRef<MapView>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [earnings, setEarnings] = useState<EarningsSummary>({ total: 0, trips: 0, rating: 5 });
  const [incomingRequest, setIncomingRequest] = useState<IncomingRequest | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationWatcher = useRef<any>(null);

  useEffect(() => {
    loadEarnings();
    setupSocket();
    return () => { locationWatcher.current?.remove(); };
  }, []);

  const loadEarnings = async () => {
    try {
      const { data } = await driversApi.getEarnings('today');
      setEarnings({ total: data.total || 0, trips: data.driver?.totalTrips || 0, rating: Number(data.driver?.rating) || 5 });
    } catch {}
  };

  const setupSocket = async () => {
    const socket = await connectSocket();
    socket.on('ride:new_request', (data: IncomingRequest) => {
      Vibration.vibrate([0, 300, 200, 300]);
      setIncomingRequest(data);
    });
  };

  const toggleOnline = async (value: boolean) => {
    try {
      await driversApi.updateStatus(value);
      setIsOnline(value);
      if (value) {
        emitDriverOnline();
        startLocationTracking();
      } else {
        emitDriverOffline();
        locationWatcher.current?.remove();
      }
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل تغيير الحالة');
    }
  };

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    locationWatcher.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 3000, distanceInterval: 10 },
      (loc) => {
        const { latitude: lat, longitude: lng, heading } = loc.coords;
        setUserLocation({ lat, lng });
        emitLocationUpdate(lat, lng, heading ?? undefined);
        mapRef.current?.animateToRegion(
          { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500
        );
      }
    );
  };

  const handleAcceptRide = async () => {
    if (!incomingRequest) return;
    try {
      const { ridesApi } = await import('../../services/api');
      await ridesApi.accept(incomingRequest.rideId);
      setIncomingRequest(null);
      Alert.alert('تم القبول!', 'توجه إلى نقطة الانطلاق الآن.');
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل قبول الطلب');
      setIncomingRequest(null);
    }
  };

  const handleRejectRide = () => setIncomingRequest(null);

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        initialRegion={{ latitude: 36.7372, longitude: 3.0865, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
      >
        {userLocation && (
          <Marker coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}>
            <View style={styles.driverDot}>
              <Text style={{ fontSize: 22 }}>🚖</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Top Status Card */}
      <View style={styles.topCard}>
        <View style={styles.topCardLeft}>
          <Text style={styles.driverGreeting}>
            مرحباً، {user?.fullName?.split(' ')[0] || 'سائق'} 👋
          </Text>
          <Text style={[styles.statusLabel, { color: isOnline ? COLORS.success : '#aaa' }]}>
            {isOnline ? '● متصل — تستقبل الطلبات' : '○ غير متصل'}
          </Text>
        </View>
        <View style={styles.onlineToggleContainer}>
          <Text style={styles.toggleLabel}>{isOnline ? t('driver.goOffline') : t('driver.goOnline')}</Text>
          <Switch
            value={isOnline}
            onValueChange={toggleOnline}
            trackColor={{ false: '#ddd', true: COLORS.success + '88' }}
            thumbColor={isOnline ? COLORS.success : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{earnings.total.toFixed(0)}</Text>
          <Text style={styles.statLabel}>دج اليوم</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{earnings.trips}</Text>
          <Text style={styles.statLabel}>رحلة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{earnings.rating.toFixed(1)} ⭐</Text>
          <Text style={styles.statLabel}>التقييم</Text>
        </View>
      </View>

      {/* Earnings Quick Panel */}
      <View style={styles.earningsPanel}>
        <View style={styles.earningsPanelHeader}>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>عرض الكل</Text>
          </TouchableOpacity>
          <Text style={styles.earningsPanelTitle}>💰 صندوق الأرباح</Text>
        </View>
        <View style={styles.earningsBigRow}>
          <View>
            <Text style={styles.earningsBig}>{earnings.total.toFixed(0)} <Text style={styles.earningsCurrency}>دج</Text></Text>
            <Text style={styles.earningsNote}>إجمالي أرباح اليوم</Text>
          </View>
          <Ionicons name="trending-up" size={40} color={COLORS.success} />
        </View>
        <View style={styles.contractRow}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.accent} />
          <Text style={styles.contractNote}>تقاسم الخسائر مفعّل ✅  — WinRak تغطي حتى 30%</Text>
        </View>
      </View>

      {/* Incoming Request Modal */}
      {incomingRequest && (
        <RideRequestModal
          request={incomingRequest}
          onAccept={handleAcceptRide}
          onReject={handleRejectRide}
          timeoutSeconds={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  driverDot: { alignItems: 'center' },

  topCard: {
    position: 'absolute', top: 48, left: 16, right: 16,
    backgroundColor: '#fff', borderRadius: 18, padding: 16,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    ...SHADOWS.md,
  },
  topCardLeft: {},
  driverGreeting: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  statusLabel: { fontSize: 13, marginTop: 2 },
  onlineToggleContainer: { alignItems: 'center', gap: 4 },
  toggleLabel: { fontSize: 11, color: '#888' },

  statsRow: {
    position: 'absolute', top: 140, left: 16, right: 16,
    flexDirection: 'row-reverse', gap: 10,
  },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 12, alignItems: 'center', ...SHADOWS.sm,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  earningsPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, ...SHADOWS.lg,
  },
  earningsPanelHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  earningsPanelTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  seeAllText: { color: COLORS.accent, fontSize: 13 },
  earningsBigRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  earningsBig: { fontSize: 36, fontWeight: '900', color: COLORS.primary },
  earningsCurrency: { fontSize: 16, color: '#888' },
  earningsNote: { fontSize: 12, color: '#aaa' },
  contractRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: '#F0FFF8', borderRadius: 10, padding: 10 },
  contractNote: { fontSize: 12, color: COLORS.accent, flex: 1, textAlign: 'right' },
});
