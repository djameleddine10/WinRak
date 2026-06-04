import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar, SafeAreaView,
} from 'react-native';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.5:3000/api/v1';
const C = { primary: '#1A1A2E', secondary: '#F5A623', accent: '#00D4AA', error: '#FF4757', success: '#2ED573', bg: '#F8F9FA' };

// ─── Simple API helper ────────────────────────────────────────
async function api(method: string, path: string, body?: object, token?: string) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<'role' | 'login' | 'passenger' | 'driver'>('role');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);

  if (screen === 'role') return <RoleScreen onSelect={(r) => { setRole(r); setScreen('login'); }} />;
  if (screen === 'login') return <LoginScreen role={role} onLogin={(t, u) => { setToken(t); setUser(u); setScreen(role); }} onBack={() => setScreen('role')} />;
  if (screen === 'passenger') return <PassengerApp token={token} user={user} onLogout={() => setScreen('role')} />;
  if (screen === 'driver') return <DriverApp token={token} user={user} onLogout={() => setScreen('role')} />;
  return null;
}

// ─── ROLE SELECTION ───────────────────────────────────────────
function RoleScreen({ onSelect }: { onSelect: (r: 'passenger' | 'driver') => void }) {
  return (
    <SafeAreaView style={[s.flex, { backgroundColor: C.primary }]}>
      <StatusBar barStyle="light-content" />
      <View style={s.roleContainer}>
        <View style={s.logoBox}>
          <Text style={s.logoW}>W</Text>
        </View>
        <Text style={s.appName}>وين راك</Text>
        <Text style={s.tagline}>وين راك؟ نجيك! 🚖</Text>

        <Text style={s.roleQuestion}>من أنت؟</Text>

        <TouchableOpacity style={s.roleBtn} onPress={() => onSelect('passenger')}>
          <Text style={s.roleBtnIcon}>🧑</Text>
          <View>
            <Text style={s.roleBtnTitle}>راكب</Text>
            <Text style={s.roleBtnSub}>اطلب رحلة الآن</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[s.roleBtn, { backgroundColor: C.accent }]} onPress={() => onSelect('driver')}>
          <Text style={s.roleBtnIcon}>🚗</Text>
          <View>
            <Text style={[s.roleBtnTitle, { color: C.primary }]}>سائق</Text>
            <Text style={[s.roleBtnSub, { color: C.primary + 'aa' }]}>استقبل رحلات واربح</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ role, onLogin, onBack }: { role: string; onLogin: (t: string, u: any) => void; onBack: () => void }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (phone.length < 9) return Alert.alert('', 'أدخل رقم هاتف صحيح');
    setLoading(true);
    const r = await api('POST', '/auth/send-otp', { phone });
    setLoading(false);
    if (r.success) { setStep('otp'); Alert.alert('✅', r.message); }
    else Alert.alert('خطأ', r.message);
  };

  const verify = async () => {
    setLoading(true);
    const r = await api('POST', '/auth/verify-otp', { phone, code: otp });
    setLoading(false);
    if (r.success) onLogin(r.accessToken, r.user);
    else Alert.alert('خطأ', r.message);
  };

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: C.bg }]}>
      <View style={s.loginContainer}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Text style={s.backText}>→ رجوع</Text>
        </TouchableOpacity>

        <Text style={s.loginTitle}>{role === 'passenger' ? '🧑 تسجيل الراكب' : '🚗 تسجيل السائق'}</Text>

        {step === 'phone' ? (
          <>
            <Text style={s.label}>رقم الهاتف</Text>
            <TextInput style={s.input} value={phone} onChangeText={setPhone}
              placeholder="+213XXXXXXXXX" keyboardType="phone-pad" textAlign="right" />
            <View style={s.hint}>
              <Text style={s.hintText}>💡 للتجربة استخدم:</Text>
              <TouchableOpacity onPress={() => setPhone(role === 'driver' ? '+213660000001' : '+213555000001')}>
                <Text style={s.hintBtn}>{role === 'driver' ? '+213660000001 (سائق)' : '+213555000001 (راكب)'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.btn} onPress={sendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} /> : <Text style={s.btnText}>إرسال رمز التحقق</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.label}>رمز التحقق (OTP)</Text>
            <TextInput style={[s.input, s.otpInput]} value={otp} onChangeText={setOtp}
              placeholder="6 أرقام" keyboardType="numeric" maxLength={6} textAlign="center" />
            <View style={s.hint}>
              <Text style={s.hintText}>💡 للتجربة: الرمز السحري</Text>
              <TouchableOpacity onPress={() => setOtp('000000')}>
                <Text style={s.hintBtn}>000000 (اضغط للتعبئة)</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.btn} onPress={verify} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} /> : <Text style={s.btnText}>تحقق ودخول</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── PASSENGER APP ────────────────────────────────────────────
function PassengerApp({ token, user, onLogout }: { token: string; user: any; onLogout: () => void }) {
  const [tab, setTab] = useState<'home' | 'book' | 'rides' | 'profile'>('home');
  const [estimate, setEstimate] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const SERVICES = [
    { type: 'GO', icon: '🚗', name: 'GO', desc: 'اقتصادي' },
    { type: 'PLUS', icon: '🚙', name: 'PLUS', desc: 'مريح' },
    { type: 'XL', icon: '🚐', name: 'XL', desc: 'عائلي' },
    { type: 'SHE', icon: '👩', name: 'SHE', desc: 'للسيدات' },
  ];

  const [selectedService, setSelectedService] = useState('GO');

  // Test coordinates (Algiers)
  const PICKUP  = { lat: 36.749, lng: 3.052, address: 'حيدرة، الجزائر' };
  const DROPOFF = { lat: 36.770, lng: 2.990, address: 'باب الوادي، الجزائر' };

  const getEstimate = async () => {
    setLoading(true);
    const r = await api('POST', '/rides/estimate', {
      pickupLat: PICKUP.lat, pickupLng: PICKUP.lng,
      dropoffLat: DROPOFF.lat, dropoffLng: DROPOFF.lng,
      vehicleType: selectedService,
    }, token);
    setLoading(false);
    if (r.success !== false) setEstimate(r);
  };

  const requestRide = async () => {
    setLoading(true);
    const r = await api('POST', '/rides/request', {
      pickupLat: PICKUP.lat, pickupLng: PICKUP.lng, pickupAddress: PICKUP.address,
      dropoffLat: DROPOFF.lat, dropoffLng: DROPOFF.lng, dropoffAddress: DROPOFF.address,
      serviceType: selectedService, paymentMethod: 'CASH',
    }, token);
    setLoading(false);
    if (r.success !== false) {
      setActiveRide(r.ride);
      Alert.alert('✅ تم!', `طلبت رحلة ${selectedService} بـ ${r.ride.totalFare} دج\nالحالة: ${r.ride.status}`);
    } else Alert.alert('خطأ', r.message);
  };

  const loadRides = async () => {
    const r = await api('GET', '/rides/my', undefined, token);
    if (r.rides) setRides(r.rides);
  };

  useEffect(() => { if (tab === 'rides') loadRides(); }, [tab]);

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerSub}>مرحباً، {user?.fullName?.split(' ')[0] || 'راكب'} 👋</Text>
        <Text style={s.headerTitle}>🧑 تطبيق الراكب</Text>
      </View>

      {/* Content */}
      <ScrollView style={s.flex} contentContainerStyle={s.content}>

        {tab === 'home' && (
          <View>
            <View style={s.card}>
              <Text style={s.cardTitle}>⭐ نقاطك</Text>
              <Text style={s.bigNum}>{user?.winPoints || 0} <Text style={s.bigNumSub}>WinPoints</Text></Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>📍 رحلة تجريبية</Text>
              <Text style={s.routeText}>من: {PICKUP.address}</Text>
              <Text style={s.routeText}>إلى: {DROPOFF.address}</Text>
              <TouchableOpacity style={[s.btn, { marginTop: 12 }]} onPress={() => setTab('book')}>
                <Text style={s.btnText}>اطلب رحلة 🚖</Text>
              </TouchableOpacity>
            </View>
            {activeRide && (
              <View style={[s.card, { borderColor: C.accent, borderWidth: 2 }]}>
                <Text style={s.cardTitle}>🚖 رحلتك الجارية</Text>
                <Text style={s.routeText}>الحالة: <Text style={{ color: C.accent, fontWeight: '700' }}>{activeRide.status}</Text></Text>
                <Text style={s.routeText}>الأجرة: {activeRide.totalFare} دج</Text>
                <Text style={s.routeText}>الخدمة: {activeRide.serviceType}</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'book' && (
          <View>
            <View style={s.card}>
              <Text style={s.cardTitle}>اختر نوع الخدمة</Text>
              {SERVICES.map(sv => (
                <TouchableOpacity key={sv.type}
                  style={[s.serviceRow, selectedService === sv.type && s.serviceRowSelected]}
                  onPress={() => { setSelectedService(sv.type); setEstimate(null); }}>
                  <Text style={s.servicePrice}>
                    {estimate && selectedService === sv.type ? `${estimate.total} دج` : ''}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.serviceName}>{sv.icon} {sv.name}</Text>
                    <Text style={s.serviceDesc}>{sv.desc}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[s.btn, { backgroundColor: '#eee' }]} onPress={getEstimate} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} />
                : <Text style={[s.btnText, { color: C.primary }]}>احسب السعر 💰</Text>}
            </TouchableOpacity>

            {estimate && (
              <View style={[s.card, { backgroundColor: '#FFFBF0' }]}>
                <Text style={s.cardTitle}>تقدير الرحلة</Text>
                <Text style={s.estimateRow}>💰 السعر الإجمالي: <Text style={s.estimateVal}>{estimate.total} دج</Text></Text>
                <Text style={s.estimateRow}>📏 المسافة: <Text style={s.estimateVal}>{estimate.estimatedDistance?.toFixed(1)} كم</Text></Text>
                <Text style={s.estimateRow}>⏱️ الوقت: <Text style={s.estimateVal}>{estimate.estimatedDuration} دقيقة</Text></Text>
                {estimate.breakdown?.map((b: any, i: number) => (
                  <Text key={i} style={s.breakdownRow}>• {b.label}: {b.amount} دج</Text>
                ))}
              </View>
            )}

            <TouchableOpacity style={s.btn} onPress={requestRide} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} />
                : <Text style={s.btnText}>تأكيد الطلب 🚖</Text>}
            </TouchableOpacity>
          </View>
        )}

        {tab === 'rides' && (
          <View>
            <Text style={s.sectionTitle}>سجل رحلاتك ({rides.length})</Text>
            {rides.length === 0 && <Text style={s.emptyText}>لا توجد رحلات بعد</Text>}
            {rides.map((ride: any) => (
              <View key={ride.id} style={s.rideCard}>
                <View style={s.rideHeader}>
                  <Text style={[s.rideStatus, { color: ride.status === 'COMPLETED' ? C.success : ride.status === 'CANCELLED' ? C.error : C.secondary }]}>
                    {ride.status === 'COMPLETED' ? '✅ مكتملة' : ride.status === 'CANCELLED' ? '❌ ملغاة' : '🔄 ' + ride.status}
                  </Text>
                  <Text style={s.rideFare}>{ride.totalFare} دج</Text>
                </View>
                <Text style={s.rideRoute}>{ride.pickupAddress} ← {ride.dropoffAddress}</Text>
                <Text style={s.rideDate}>{new Date(ride.requestedAt).toLocaleDateString('ar-DZ')} | {ride.serviceType}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 'profile' && (
          <View>
            <View style={[s.card, { alignItems: 'center' }]}>
              <View style={s.avatarCircle}><Text style={{ fontSize: 40 }}>🧑</Text></View>
              <Text style={s.profileName}>{user?.fullName || 'راكب'}</Text>
              <Text style={s.profilePhone}>{user?.phone}</Text>
              <View style={s.pointsBadge}>
                <Text style={s.pointsText}>⭐ {user?.winPoints || 0} WinPoints</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.btn, { backgroundColor: C.error }]} onPress={onLogout}>
              <Text style={s.btnText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={s.tabBar}>
        {[
          { id: 'home', icon: '🏠', label: 'الرئيسية' },
          { id: 'book', icon: '🚖', label: 'اطلب' },
          { id: 'rides', icon: '📋', label: 'رحلاتي' },
          { id: 'profile', icon: '👤', label: 'حسابي' },
        ].map(t => (
          <TouchableOpacity key={t.id} style={s.tabItem} onPress={() => setTab(t.id as any)}>
            <Text style={s.tabIcon}>{t.icon}</Text>
            <Text style={[s.tabLabel, tab === t.id && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── DRIVER APP ───────────────────────────────────────────────
function DriverApp({ token, user, onLogout }: { token: string; user: any; onLogout: () => void }) {
  const [tab, setTab] = useState<'home' | 'earnings' | 'contract' | 'profile'>('home');
  const [isOnline, setIsOnline] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleOnline = async () => {
    setLoading(true);
    const r = await api('PATCH', '/drivers/status', { isOnline: !isOnline }, token);
    setLoading(false);
    if (r.success !== false) {
      setIsOnline(r.isOnline);
      Alert.alert(r.isOnline ? '✅ متصل!' : 'ℹ️ غير متصل', r.isOnline ? 'ستستقبل الطلبات الآن' : 'لن تستقبل طلبات');
    }
  };

  const loadEarnings = async () => {
    const r = await api('GET', '/drivers/me/earnings?period=today', undefined, token);
    if (r.success !== false) setEarnings(r);
  };

  const loadContract = async () => {
    const r = await api('GET', '/contracts/my', undefined, token);
    if (r.success !== false) setContract(r.contract);
    else setContract(null);
  };

  const loadRides = async () => {
    const r = await api('GET', '/drivers/me/rides', undefined, token);
    if (r.rides) setRides(r.rides);
  };

  useEffect(() => {
    loadEarnings();
    loadContract();
  }, []);

  useEffect(() => {
    if (tab === 'earnings') loadRides();
  }, [tab]);

  return (
    <SafeAreaView style={[s.flex, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[s.header, { backgroundColor: C.primary }]}>
        <Text style={[s.headerSub, { color: '#ffffff88' }]}>مرحباً، {user?.fullName?.split(' ')[0] || 'سائق'} 👋</Text>
        <Text style={[s.headerTitle, { color: '#fff' }]}>🚗 تطبيق السائق</Text>
      </View>

      <ScrollView style={s.flex} contentContainerStyle={s.content}>

        {tab === 'home' && (
          <View>
            {/* Online Toggle */}
            <View style={[s.card, { backgroundColor: isOnline ? '#E8F8F0' : '#fff', borderColor: isOnline ? C.success : '#eee', borderWidth: 2 }]}>
              <Text style={s.cardTitle}>حالتك</Text>
              <Text style={{ textAlign: 'center', fontSize: 16, marginBottom: 16, color: isOnline ? C.success : '#aaa', fontWeight: '700' }}>
                {isOnline ? '🟢 متصل — تستقبل الطلبات' : '🔴 غير متصل'}
              </Text>
              <TouchableOpacity
                style={[s.btn, { backgroundColor: isOnline ? C.error : C.success }]}
                onPress={toggleOnline} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" />
                  : <Text style={[s.btnText, { color: '#fff' }]}>{isOnline ? 'إيقاف الخدمة' : 'ابدأ العمل'}</Text>}
              </TouchableOpacity>
            </View>

            {/* Earnings Today */}
            <View style={s.card}>
              <Text style={s.cardTitle}>💰 أرباح اليوم</Text>
              <Text style={s.bigNum}>{earnings?.total?.toFixed(0) || 0} <Text style={s.bigNumSub}>دج</Text></Text>
              <Text style={{ textAlign: 'center', color: '#888', fontSize: 13 }}>
                {earnings?.driver?.totalTrips || 0} رحلة إجمالاً
              </Text>
            </View>

            {/* Contract Teaser */}
            {contract && (
              <View style={[s.card, { backgroundColor: '#F0FFF8', borderColor: C.accent, borderWidth: 1 }]}>
                <Text style={s.cardTitle}>🛡️ عقد الشراكة</Text>
                <Text style={s.routeText}>نوع العقد: <Text style={{ fontWeight: '700' }}>{contract.contractType}</Text></Text>
                <Text style={s.routeText}>حصتك: <Text style={{ color: C.success, fontWeight: '700' }}>{contract.profitDriverPercent}%</Text></Text>
                <Text style={s.routeText}>WinRak تغطي الخسائر: <Text style={{ color: C.accent, fontWeight: '700' }}>{contract.lossWinrakPercent}%</Text></Text>
                <TouchableOpacity style={[s.btn, { backgroundColor: C.accent, marginTop: 12 }]} onPress={() => setTab('contract')}>
                  <Text style={[s.btnText, { color: C.primary }]}>عرض العقد كاملاً</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {tab === 'earnings' && (
          <View>
            <View style={s.card}>
              <Text style={s.cardTitle}>📊 ملخص الأرباح</Text>
              <Text style={s.estimateRow}>اليوم: <Text style={s.estimateVal}>{earnings?.total?.toFixed(0) || 0} دج</Text></Text>
              <Text style={s.estimateRow}>إجمالي الرحلات: <Text style={s.estimateVal}>{earnings?.driver?.totalTrips || 0}</Text></Text>
              <Text style={s.estimateRow}>التقييم: <Text style={s.estimateVal}>⭐ {Number(earnings?.driver?.rating || 5).toFixed(1)}</Text></Text>
            </View>
            <Text style={s.sectionTitle}>سجل الرحلات</Text>
            {rides.map((ride: any) => (
              <View key={ride.id} style={s.rideCard}>
                <View style={s.rideHeader}>
                  <Text style={[s.rideStatus, { color: C.success }]}>✅ {ride.status}</Text>
                  <Text style={s.rideFare}>{ride.totalFare} دج</Text>
                </View>
                <Text style={s.rideRoute}>{ride.pickupAddress} ← {ride.dropoffAddress}</Text>
                <Text style={s.rideDate}>{new Date(ride.requestedAt).toLocaleDateString('ar-DZ')}</Text>
              </View>
            ))}
            {rides.length === 0 && <Text style={s.emptyText}>لا توجد رحلات بعد</Text>}
          </View>
        )}

        {tab === 'contract' && (
          <View>
            {contract ? (
              <>
                <View style={[s.card, { backgroundColor: C.primary }]}>
                  <Text style={[s.cardTitle, { color: '#fff' }]}>📄 عقد الشراكة مع WinRak</Text>
                  <View style={[s.statusBadge, { backgroundColor: C.success + '33' }]}>
                    <Text style={{ color: C.success, fontWeight: '700', fontSize: 13 }}>✅ ساري المفعول</Text>
                  </View>
                </View>

                <View style={s.card}>
                  <Text style={s.cardTitle}>💰 توزيع الأرباح</Text>
                  <View style={s.splitRow}>
                    <View style={[s.splitBox, { backgroundColor: C.success + '22' }]}>
                      <Text style={[s.splitPct, { color: C.success }]}>{contract.profitDriverPercent}%</Text>
                      <Text style={s.splitLabel}>حصتك</Text>
                    </View>
                    <Text style={s.vsText}>vs</Text>
                    <View style={[s.splitBox, { backgroundColor: C.secondary + '22' }]}>
                      <Text style={[s.splitPct, { color: C.secondary }]}>{contract.profitWinrakPercent}%</Text>
                      <Text style={s.splitLabel}>WinRak</Text>
                    </View>
                  </View>
                </View>

                <View style={[s.card, { borderColor: C.accent, borderWidth: 2 }]}>
                  <Text style={[s.cardTitle, { color: C.accent }]}>🛡️ تقاسم الخسائر (ميزتنا الحصرية)</Text>
                  <Text style={s.routeText}>WinRak تتحمل: <Text style={{ color: C.accent, fontWeight: '700', fontSize: 18 }}>{contract.lossWinrakPercent}%</Text></Text>
                  <Text style={s.routeText}>أقصى خسارة شهرية عليك: <Text style={{ color: C.error, fontWeight: '700' }}>{contract.monthlyLossCap?.toLocaleString()} دج</Text></Text>
                  <Text style={[s.routeText, { marginTop: 8, color: '#888', fontSize: 12 }]}>
                    ✅ حوادث الطريق{'\n'}✅ أعطال السيارة{'\n'}✅ أضرار الراكب{'\n'}✅ إلغاء مفاجئ
                  </Text>
                </View>

                <View style={s.card}>
                  <Text style={s.estimateRow}>نوع العقد: <Text style={s.estimateVal}>{contract.contractType}</Text></Text>
                  <Text style={s.estimateRow}>تاريخ التوقيع: <Text style={s.estimateVal}>{contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('ar-DZ') : '—'}</Text></Text>
                  <Text style={s.estimateRow}>صالح حتى: <Text style={s.estimateVal}>{contract.validUntil ? new Date(contract.validUntil).toLocaleDateString('ar-DZ') : '—'}</Text></Text>
                </View>
              </>
            ) : (
              <View style={s.card}>
                <Text style={s.emptyText}>لا يوجد عقد نشط</Text>
              </View>
            )}
          </View>
        )}

        {tab === 'profile' && (
          <View>
            <View style={[s.card, { alignItems: 'center' }]}>
              <View style={[s.avatarCircle, { backgroundColor: C.primary }]}><Text style={{ fontSize: 40 }}>🚗</Text></View>
              <Text style={s.profileName}>{user?.fullName || 'سائق'}</Text>
              <Text style={s.profilePhone}>{user?.phone}</Text>
            </View>
            <TouchableOpacity style={[s.btn, { backgroundColor: C.error }]} onPress={onLogout}>
              <Text style={s.btnText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Tabs */}
      <View style={s.tabBar}>
        {[
          { id: 'home',     icon: '🏠', label: 'الرئيسية' },
          { id: 'earnings', icon: '💰', label: 'الأرباح' },
          { id: 'contract', icon: '📄', label: 'العقد' },
          { id: 'profile',  icon: '👤', label: 'حسابي' },
        ].map(t => (
          <TouchableOpacity key={t.id} style={s.tabItem} onPress={() => setTab(t.id as any)}>
            <Text style={s.tabIcon}>{t.icon}</Text>
            <Text style={[s.tabLabel, tab === t.id && s.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────
const s = StyleSheet.create({
  flex: { flex: 1 },
  roleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  logoBox: { width: 88, height: 88, borderRadius: 22, backgroundColor: C.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: C.secondary, shadowOpacity: 0.5, shadowRadius: 20, elevation: 12 },
  logoW: { fontSize: 48, fontWeight: '900', color: C.primary },
  appName: { fontSize: 36, fontWeight: '900', color: '#fff', marginBottom: 6 },
  tagline: { fontSize: 15, color: C.secondary, marginBottom: 48 },
  roleQuestion: { fontSize: 18, color: '#fff', marginBottom: 20, fontWeight: '700' },
  roleBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.secondary, borderRadius: 18, padding: 20, marginBottom: 14 },
  roleBtnIcon: { fontSize: 32 },
  roleBtnTitle: { fontSize: 20, fontWeight: '800', color: C.primary },
  roleBtnSub: { fontSize: 13, color: C.primary + 'aa', marginTop: 2 },
  loginContainer: { flex: 1, padding: 28, paddingTop: 60 },
  backBtn: { marginBottom: 32 },
  backText: { color: C.primary, fontSize: 16 },
  loginTitle: { fontSize: 26, fontWeight: '800', color: C.primary, textAlign: 'right', marginBottom: 32 },
  label: { fontSize: 14, color: '#666', textAlign: 'right', marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14, padding: 14, fontSize: 16, color: C.primary, backgroundColor: '#f9f9f9', marginBottom: 8 },
  otpInput: { fontSize: 28, fontWeight: '700', letterSpacing: 12, textAlign: 'center' },
  hint: { backgroundColor: '#FFF8E7', borderRadius: 10, padding: 12, marginBottom: 16 },
  hintText: { fontSize: 12, color: '#888', textAlign: 'right' },
  hintBtn: { fontSize: 13, color: C.secondary, fontWeight: '700', textAlign: 'right', marginTop: 4 },
  header: { backgroundColor: C.bg, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.primary, textAlign: 'right' },
  headerSub: { fontSize: 13, color: '#888', textAlign: 'right' },
  content: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.primary, textAlign: 'right', marginBottom: 12 },
  bigNum: { fontSize: 42, fontWeight: '900', color: C.primary, textAlign: 'center', marginBottom: 4 },
  bigNumSub: { fontSize: 18, color: '#888' },
  routeText: { fontSize: 14, color: '#555', textAlign: 'right', marginBottom: 6, lineHeight: 22 },
  btn: { backgroundColor: C.secondary, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: C.primary, fontWeight: '800', fontSize: 16 },
  serviceRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#eee', marginBottom: 8 },
  serviceRowSelected: { borderColor: C.secondary, backgroundColor: '#FFFBF0' },
  serviceName: { fontSize: 15, fontWeight: '700', color: C.primary, textAlign: 'right' },
  serviceDesc: { fontSize: 12, color: '#888', textAlign: 'right' },
  servicePrice: { fontSize: 15, fontWeight: '800', color: C.secondary, minWidth: 70, textAlign: 'left' },
  estimateRow: { fontSize: 14, color: '#555', textAlign: 'right', marginBottom: 6 },
  estimateVal: { fontWeight: '700', color: C.primary },
  breakdownRow: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.primary, textAlign: 'right', marginBottom: 12 },
  emptyText: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  rideCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  rideHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
  rideStatus: { fontSize: 13, fontWeight: '700' },
  rideFare: { fontSize: 15, fontWeight: '800', color: C.secondary },
  rideRoute: { fontSize: 13, color: '#555', textAlign: 'right', marginBottom: 4 },
  rideDate: { fontSize: 11, color: '#aaa', textAlign: 'right' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  profileName: { fontSize: 22, fontWeight: '800', color: C.primary, marginBottom: 4 },
  profilePhone: { fontSize: 14, color: '#888', marginBottom: 16 },
  pointsBadge: { backgroundColor: C.secondary + '22', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8, marginBottom: 24 },
  pointsText: { color: C.primary, fontWeight: '700', fontSize: 15 },
  splitRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-around', marginTop: 8 },
  splitBox: { alignItems: 'center', borderRadius: 14, padding: 16, minWidth: 110 },
  splitPct: { fontSize: 36, fontWeight: '900' },
  splitLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  vsText: { color: '#ccc', fontWeight: '700', fontSize: 16 },
  statusBadge: { alignSelf: 'center', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 8 },
  tabBar: { flexDirection: 'row-reverse', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingVertical: 8, paddingBottom: 20 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 10, color: '#aaa', marginTop: 2 },
  tabLabelActive: { color: C.primary, fontWeight: '700' },
});
