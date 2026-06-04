import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, Alert, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../../utils/theme';
import { useRideStore } from '../../store/rideStore';
import { useAuthStore } from '../../store/authStore';

const ALGIERS_REGION = {
  latitude: 36.7372, longitude: 3.0865,
  latitudeDelta: 0.05, longitudeDelta: 0.05,
};

const RECENT_PLACES = [
  { id: '1', name: 'حي الأمير عبد القادر', address: 'Alger Centre' },
  { id: '2', name: 'جامعة هواري بومدين', address: 'Bab Ezzouar' },
  { id: '3', name: 'مطار هواري بومدين', address: 'Dar El Beida' },
];

interface Props {
  onSearch: () => void;
}

export default function HomeScreen({ onSearch }: Props) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { setPickup } = useRideStore();
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude: lat, longitude: lng } = loc.coords;
      setUserLocation({ lat, lng });

      mapRef.current?.animateToRegion({
        latitude: lat, longitude: lng,
        latitudeDelta: 0.01, longitudeDelta: 0.01,
      }, 1000);

      // Reverse geocode for pickup
      const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const address = [place.street, place.district, place.city].filter(Boolean).join('، ');
      setPickup({ lat, lng, address: address || 'موقعك الحالي' });
    })();
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 18) return 'مساء الخير';
    return 'مساء النور';
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={ALGIERS_REGION}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {userLocation && (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
            title="موقعك الحالي"
          />
        )}
      </MapView>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.menuBtn}>
          <Ionicons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.searchBar} onPress={onSearch} activeOpacity={0.9}>
          <Ionicons name="search" size={18} color="#999" />
          <Text style={styles.searchPlaceholder}>{t('home.whereToGo')}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        <Text style={styles.greetingText}>
          {greeting()}، {user?.fullName?.split(' ')[0] || 'مرحباً'} 👋
        </Text>
        <Text style={styles.pointsText}>
          <Ionicons name="star" size={14} color={COLORS.secondary} /> {user?.winPoints || 0} نقطة WinPoints
        </Text>

        {/* Recent Places */}
        <Text style={styles.sectionTitle}>{t('home.recentPlaces')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
          {RECENT_PLACES.map((place) => (
            <TouchableOpacity key={place.id} style={styles.recentItem} onPress={onSearch}>
              <View style={styles.recentIcon}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.recentName}>{place.name}</Text>
                <Text style={styles.recentAddress}>{place.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Request Button */}
        <TouchableOpacity style={styles.requestBtn} onPress={onSearch}>
          <Ionicons name="car" size={22} color={COLORS.primary} />
          <Text style={styles.requestText}>{t('home.requestRide')}</Text>
        </TouchableOpacity>
      </View>

      {/* SOS Button */}
      <TouchableOpacity style={styles.sosBtn} onPress={() => Alert.alert('طوارئ', 'هل تريد إرسال تنبيه طوارئ؟', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'إرسال الآن', style: 'destructive', onPress: () => {} },
      ])}>
        <Text style={styles.sosText}>{t('ride.sos')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },

  topBar: {
    position: 'absolute', top: 50, left: 16, right: 16,
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  menuBtn: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.md,
  },
  searchBar: {
    flex: 1, height: 46, backgroundColor: '#fff', borderRadius: 23,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8,
    ...SHADOWS.md,
  },
  searchPlaceholder: { color: '#999', fontSize: 15, flex: 1, textAlign: 'right' },

  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36,
    ...SHADOWS.lg,
  },
  greetingText: { fontSize: 18, fontWeight: '700', color: COLORS.primary, textAlign: 'right', marginBottom: 4 },
  pointsText: { fontSize: 13, color: '#888', textAlign: 'right', marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', textAlign: 'right', marginBottom: 12 },

  recentScroll: { marginBottom: 20 },
  recentItem: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    backgroundColor: '#f8f8f8', borderRadius: 12, padding: 12,
    marginLeft: 10, minWidth: 180,
  },
  recentIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EEF0FF', justifyContent: 'center', alignItems: 'center',
  },
  recentName: { fontSize: 13, fontWeight: '600', color: COLORS.primary, textAlign: 'right' },
  recentAddress: { fontSize: 11, color: '#999', textAlign: 'right' },

  requestBtn: {
    backgroundColor: COLORS.secondary, borderRadius: 16,
    paddingVertical: 16, flexDirection: 'row-reverse',
    justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  requestText: { color: COLORS.primary, fontWeight: '800', fontSize: 17 },

  sosBtn: {
    position: 'absolute', top: 50, right: 16,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: COLORS.error,
    justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.md,
  },
  sosText: { color: '#fff', fontWeight: '800', fontSize: 11 },
});
