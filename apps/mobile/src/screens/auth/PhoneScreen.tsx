import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '../../services/api';
import { COLORS } from '../../utils/theme';

interface Props {
  onOtpSent: (phone: string) => void;
}

export default function PhoneScreen({ onOtpSent }: Props) {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (phone.length < 9) return Alert.alert('', 'يرجى إدخال رقم هاتف صحيح');
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      onOtpSent(phone);
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل إرسال الرمز');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.primary, '#16213E']} style={styles.gradient}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>W</Text>
          </View>
          <Text style={styles.appName}>{t('app.name')}</Text>
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.welcomeText}>{t('auth.welcome')}</Text>
          <Text style={styles.label}>{t('auth.enterPhone')}</Text>

          <View style={styles.phoneInputRow}>
            <View style={styles.countryCode}>
              <Text style={styles.countryCodeText}>🇩🇿 +213</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder={t('auth.phonePlaceholder')}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={10}
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, (!phone || loading) && styles.buttonDisabled]}
            onPress={handleSend}
            disabled={!phone || loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>{t('auth.sendOtp')}</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.secondary, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  logoText: { fontSize: 40, fontWeight: '900', color: COLORS.primary },
  appName: { fontSize: 32, fontWeight: '800', color: '#fff', fontFamily: 'Cairo' },
  tagline: { fontSize: 14, color: COLORS.secondary, marginTop: 4 },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 28,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
  },
  welcomeText: { fontSize: 20, fontWeight: '700', color: COLORS.primary, textAlign: 'right', marginBottom: 20 },
  label: { fontSize: 14, color: '#666', textAlign: 'right', marginBottom: 8 },
  phoneInputRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  countryCode: {
    backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 12,
    justifyContent: 'center', borderWidth: 1, borderColor: '#e0e0e0',
  },
  countryCodeText: { fontSize: 14, color: '#333' },
  phoneInput: {
    flex: 1, borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#333',
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: COLORS.secondary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
});
