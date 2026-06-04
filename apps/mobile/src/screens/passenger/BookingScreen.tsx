import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS, SPACING, RADIUS } from '../../utils/theme';
import { useRideStore } from '../../store/rideStore';
import { ridesApi } from '../../services/api';
import { connectSocket } from '../../services/socket';

const SERVICES = [
  { type: 'GO',      icon: '🚗', label: 'WinRak GO',      desc: 'اقتصادي', seats: 4 },
  { type: 'PLUS',    icon: '🚙', label: 'WinRak PLUS',    desc: 'مريح',    seats: 4 },
  { type: 'XL',      icon: '🚐', label: 'WinRak XL',      desc: 'عائلي',   seats: 7 },
  { type: 'SHE',     icon: '👩', label: 'WinRak SHE',     desc: 'للسيدات', seats: 4 },
  { type: 'DELIVER', icon: '📦', label: 'WinRak DELIVER', desc: 'توصيل طرود', seats: 0 },
] as const;

interface Props {
  onRideRequested: () => void;
  onBack: () => void;
}

export default function BookingScreen({ onRideRequested, onBack }: Props) {
  const { t } = useTranslation();
  const { request, pricingEstimate, setServiceType, setPaymentMethod, setPricingEstimate, setActiveRide } = useRideStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dropoffText, setDropoffText] = useState(request.dropoff?.address || '');
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [estimates, setEstimates] = useState<Record<string, number>>({});

  // Fetch price estimates for all service types
  useEffect(() => {
    if (!request.pickup || !request.dropoff) return;
    fetchAllEstimates();
  }, [request.pickup, request.dropoff]);

  const fetchAllEstimates = async () => {
    if (!request.pickup || !request.dropoff) return;
    setLoadingEstimate(true);
    try {
      const results = await Promise.all(
        SERVICES.map((s) =>
          ridesApi.estimate({
            pickupLat: request.pickup!.lat, pickupLng: request.pickup!.lng,
            dropoffLat: request.dropoff!.lat, dropoffLng: request.dropoff!.lng,
            vehicleType: s.type,
          }).then(r => ({ type: s.type, total: r.data.total, duration: r.data.estimatedDuration }))
            .catch(() => ({ type: s.type, total: 0, duration: 0 }))
        )
      );
      const map: Record<string, number> = {};
      results.forEach(r => { map[r.type] = r.total; });
      setEstimates(map);

      // Set estimate for selected service
      const selected = results.find(r => r.type === request.serviceType);
      if (selected) setPricingEstimate({ total: selected.total, estimatedDuration: selected.duration, estimatedDistance: 0, breakdown: [] });
    } finally {
      setLoadingEstimate(false);
    }
  };

  const handleConfirmRequest = async () => {
    if (!request.pickup || !request.dropoff) return;
    setLoadingRequest(true);
    try {
      const { data } = await ridesApi.request({
        pickupLat: request.pickup.lat, pickupLng: request.pickup.lng, pickupAddress: request.pickup.address,
        dropoffLat: request.dropoff.lat, dropoffLng: request.dropoff.lng, dropoffAddress: request.dropoff.address,
        serviceType: request.serviceType, paymentMethod: request.paymentMethod,
      });
      setActiveRide({ id: data.ride.id, status: data.ride.status });
      await connectSocket();
      onRideRequested();
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل طلب الرحلة');
    } finally {
      setLoadingRequest(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Map Background */}
      {request.pickup && (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={{
            latitude: request.pickup.lat, longitude: request.pickup.lng,
            latitudeDelta: 0.04, longitudeDelta: 0.04,
          }}
        >
          <Marker coordinate={{ latitude: request.pickup.lat, longitude: request.pickup.lng }}
            pinColor={COLORS.accent} title="الانطلاق" />
          {request.dropoff && (
            <Marker coordinate={{ latitude: request.dropoff.lat, longitude: request.dropoff.lng }}
              pinColor={COLORS.error} title="الوجهة" />
          )}
        </MapView>
      )}

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.sheetHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.sheetTitle}>
            {step === 1 ? 'حدد وجهتك' : step === 2 ? 'اختر الخدمة' : 'تأكيد الرحلة'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* STEP 1 — Destination */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.locationRow}>
              <View style={styles.dotGreen} />
              <View style={styles.locationInput}>
                <Text style={styles.locationText} numberOfLines={1}>{request.pickup?.address || 'موقعك الحالي'}</Text>
              </View>
            </View>
            <View style={styles.dividerLine} />
            <View style={styles.locationRow}>
              <View style={styles.dotRed} />
              <TextInput
                style={styles.locationTextInput}
                placeholder="إلى أين؟"
                placeholderTextColor="#aaa"
                value={dropoffText}
                onChangeText={setDropoffText}
                textAlign="right"
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity
              style={[styles.nextBtn, !request.dropoff && styles.disabledBtn]}
              onPress={() => setStep(2)}
              disabled={!request.dropoff}
            >
              <Text style={styles.nextBtnText}>التالي</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2 — Service Selection */}
        {step === 2 && (
          <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
            {SERVICES.map((svc) => (
              <TouchableOpacity
                key={svc.type}
                style={[styles.serviceCard, request.serviceType === svc.type && styles.serviceCardSelected]}
                onPress={() => {
                  setServiceType(svc.type);
                  const est = estimates[svc.type];
                  if (est) setPricingEstimate({ total: est, estimatedDuration: 0, estimatedDistance: 0, breakdown: [] });
                }}
              >
                <View style={styles.serviceLeft}>
                  <Text style={styles.servicePrice}>
                    {loadingEstimate ? '...' : `${estimates[svc.type] || '--'} دج`}
                  </Text>
                  <Text style={styles.serviceSeats}>
                    {svc.seats > 0 ? `${svc.seats} مقاعد` : ''}
                  </Text>
                </View>
                <View style={styles.serviceRight}>
                  <Text style={styles.serviceLabel}>{svc.label}</Text>
                  <Text style={styles.serviceDesc}>{svc.desc}</Text>
                </View>
                <Text style={styles.serviceIcon}>{svc.icon}</Text>
              </TouchableOpacity>
            ))}

            {/* Payment Method */}
            <Text style={styles.sectionLabel}>طريقة الدفع</Text>
            <View style={styles.paymentRow}>
              {(['CASH', 'CARD'] as const).map((method) => (
                <TouchableOpacity
                  key={method}
                  style={[styles.paymentBtn, request.paymentMethod === method && styles.paymentBtnSelected]}
                  onPress={() => setPaymentMethod(method)}
                >
                  <Ionicons name={method === 'CASH' ? 'cash-outline' : 'card-outline'} size={20}
                    color={request.paymentMethod === method ? COLORS.primary : '#888'} />
                  <Text style={[styles.paymentText, request.paymentMethod === method && styles.paymentTextSelected]}>
                    {method === 'CASH' ? 'نقداً' : 'بطاقة'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
              <Text style={styles.nextBtnText}>متابعة</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* STEP 3 — Confirm */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <Text style={styles.confirmValue}>{request.pickup?.address}</Text>
                <Text style={styles.confirmLabel}>📍 الانطلاق</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmValue}>{request.dropoff?.address}</Text>
                <Text style={styles.confirmLabel}>🏁 الوجهة</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmValue}>{request.serviceType}</Text>
                <Text style={styles.confirmLabel}>🚗 الخدمة</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.confirmRow}>
                <Text style={[styles.confirmValue, styles.priceText]}>
                  {pricingEstimate?.total || '--'} دج
                </Text>
                <Text style={styles.confirmLabel}>💰 السعر المقدر</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.confirmRow}>
                <Text style={styles.confirmValue}>{request.paymentMethod === 'CASH' ? 'نقداً' : 'بطاقة'}</Text>
                <Text style={styles.confirmLabel}>💳 الدفع</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, loadingRequest && styles.disabledBtn]}
              onPress={handleConfirmRequest}
              disabled={loadingRequest}
            >
              {loadingRequest
                ? <ActivityIndicator color={COLORS.primary} />
                : <Text style={styles.confirmBtnText}>تأكيد الطلب 🚖</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setStep(2)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>تعديل</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '65%', ...SHADOWS.lg,
  },
  sheetHeader: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  stepContent: { padding: 20 },

  locationRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 10 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accent },
  dotRed:   { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.error },
  locationInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12 },
  locationText: { fontSize: 14, color: '#333', textAlign: 'right' },
  locationTextInput: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 10, padding: 12, fontSize: 14, color: '#333' },
  dividerLine: { height: 1, backgroundColor: '#eee', marginVertical: 2, marginLeft: 24 },

  serviceCard: {
    flexDirection: 'row-reverse', alignItems: 'center', padding: 14,
    borderRadius: 14, borderWidth: 2, borderColor: '#eee', marginBottom: 10, gap: 12,
  },
  serviceCardSelected: { borderColor: COLORS.secondary, backgroundColor: '#FFFBF0' },
  serviceIcon: { fontSize: 28 },
  serviceRight: { flex: 1 },
  serviceLabel: { fontSize: 15, fontWeight: '700', color: COLORS.primary, textAlign: 'right' },
  serviceDesc: { fontSize: 12, color: '#888', textAlign: 'right' },
  serviceLeft: { alignItems: 'flex-start' },
  servicePrice: { fontSize: 16, fontWeight: '800', color: COLORS.secondary },
  serviceSeats: { fontSize: 11, color: '#aaa' },

  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#666', textAlign: 'right', marginBottom: 10, marginTop: 6 },
  paymentRow: { flexDirection: 'row-reverse', gap: 10, marginBottom: 20 },
  paymentBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: '#eee' },
  paymentBtnSelected: { borderColor: COLORS.secondary, backgroundColor: '#FFFBF0' },
  paymentText: { fontSize: 14, color: '#888' },
  paymentTextSelected: { color: COLORS.primary, fontWeight: '700' },

  nextBtn: { backgroundColor: COLORS.secondary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  nextBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },
  disabledBtn: { opacity: 0.5 },

  confirmCard: { backgroundColor: '#f9f9f9', borderRadius: 16, padding: 16, marginBottom: 16 },
  confirmRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  confirmLabel: { fontSize: 13, color: '#888' },
  confirmValue: { fontSize: 13, fontWeight: '600', color: COLORS.primary, textAlign: 'right', flex: 1, marginRight: 8 },
  priceText: { color: COLORS.secondary, fontSize: 18, fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#eee' },

  confirmBtn: { backgroundColor: COLORS.secondary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  confirmBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 17 },
  editBtn: { alignItems: 'center', padding: 10 },
  editBtnText: { color: '#888', fontSize: 14 },
});
