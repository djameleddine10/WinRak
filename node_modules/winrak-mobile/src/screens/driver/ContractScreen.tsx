import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../utils/theme';
import { contractsApi } from '../../services/api';

interface Contract {
  id: string; contractType: string;
  profitDriverPercent: number; profitWinrakPercent: number;
  lossWinrakPercent: number; lossDriverPercent: number;
  monthlyLossCap: number; signedAt?: string; validUntil?: string;
  isActive: boolean;
}

const LOSS_CASES = [
  { icon: '🚗', label: 'حوادث الطريق' },
  { icon: '🔧', label: 'أعطال السيارة أثناء الرحلة' },
  { icon: '👤', label: 'أضرار الراكب' },
  { icon: '❌', label: 'إلغاء الرحلة المفاجئ' },
  { icon: '🛡️', label: 'حوادث طريق طارئة' },
];

export default function ContractScreen() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [terms, setTerms] = useState('');
  const [pendingContractId, setPendingContractId] = useState<string | null>(null);

  useEffect(() => { loadContract(); }, []);

  const loadContract = async () => {
    try {
      const { data } = await contractsApi.getMyContract();
      setContract(data.contract);
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // No contract yet — load terms to show offer
        try {
          const { data } = await contractsApi.getTerms();
          setTerms(data.terms);
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!pendingContractId) return;
    Alert.alert(
      'تأكيد التوقيع',
      'بتوقيعك هذا العقد، تقر بقراءة وفهم والموافقة على جميع الشروط والأحكام.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'توقيع العقد ✅', onPress: async () => {
            setSigning(true);
            try {
              await contractsApi.sign(pendingContractId, `driver-sig-${Date.now()}`);
              Alert.alert('مرحباً! 🎉', 'تم توقيع العقد بنجاح. يمكنك الآن البدء باستقبال الطلبات.');
              loadContract();
            } catch (err: any) {
              Alert.alert('خطأ', err?.response?.data?.message);
            } finally {
              setSigning(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!contract) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.noContractCard}>
          <Text style={styles.noContractIcon}>📄</Text>
          <Text style={styles.noContractTitle}>لا يوجد عقد نشط</Text>
          <Text style={styles.noContractDesc}>
            تواصل مع فريق WinRak لإنشاء عرض عقد مناسب لك.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <Text style={styles.headerIcon}>📄</Text>
        <Text style={styles.headerTitle}>عقد الشراكة مع WinRak</Text>
        <View style={[styles.statusBadge, { backgroundColor: contract.isActive && contract.signedAt ? '#E8F8F0' : '#FFF3E0' }]}>
          <Text style={[styles.statusText, { color: contract.isActive && contract.signedAt ? COLORS.success : '#FF9800' }]}>
            {contract.isActive && contract.signedAt ? '✅ ساري' : '⏳ بانتظار التوقيع'}
          </Text>
        </View>
      </View>

      {/* Contract Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>نوع العقد</Text>
        <Text style={styles.contractTypeBadge}>
          {contract.contractType === 'STANDARD' ? '⭐ أساسي'
            : contract.contractType === 'PREMIUM' ? '💎 مميز'
            : '🤝 شريك'}
        </Text>
      </View>

      {/* Profit Sharing */}
      <View style={styles.splitCard}>
        <Text style={styles.splitTitle}>💰 توزيع الأرباح</Text>
        <View style={styles.splitRow}>
          <View style={[styles.splitPill, { backgroundColor: COLORS.success + '22' }]}>
            <Text style={[styles.splitPercent, { color: COLORS.success }]}>{contract.profitDriverPercent}%</Text>
            <Text style={styles.splitLabel}>حصتك</Text>
          </View>
          <View style={styles.splitVS}><Text style={styles.vsText}>vs</Text></View>
          <View style={[styles.splitPill, { backgroundColor: COLORS.secondary + '22' }]}>
            <Text style={[styles.splitPercent, { color: COLORS.secondary }]}>{contract.profitWinrakPercent}%</Text>
            <Text style={styles.splitLabel}>WinRak</Text>
          </View>
        </View>
      </View>

      {/* Loss Sharing — THE KEY FEATURE */}
      <View style={[styles.splitCard, { borderColor: COLORS.accent, borderWidth: 1.5 }]}>
        <View style={styles.featureBanner}>
          <Ionicons name="shield-checkmark" size={18} color={COLORS.accent} />
          <Text style={styles.featureBannerText}>الميزة الحصرية لـ WinRak</Text>
        </View>
        <Text style={styles.splitTitle}>🛡️ تقاسم الخسائر</Text>
        <Text style={styles.lossCapText}>
          WinRak تتحمل <Text style={styles.lossHighlight}>{contract.lossWinrakPercent}%</Text> من أي خسارة
        </Text>
        <Text style={styles.lossCapText}>
          أقصى خسارة شهرية عليك:{' '}
          <Text style={styles.lossHighlight}>{contract.monthlyLossCap.toLocaleString()} دج</Text>
        </Text>

        {/* Cases */}
        <Text style={styles.casesTitle}>✅ الحالات المغطاة:</Text>
        {LOSS_CASES.map((c, i) => (
          <View key={i} style={styles.caseRow}>
            <Text style={styles.caseIcon}>{c.icon}</Text>
            <Text style={styles.caseLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* Dates */}
      {contract.signedAt && (
        <View style={styles.datesCard}>
          <View style={styles.dateRow}>
            <Text style={styles.dateValue}>{new Date(contract.signedAt).toLocaleDateString('ar-DZ')}</Text>
            <Text style={styles.dateLabel}>📅 تاريخ التوقيع</Text>
          </View>
          {contract.validUntil && (
            <View style={styles.dateRow}>
              <Text style={styles.dateValue}>{new Date(contract.validUntil).toLocaleDateString('ar-DZ')}</Text>
              <Text style={styles.dateLabel}>⏳ صالح حتى</Text>
            </View>
          )}
        </View>
      )}

      {/* Sign Button (if not signed) */}
      {!contract.signedAt && (
        <TouchableOpacity
          style={[styles.signBtn, signing && styles.disabledBtn]}
          onPress={handleSign}
          disabled={signing}
        >
          {signing
            ? <ActivityIndicator color={COLORS.primary} />
            : <>
                <Ionicons name="create" size={20} color={COLORS.primary} />
                <Text style={styles.signBtnText}>توقيع العقد الآن</Text>
              </>
          }
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16 },
  headerIcon: { fontSize: 40, marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 12 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  statusText: { fontSize: 13, fontWeight: '700' },

  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.sm },
  sectionTitle: { fontSize: 13, color: '#888', textAlign: 'right', marginBottom: 8 },
  contractTypeBadge: { fontSize: 20, fontWeight: '700', color: COLORS.primary, textAlign: 'right' },

  splitCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, ...SHADOWS.sm },
  splitTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, textAlign: 'right', marginBottom: 14 },
  splitRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-around' },
  splitPill: { alignItems: 'center', borderRadius: 14, padding: 16, minWidth: 100 },
  splitPercent: { fontSize: 32, fontWeight: '900' },
  splitLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  splitVS: { width: 30, alignItems: 'center' },
  vsText: { color: '#ccc', fontWeight: '700' },

  featureBanner: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.accent + '18', borderRadius: 8, padding: 8, marginBottom: 12,
  },
  featureBannerText: { color: COLORS.accent, fontWeight: '700', fontSize: 13 },
  lossCapText: { fontSize: 14, color: '#555', textAlign: 'right', marginBottom: 6 },
  lossHighlight: { color: COLORS.accent, fontWeight: '800', fontSize: 16 },
  casesTitle: { fontSize: 13, fontWeight: '700', color: '#444', textAlign: 'right', marginTop: 12, marginBottom: 8 },
  caseRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, paddingVertical: 5 },
  caseIcon: { fontSize: 16 },
  caseLabel: { fontSize: 13, color: '#555' },

  datesCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, ...SHADOWS.sm },
  dateRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', paddingVertical: 8 },
  dateLabel: { fontSize: 13, color: '#888' },
  dateValue: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  signBtn: {
    backgroundColor: COLORS.secondary, borderRadius: 16, paddingVertical: 16,
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10,
  },
  signBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 17 },
  disabledBtn: { opacity: 0.5 },

  noContractCard: { backgroundColor: '#fff', borderRadius: 20, padding: 40, alignItems: 'center', ...SHADOWS.md },
  noContractIcon: { fontSize: 60, marginBottom: 16 },
  noContractTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: 10 },
  noContractDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
});
