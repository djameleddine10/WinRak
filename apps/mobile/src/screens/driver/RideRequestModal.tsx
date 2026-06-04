import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';

interface Props {
  request: {
    rideId: string;
    pickup: { address: string };
    dropoff: { address: string };
    serviceType: string;
    fare: number;
    estimatedDistance: number;
    estimatedDuration: number;
  };
  onAccept: () => void;
  onReject: () => void;
  timeoutSeconds?: number;
}

export default function RideRequestModal({ request, onAccept, onReject, timeoutSeconds = 10 }: Props) {
  const timerAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Timer countdown bar
    Animated.timing(timerAnim, {
      toValue: 0, duration: timeoutSeconds * 1000, useNativeDriver: false,
    }).start(() => onReject());

    // Pulse glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const timerWidth = timerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Modal transparent animationType="slide">
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
          {/* Timer Bar */}
          <View style={styles.timerTrack}>
            <Animated.View style={[styles.timerBar, { width: timerWidth }]} />
          </View>

          <Text style={styles.title}>🚨 طلب رحلة جديد!</Text>

          {/* Route Info */}
          <View style={styles.routeBox}>
            <View style={styles.routeRow}>
              <View style={styles.dotGreen} />
              <Text style={styles.routeText} numberOfLines={2}>{request.pickup.address}</Text>
            </View>
            <View style={styles.routeDivider} />
            <View style={styles.routeRow}>
              <View style={styles.dotRed} />
              <Text style={styles.routeText} numberOfLines={2}>{request.dropoff.address}</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{request.fare} دج</Text>
              <Text style={styles.statLabel}>الأجرة</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{request.estimatedDistance.toFixed(1)} كم</Text>
              <Text style={styles.statLabel}>المسافة</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{request.estimatedDuration} دق</Text>
              <Text style={styles.statLabel}>المدة</Text>
            </View>
          </View>

          {/* Service Badge */}
          <View style={styles.serviceBadge}>
            <Text style={styles.serviceBadgeText}>🚗 {request.serviceType}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
              <Ionicons name="close" size={28} color={COLORS.error} />
              <Text style={styles.rejectText}>رفض</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
              <Ionicons name="checkmark" size={28} color="#fff" />
              <Text style={styles.acceptText}>قبول</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  card: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40, ...SHADOWS.lg,
  },
  timerTrack: { height: 4, backgroundColor: '#f0f0f0', borderRadius: 2, marginBottom: 20, overflow: 'hidden' },
  timerBar: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 2 },
  title: { fontSize: 22, fontWeight: '900', color: COLORS.primary, textAlign: 'center', marginBottom: 16 },

  routeBox: { backgroundColor: '#f9f9f9', borderRadius: 14, padding: 14, marginBottom: 16 },
  routeRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10 },
  routeDivider: { height: 18, width: 2, backgroundColor: '#ddd', marginLeft: 5, marginVertical: 4 },
  dotGreen: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accent, marginTop: 3 },
  dotRed:   { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.error,  marginTop: 3 },
  routeText: { flex: 1, fontSize: 14, color: COLORS.primary, textAlign: 'right', lineHeight: 20 },

  statsRow: { flexDirection: 'row-reverse', justifyContent: 'space-around', marginBottom: 14 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#eee' },

  serviceBadge: {
    alignSelf: 'center', backgroundColor: '#EEF0FF',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 20,
  },
  serviceBadgeText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },

  btnRow: { flexDirection: 'row-reverse', gap: 14 },
  acceptBtn: {
    flex: 2, backgroundColor: COLORS.success, borderRadius: 18,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16,
  },
  acceptText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  rejectBtn: {
    flex: 1, backgroundColor: '#FFF0F0', borderRadius: 18,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 16,
  },
  rejectText: { color: COLORS.error, fontWeight: '700', fontSize: 16 },
});
