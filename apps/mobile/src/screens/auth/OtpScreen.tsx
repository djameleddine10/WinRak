import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { COLORS } from '../../utils/theme';

interface Props {
  phone: string;
  onBack: () => void;
}

export default function OtpScreen({ phone, onBack }: Props) {
  const { t } = useTranslation();
  const { setAuth } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputs = useRef<TextInput[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();
    if (!value && index > 0) inputs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) return;

    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(phone, code);
      await setAuth(data.user, data.accessToken, data.refreshToken);
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'رمز التحقق غير صحيح');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await authApi.sendOtp(phone);
      setCountdown(60);
      Alert.alert('', 'تم إعادة إرسال الرمز');
    } catch (err: any) {
      Alert.alert('خطأ', err?.response?.data?.message || 'فشل إعادة الإرسال');
    }
  };

  const code = otp.join('');

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn}>
        <Text style={styles.backText}>→ {t('common.back')}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{t('auth.enterOtp')}</Text>
      <Text style={styles.subtitle}>{t('auth.otpSent', { phone })}</Text>

      {/* OTP Boxes */}
      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { if (ref) inputs.current[index] = ref; }}
            style={[styles.otpBox, digit && styles.otpBoxFilled]}
            value={digit}
            onChangeText={(v) => handleChange(v.slice(-1), index)}
            keyboardType="numeric"
            maxLength={1}
            textAlign="center"
            autoFocus={index === 0}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, (code.length < 6 || loading) && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={code.length < 6 || loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>{t('auth.verify')}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={countdown > 0}>
        <Text style={[styles.resendText, countdown > 0 && styles.resendDisabled]}>
          {countdown > 0
            ? t('auth.resendIn', { seconds: countdown })
            : t('auth.resend')
          }
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 28, paddingTop: 60 },
  backBtn: { marginBottom: 32 },
  backText: { color: COLORS.primary, fontSize: 16 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primary, textAlign: 'right', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'right', marginBottom: 40 },
  otpRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 10, marginBottom: 32 },
  otpBox: {
    width: 50, height: 58, borderRadius: 12, borderWidth: 2,
    borderColor: '#e0e0e0', fontSize: 24, fontWeight: '700', color: COLORS.primary,
    backgroundColor: '#f9f9f9',
  },
  otpBoxFilled: { borderColor: COLORS.secondary, backgroundColor: '#FFFBF0' },
  button: {
    backgroundColor: COLORS.secondary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 },
  resendText: { textAlign: 'center', color: COLORS.accent, fontSize: 14 },
  resendDisabled: { color: '#aaa' },
});
