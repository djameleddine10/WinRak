import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SHADOWS } from '../../utils/theme';
import { ratingsApi } from '../../services/api';
import { useRideStore } from '../../store/rideStore';

interface Props {
  onDone: () => void;
}

const CRITERIA = [
  { key: 'cleanlinessScore',     label: 'النظافة',            icon: '🧹' },
  { key: 'professionalismScore', label: 'الاحترافية',          icon: '👔' },
  { key: 'safetyScore',          label: 'السلامة',             icon: '🛡️' },
  { key: 'punctualityScore',     label: 'الالتزام بالوقت',     icon: '⏰' },
] as const;

export default function RatingScreen({ onDone }: Props) {
  const { t } = useTranslation();
  const { activeRide } = useRideStore();
  const [overallScore, setOverallScore] = useState(5);
  const [scores, setScores] = useState<Record<string, number>>({
    cleanlinessScore: 5, professionalismScore: 5, safetyScore: 5, punctualityScore: 5,
  });
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!activeRide?.id || !activeRide?.driver?.id) return;
    setLoading(true);
    try {
      await ratingsApi.submit({
        rideId: activeRide.id,
        revieweeId: activeRide.driver.id,
        overallScore,
        ...scores,
        comment,
      });
      Alert.alert('شكراً! 🌟', 'تم إرسال تقييمك بنجاح.', [{ text: 'حسناً', onPress: onDone }]);
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل إرسال التقييم');
    } finally {
      setLoading(false);
    }
  };

  const StarRow = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)}>
          <Ionicons
            name={star <= value ? 'star' : 'star-outline'}
            size={32}
            color={star <= value ? COLORS.secondary : '#ddd'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Driver Info */}
        <View style={styles.driverHeader}>
          <View style={styles.avatar}><Text style={{ fontSize: 36 }}>👤</Text></View>
          <Text style={styles.driverName}>{activeRide?.driver?.name || 'السائق'}</Text>
          <Text style={styles.vehicleInfo}>
            {activeRide?.driver?.vehicle?.brand} {activeRide?.driver?.vehicle?.model}
          </Text>
        </View>

        <Text style={styles.question}>{t('rating.howWasRide')}</Text>

        {/* Overall Stars */}
        <StarRow value={overallScore} onChange={setOverallScore} />

        {/* Criteria */}
        <View style={styles.criteriaContainer}>
          {CRITERIA.map((c) => (
            <View key={c.key} style={styles.criteriaRow}>
              <View style={styles.miniStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setScores((s) => ({ ...s, [c.key]: star }))}>
                    <Ionicons
                      name={star <= (scores[c.key] || 0) ? 'star' : 'star-outline'}
                      size={18}
                      color={star <= (scores[c.key] || 0) ? COLORS.secondary : '#ddd'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.criteriaLabel}>{c.icon} {c.label}</Text>
            </View>
          ))}
        </View>

        {/* Comment */}
        <TextInput
          style={styles.commentInput}
          placeholder={t('rating.addComment')}
          placeholderTextColor="#aaa"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          textAlign="right"
          textAlignVertical="top"
        />

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={COLORS.primary} />
            : <Text style={styles.submitText}>{t('rating.submit')} ⭐</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={onDone} style={styles.skipBtn}>
          <Text style={styles.skipText}>{t('rating.skip')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, ...SHADOWS.lg },
  driverHeader: { alignItems: 'center', marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  driverName: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  vehicleInfo: { fontSize: 13, color: '#888', marginTop: 4 },
  question: { fontSize: 16, fontWeight: '600', color: '#555', textAlign: 'center', marginBottom: 12 },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  criteriaContainer: { marginBottom: 16 },
  criteriaRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  criteriaLabel: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  miniStars: { flexDirection: 'row', gap: 4 },
  commentInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 12, fontSize: 14, color: '#333', minHeight: 80, marginBottom: 16 },
  submitBtn: { backgroundColor: COLORS.secondary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  submitText: { color: COLORS.primary, fontWeight: '800', fontSize: 16 },
  disabledBtn: { opacity: 0.5 },
  skipBtn: { alignItems: 'center', padding: 8 },
  skipText: { color: '#aaa', fontSize: 14 },
});
