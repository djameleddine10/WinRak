import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Alert, Linking, Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../../utils/theme';
import { useRideStore } from '../../store/rideStore';
import { ridesApi } from '../../services/api';
import { getSocket, emitSOS } from '../../services/socket';
import * as Location from 'expo-location';

const STATUS_LABELS: Record<string, { text: string; color: string; icon: string }> = {
  SEARCHING:       { text: 'جارٍ البحث عن سائق...', color: '#FF9800', icon: 'search' },
  ACCEPTED:        { text: 'السائق في الطريق إليك', color: COLORS.accent,   icon: 'directions-car' },
  DRIVER_ARRIVING: { text: 'السائق يقترب...', color: COLORS.accent, icon: 'near-me' },
  ARRIVED:         { text: '🚗 السائق وصل! اخرج الآن', color: COLORS.success, icon: 'check-circle' },
  IN_PROGRESS:     { text: 'الرحلة جارية 🛣️', color: COLORS.primary, icon: 'navigation' },
  COMPLETED:       { text: 'وصلت بسلام! ✅', color: COLORS.success, icon: 'star' },
  CANCELLED:       { text: 'تم إلغاء الرحلة', color: COLORS.error, icon: 'cancel' },
};

interface Props {
  onRideCompleted: () => void;
}

export default function LiveTrackingScreen({ onRideCompleted }: Props) {
  const { t } = useTranslation();
  const { activeRide, request, updateDriverLocation } = useRideStore();
  const mapRef = useRef<MapView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; mine: boolean }[]>([]);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);

  const status = activeRide?.status || 'SEARCHING';
  const statusInfo = STATUS_LABELS[status] || STATUS_LABELS['SEARCHING'];

  // Pulse animation for searching
  useEffect(() => {
    if (status === 'SEARCHING') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  // Get user location
  useEffect(() => {
    Location.getCurrentPositionAsync({}).then((loc) => {
      setUserLat(loc.coords.latitude);
      setUserLng(loc.coords.longitude);
    });
  }, []);

  // Listen to socket chat events
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('chat:message', (msg: any) => {
      setMessages((prev) => [...prev, { text: msg.message, mine: false }]);
    });
    return () => { socket.off('chat:message'); };
  }, []);

  // Center map on driver when location updates
  useEffect(() => {
    if (activeRide?.driver?.currentLat && activeRide?.driver?.currentLng) {
      mapRef.current?.animateToRegion({
        latitude: activeRide.driver.currentLat,
        longitude: activeRide.driver.currentLng,
        latitudeDelta: 0.015, longitudeDelta: 0.015,
      }, 800);
    }
  }, [activeRide?.driver?.currentLat]);

  // Handle completion
  useEffect(() => {
    if (status === 'COMPLETED') {
      setTimeout(onRideCompleted, 2000);
    }
  }, [status]);

  const handleCancel = () => {
    Alert.alert('إلغاء الرحلة', 'هل تريد إلغاء هذه الرحلة؟', [
      { text: 'لا، ابق', style: 'cancel' },
      {
        text: 'نعم، ألغِ', style: 'destructive',
        onPress: async () => {
          if (activeRide?.id) {
            await ridesApi.cancel(activeRide.id, 'إلغاء من المستخدم');
          }
        },
      },
    ]);
  };

  const handleCall = () => {
    if (activeRide?.driver?.phone) {
      Linking.openURL(`tel:${activeRide.driver.phone}`);
    }
  };

  const handleSOS = async () => {
    Alert.alert('🆘 طوارئ', 'سيتم إرسال موقعك لفريق الدعم وجهات الطوارئ فوراً.', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'إرسال الآن', style: 'destructive',
        onPress: () => {
          if (userLat && userLng) emitSOS(userLat, userLng, activeRide?.id);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: request.pickup?.lat || 36.7372,
          longitude: request.pickup?.lng || 3.0865,
          latitudeDelta: 0.04, longitudeDelta: 0.04,
        }}
        showsUserLocation
      >
        {/* Pickup Marker */}
        {request.pickup && (
          <Marker coordinate={{ latitude: request.pickup.lat, longitude: request.pickup.lng }}
            title="نقطة الانطلاق">
            <View style={styles.pickupMarker}>
              <View style={styles.pickupDot} />
            </View>
          </Marker>
        )}

        {/* Dropoff Marker */}
        {request.dropoff && (
          <Marker coordinate={{ latitude: request.dropoff.lat, longitude: request.dropoff.lng }}
            title="الوجهة">
            <View style={styles.dropoffMarker}>
              <Ionicons name="flag" size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Driver Marker */}
        {activeRide?.driver?.currentLat && activeRide?.driver?.currentLng && (
          <Marker
            coordinate={{ latitude: activeRide.driver.currentLat, longitude: activeRide.driver.currentLng }}
            title={activeRide.driver.name}
          >
            <View style={styles.driverMarker}>
              <Text style={{ fontSize: 24 }}>🚖</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {/* Status Bar */}
      <View style={[styles.statusBar, { backgroundColor: statusInfo.color }]}>
        <Animated.View style={{ transform: [{ scale: status === 'SEARCHING' ? pulseAnim : 1 }] }}>
          <MaterialIcons name={statusInfo.icon as any} size={22} color="#fff" />
        </Animated.View>
        <Text style={styles.statusText}>{statusInfo.text}</Text>
      </View>

      {/* Driver Card */}
      {activeRide?.driver && status !== 'SEARCHING' && status !== 'COMPLETED' && status !== 'CANCELLED' && (
        <View style={styles.driverCard}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={{ fontSize: 28 }}>👤</Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{activeRide.driver.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color={COLORS.secondary} />
                <Text style={styles.ratingText}>{activeRide.driver.rating?.toFixed(1)}</Text>
              </View>
              {activeRide.driver.vehicle && (
                <Text style={styles.vehicleText}>
                  {activeRide.driver.vehicle.color} {activeRide.driver.vehicle.brand} {activeRide.driver.vehicle.model}
                  {'  •  '}{activeRide.driver.vehicle.plateNumber}
                </Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
              <Ionicons name="call" size={20} color={COLORS.primary} />
              <Text style={styles.actionText}>{t('ride.callDriver')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setShowChat(!showChat)}>
              <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
              <Text style={styles.actionText}>{t('ride.chatDriver')}</Text>
            </TouchableOpacity>
            {(status === 'ACCEPTED' || status === 'ARRIVED') && (
              <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={handleCancel}>
                <Ionicons name="close-circle" size={20} color={COLORS.error} />
                <Text style={[styles.actionText, { color: COLORS.error }]}>{t('ride.cancelRide')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Searching Animation */}
      {status === 'SEARCHING' && (
        <View style={styles.searchingCard}>
          <Animated.View style={[styles.searchPulse, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.searchingText}>جارٍ البحث عن أقرب سائق...</Text>
          <TouchableOpacity style={styles.cancelSearchBtn} onPress={handleCancel}>
            <Text style={styles.cancelSearchText}>إلغاء البحث</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SOS Button */}
      <TouchableOpacity style={styles.sosBtn} onPress={handleSOS}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  statusBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingTop: 50, paddingBottom: 14, paddingHorizontal: 20,
  },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 15, flex: 1, textAlign: 'right' },

  driverCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, ...SHADOWS.lg,
  },
  driverInfo: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, marginBottom: 16 },
  driverAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center',
  },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 17, fontWeight: '700', color: COLORS.primary, textAlign: 'right' },
  ratingRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 13, color: '#666' },
  vehicleText: { fontSize: 12, color: '#999', textAlign: 'right', marginTop: 2 },

  actionRow: { flexDirection: 'row-reverse', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: '#f5f5f5', borderRadius: 12, paddingVertical: 12,
  },
  cancelBtn: { backgroundColor: '#FFF0F0' },
  actionText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  searchingCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 32, alignItems: 'center', ...SHADOWS.lg,
  },
  searchPulse: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.secondary + '40', marginBottom: 16,
  },
  searchingText: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 20 },
  cancelSearchBtn: { paddingVertical: 10, paddingHorizontal: 24 },
  cancelSearchText: { color: COLORS.error, fontSize: 14 },

  pickupMarker: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 3, borderColor: COLORS.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  pickupDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  dropoffMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center',
  },
  driverMarker: { alignItems: 'center', justifyContent: 'center' },

  sosBtn: {
    position: 'absolute', top: 110, right: 16,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.error, justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.md,
  },
  sosText: { color: '#fff', fontWeight: '900', fontSize: 12 },
});
