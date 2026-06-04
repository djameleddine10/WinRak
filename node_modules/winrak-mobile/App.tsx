import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar, SafeAreaView,
  Platform,
} from 'react-native';

const API = 'http://192.168.1.5:3000/api/v1';
const C = {
  primary: '#1A1A2E',
  secondary: '#F5A623',
  accent: '#00D4AA',
  error: '#FF4757',
  success: '#2ED573',
  bg: '#F8F9FA',
};

async function apiFetch(method: string, path: string, body?: object, token?: string) {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  } catch {
    return { success: false, message: 'تعذر الاتصال بالخادم' };
  }
}

// ─────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<'role' | 'login' | 'passenger' | 'driver'>('role');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);

  const handleLogin = (t: string, u: any) => {
    setToken(t);
    setUser(u);
    setScreen(role);
  };

  if (screen === 'role')
    return <RoleScreen onSelect={(r) => { setRole(r); setScreen('login'); }} />;
  if (screen === 'login')
    return <LoginScreen role={role} onLogin={handleLogin} onBack={() => setScreen('role')} />;
  if (screen === 'passenger')
    return <PassengerApp token={token} user={user} onLogout={() => setScreen('role')} />;
  if (screen === 'driver')
    return <DriverApp token={token} user={user} onLogout={() => setScreen('role')} />;
  return null;
}

// ─── شاشة اختيار الدور ────────────────────────────────────────
function RoleScreen({ onSelect }: { onSelect: (r: 'passenger' | 'driver') => void }) {
  return (
    <View style={s.roleBg}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={s.roleInner}>
        <View style={s.logoWrap}>
          <Text style={s.logoW}>W</Text>
        </View>
        <Text style={s.appNameTxt}>WinRak</Text>
        <Text style={s.taglineTxt}>وين راك؟ نجيك! 🚖</Text>

        <Text style={s.whoTxt}>من أنت؟</Text>

        <TouchableOpacity style={s.roleCard} onPress={() => onSelect('passenger')}>
          <Text style={s.roleEmoji}>🧑</Text>
          <View>
            <Text style={s.roleCardTitle}>راكب</Text>
            <Text style={s.roleCardSub}>اطلب رحلة الآن</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[s.roleCard, { backgroundColor: C.accent }]} onPress={() => onSelect('driver')}>
          <Text style={s.roleEmoji}>🚗</Text>
          <View>
            <Text style={[s.roleCardTitle, { color: C.primary }]}>سائق</Text>
            <Text style={[s.roleCardSub, { color: '#1A1A2Eaa' }]}>استقبل رحلات واربح</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── شاشة تسجيل الدخول ────────────────────────────────────────
function LoginScreen({ role, onLogin, onBack }: {
  role: string;
  onLogin: (t: string, u: any) => void;
  onBack: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone) return Alert.alert('', 'أدخل رقم الهاتف');
    setLoading(true);
    const r = await apiFetch('POST', '/auth/send-otp', { phone });
    setLoading(false);
    if (r.success !== false) { setStep('otp'); Alert.alert('✅', 'تم إرسال الرمز'); }
    else Alert.alert('خطأ', r.message);
  };

  const verify = async () => {
    setLoading(true);
    const r = await apiFetch('POST', '/auth/verify-otp', { phone, code });
    setLoading(false);
    if (r.success !== false) onLogin(r.accessToken, r.user);
    else Alert.alert('خطأ', r.message);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={s.loginWrap}>
        <TouchableOpacity onPress={onBack} style={s.backRow}>
          <Text style={s.backTxt}>← رجوع</Text>
        </TouchableOpacity>

        <Text style={s.loginTitle}>
          {role === 'passenger' ? '🧑 دخول الراكب' : '🚗 دخول السائق'}
        </Text>

        {step === 'phone' ? (
          <>
            <Text style={s.fieldLabel}>رقم الهاتف</Text>
            <TextInput
              style={s.field}
              value={phone}
              onChangeText={setPhone}
              placeholder="+213XXXXXXXXX"
              keyboardType="phone-pad"
              textAlign="right"
            />
            <TouchableOpacity
              style={s.hintBox}
              onPress={() => setPhone(role === 'driver' ? '+213660000001' : '+213555000001')}>
              <Text style={s.hintTxt}>
                💡 اضغط لتعبئة رقم تجريبي ({role === 'driver' ? 'سائق' : 'راكب'})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={sendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} /> : <Text style={s.btnTxt}>إرسال رمز التحقق</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={s.fieldLabel}>رمز التحقق (6 أرقام)</Text>
            <TextInput
              style={[s.field, { textAlign: 'center', fontSize: 28, letterSpacing: 8, fontWeight: '700' }]}
              value={code}
              onChangeText={setCode}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
            />
            <TouchableOpacity style={s.hintBox} onPress={() => setCode('000000')}>
              <Text style={s.hintTxt}>💡 اضغط لتعبئة الرمز التجريبي: 000000</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btn} onPress={verify} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} /> : <Text style={s.btnTxt}>دخول ✅</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── تطبيق الراكب ─────────────────────────────────────────────
function PassengerApp({ token, user, onLogout }: { token: string; user: any; onLogout: () => void }) {
  const [tab, setTab] = useState<'home' | 'book' | 'rides' | 'profile'>('home');
  const [svc, setSvc] = useState('GO');
  const [estimate, setEstimate] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const SERVICES = [
    { type: 'GO', icon: '🚗', name: 'WinRak GO', desc: 'اقتصادي' },
    { type: 'PLUS', icon: '🚙', name: 'WinRak PLUS', desc: 'مريح' },
    { type: 'XL', icon: '🚐', name: 'WinRak XL', desc: 'عائلي' },
    { type: 'SHE', icon: '👩', name: 'WinRak SHE', desc: 'للسيدات' },
  ];

  const PICKUP  = { lat: 36.749, lng: 3.052, address: 'حيدرة، الجزائر' };
  const DROPOFF = { lat: 36.770, lng: 2.990, address: 'باب الوادي، الجزائر' };

  const getEstimate = async () => {
    setLoading(true);
    const r = await apiFetch('POST', '/rides/estimate', {
      pickupLat: PICKUP.lat, pickupLng: PICKUP.lng,
      dropoffLat: DROPOFF.lat, dropoffLng: DROPOFF.lng,
      vehicleType: svc,
    }, token);
    setLoading(false);
    if (r.total) setEstimate(r);
    else Alert.alert('', r.message || 'فشل الاتصال');
  };

  const requestRide = async () => {
    setLoading(true);
    const r = await apiFetch('POST', '/rides/request', {
      pickupLat: PICKUP.lat, pickupLng: PICKUP.lng, pickupAddress: PICKUP.address,
      dropoffLat: DROPOFF.lat, dropoffLng: DROPOFF.lng, dropoffAddress: DROPOFF.address,
      serviceType: svc, paymentMethod: 'CASH',
    }, token);
    setLoading(false);
    if (r.ride) {
      setActiveRide(r.ride);
      Alert.alert('✅ تم الطلب!', `${svc} — ${r.ride.totalFare} دج\nالحالة: جاري البحث عن سائق`);
    } else Alert.alert('خطأ', r.message);
  };

  const loadRides = async () => {
    const r = await apiFetch('GET', '/rides/my', undefined, token);
    if (r.rides) setRides(r.rides);
  };

  React.useEffect(() => { if (tab === 'rides') loadRides(); }, [tab]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerSub}>مرحباً {user?.fullName?.split(' ')[0] || ''} 👋</Text>
        <Text style={s.headerTitle}>🧑 تطبيق الراكب</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>

        {/* HOME */}
        {tab === 'home' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>⭐ رصيد WinPoints</Text>
              <Text style={s.bigNum}>{user?.winPoints || 0} <Text style={{ fontSize: 16, color: '#888' }}>نقطة</Text></Text>
            </View>
            <View style={s.card}>
              <Text style={s.cardTitle}>📍 رحلة تجريبية جاهزة</Text>
              <Text style={s.routeTxt}>🟢 من: {PICKUP.address}</Text>
              <Text style={s.routeTxt}>🔴 إلى: {DROPOFF.address}</Text>
              <TouchableOpacity style={[s.btn, { marginTop: 14 }]} onPress={() => setTab('book')}>
                <Text style={s.btnTxt}>اطلب رحلة الآن 🚖</Text>
              </TouchableOpacity>
            </View>
            {activeRide && (
              <View style={[s.card, { borderColor: C.accent, borderWidth: 2 }]}>
                <Text style={s.cardTitle}>🚖 رحلتك الجارية</Text>
                <Text style={s.routeTxt}>الحالة: <Text style={{ color: C.accent, fontWeight: '700' }}>{activeRide.status}</Text></Text>
                <Text style={s.routeTxt}>الأجرة: {activeRide.totalFare} دج</Text>
              </View>
            )}
          </>
        )}

        {/* BOOK */}
        {tab === 'book' && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>اختر نوع الخدمة</Text>
              {SERVICES.map(sv => (
                <TouchableOpacity
                  key={sv.type}
                  style={[s.svcRow, svc === sv.type && s.svcRowSel]}
                  onPress={() => { setSvc(sv.type); setEstimate(null); }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.secondary, minWidth: 60 }}>
                    {estimate && svc === sv.type ? `${estimate.total} دج` : ''}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ textAlign: 'right', fontWeight: '700', color: C.primary }}>{sv.name}</Text>
                    <Text style={{ textAlign: 'right', color: '#888', fontSize: 12 }}>{sv.desc}</Text>
                  </View>
                  <Text style={{ fontSize: 26 }}>{sv.icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[s.btn, { backgroundColor: '#eee' }]} onPress={getEstimate} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} /> : <Text style={[s.btnTxt, { color: C.primary }]}>احسب السعر 💰</Text>}
            </TouchableOpacity>

            {estimate && (
              <View style={[s.card, { backgroundColor: '#FFFBF0' }]}>
                <Text style={s.cardTitle}>تقدير الرحلة</Text>
                <Text style={s.infoRow}>💰 السعر: <Text style={s.infoVal}>{estimate.total} دج</Text></Text>
                <Text style={s.infoRow}>📏 المسافة: <Text style={s.infoVal}>{estimate.estimatedDistance?.toFixed(1)} كم</Text></Text>
                <Text style={s.infoRow}>⏱️ المدة: <Text style={s.infoVal}>{estimate.estimatedDuration} دق</Text></Text>
              </View>
            )}

            <TouchableOpacity style={s.btn} onPress={requestRide} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} /> : <Text style={s.btnTxt}>تأكيد الطلب 🚖</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* RIDES */}
        {tab === 'rides' && (
          <>
            <Text style={s.secTitle}>سجل رحلاتك ({rides.length})</Text>
            {rides.length === 0 && <Text style={s.emptyTxt}>لا توجد رحلات بعد</Text>}
            {rides.map((r: any) => (
              <View key={r.id} style={s.rideCard}>
                <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-between' }}>
                  <Text style={{ color: r.status === 'COMPLETED' ? C.success : C.error, fontWeight: '700', fontSize: 13 }}>
                    {r.status === 'COMPLETED' ? '✅ مكتملة' : r.status === 'CANCELLED' ? '❌ ملغاة' : '🔄 ' + r.status}
                  </Text>
                  <Text style={{ color: C.secondary, fontWeight: '800', fontSize: 15 }}>{r.totalFare} دج</Text>
                </View>
                <Text style={s.routeTxt}>{r.pickupAddress} ← {r.dropoffAddress}</Text>
                <Text style={{ color: '#aaa', fontSize: 11, textAlign: 'right' }}>
                  {new Date(r.requestedAt).toLocaleDateString('ar-DZ')} | {r.serviceType}
                </Text>
              </View>
            ))}
          </>
        )}

        {/* PROFILE */}
        {tab === 'profile' && (
          <>
            <View style={[s.card, { alignItems: 'center' }]}>
              <Text style={{ fontSize: 60, marginBottom: 10 }}>🧑</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>{user?.fullName || 'راكب'}</Text>
              <Text style={{ color: '#888', marginBottom: 14 }}>{user?.phone}</Text>
              <View style={{ backgroundColor: C.secondary + '22', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 }}>
                <Text style={{ color: C.primary, fontWeight: '700' }}>⭐ {user?.winPoints || 0} WinPoints</Text>
              </View>
            </View>
            <TouchableOpacity style={[s.btn, { backgroundColor: C.error }]} onPress={onLogout}>
              <Text style={[s.btnTxt, { color: '#fff' }]}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Tab Bar */}
      <View style={s.tabBar}>
        {[
          { id: 'home', icon: '🏠', label: 'الرئيسية' },
          { id: 'book', icon: '🚖', label: 'اطلب' },
          { id: 'rides', icon: '📋', label: 'رحلاتي' },
          { id: 'profile', icon: '👤', label: 'حسابي' },
        ].map(t => (
          <TouchableOpacity key={t.id} style={s.tabItem} onPress={() => setTab(t.id as any)}>
            <Text style={{ fontSize: 22 }}>{t.icon}</Text>
            <Text style={[s.tabLbl, tab === t.id && { color: C.primary, fontWeight: '700' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── تطبيق السائق ─────────────────────────────────────────────
function DriverApp({ token, user, onLogout }: { token: string; user: any; onLogout: () => void }) {
  const [tab, setTab] = useState<'home' | 'earnings' | 'contract' | 'profile'>('home');
  const [isOnline, setIsOnline] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    apiFetch('GET', '/drivers/me/earnings?period=today', undefined, token).then(r => { if (r.success !== false) setEarnings(r); });
    apiFetch('GET', '/contracts/my', undefined, token).then(r => { if (r.contract) setContract(r.contract); });
  }, []);

  const toggleOnline = async () => {
    setLoading(true);
    const r = await apiFetch('PATCH', '/drivers/status', { isOnline: !isOnline }, token);
    setLoading(false);
    if (r.success !== false) {
      setIsOnline(r.isOnline);
      Alert.alert(r.isOnline ? '🟢 متصل!' : '🔴 غير متصل', r.isOnline ? 'ستستقبل الطلبات الآن' : 'أوقفت الخدمة');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />

      <View style={[s.header, { backgroundColor: C.primary }]}>
        <Text style={[s.headerSub, { color: '#ffffff88' }]}>مرحباً {user?.fullName?.split(' ')[0] || 'سائق'} 👋</Text>
        <Text style={[s.headerTitle, { color: '#fff' }]}>🚗 تطبيق السائق</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>

        {tab === 'home' && (
          <>
            <View style={[s.card, { borderColor: isOnline ? C.success : '#eee', borderWidth: 2 }]}>
              <Text style={s.cardTitle}>حالتك الآن</Text>
              <Text style={{ textAlign: 'center', fontSize: 16, color: isOnline ? C.success : '#aaa', fontWeight: '700', marginBottom: 14 }}>
                {isOnline ? '🟢 متصل — تستقبل الطلبات' : '🔴 غير متصل'}
              </Text>
              <TouchableOpacity style={[s.btn, { backgroundColor: isOnline ? C.error : C.success }]} onPress={toggleOnline} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={[s.btnTxt, { color: '#fff' }]}>{isOnline ? 'إيقاف الخدمة' : 'ابدأ العمل'}</Text>}
              </TouchableOpacity>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>💰 أرباح اليوم</Text>
              <Text style={s.bigNum}>{Math.round(earnings?.total || 0)} <Text style={{ fontSize: 16, color: '#888' }}>دج</Text></Text>
              <Text style={{ textAlign: 'center', color: '#888', fontSize: 13 }}>{earnings?.driver?.totalTrips || 0} رحلة إجمالاً</Text>
            </View>

            {contract && (
              <View style={[s.card, { borderColor: C.accent, borderWidth: 1.5 }]}>
                <Text style={[s.cardTitle, { color: C.accent }]}>🛡️ عقد الشراكة</Text>
                <Text style={s.infoRow}>نوع العقد: <Text style={s.infoVal}>{contract.contractType}</Text></Text>
                <Text style={s.infoRow}>حصتك: <Text style={[s.infoVal, { color: C.success }]}>{contract.profitDriverPercent}%</Text></Text>
                <Text style={s.infoRow}>WinRak تغطي الخسائر: <Text style={[s.infoVal, { color: C.accent }]}>{contract.lossWinrakPercent}%</Text></Text>
              </View>
            )}
          </>
        )}

        {tab === 'contract' && contract && (
          <>
            <View style={[s.card, { backgroundColor: C.primary }]}>
              <Text style={[s.cardTitle, { color: '#fff', fontSize: 18 }]}>📄 عقد الشراكة مع WinRak</Text>
              <View style={{ backgroundColor: C.success + '33', borderRadius: 16, padding: 8, alignSelf: 'center', marginTop: 6 }}>
                <Text style={{ color: C.success, fontWeight: '700' }}>✅ ساري المفعول</Text>
              </View>
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>💰 توزيع الأرباح</Text>
              <View style={{ flexDirection: 'row-reverse', justifyContent: 'space-around', marginTop: 8 }}>
                <View style={{ alignItems: 'center', backgroundColor: C.success + '22', borderRadius: 14, padding: 16, minWidth: 110 }}>
                  <Text style={{ fontSize: 36, fontWeight: '900', color: C.success }}>{contract.profitDriverPercent}%</Text>
                  <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>حصتك</Text>
                </View>
                <Text style={{ alignSelf: 'center', color: '#ccc', fontWeight: '700' }}>vs</Text>
                <View style={{ alignItems: 'center', backgroundColor: C.secondary + '22', borderRadius: 14, padding: 16, minWidth: 110 }}>
                  <Text style={{ fontSize: 36, fontWeight: '900', color: C.secondary }}>{contract.profitWinrakPercent}%</Text>
                  <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>WinRak</Text>
                </View>
              </View>
            </View>

            <View style={[s.card, { borderColor: C.accent, borderWidth: 2 }]}>
              <Text style={[s.cardTitle, { color: C.accent }]}>🛡️ تقاسم الخسائر — الميزة الحصرية</Text>
              <Text style={s.infoRow}>WinRak تتحمل: <Text style={[s.infoVal, { color: C.accent, fontSize: 20 }]}>{contract.lossWinrakPercent}%</Text></Text>
              <Text style={s.infoRow}>أقصى خسارة شهرية عليك: <Text style={[s.infoVal, { color: C.error }]}>{contract.monthlyLossCap?.toLocaleString()} دج</Text></Text>
              <Text style={{ textAlign: 'right', color: '#666', fontSize: 13, marginTop: 10, lineHeight: 22 }}>
                ✅ حوادث الطريق{'\n'}
                ✅ أعطال السيارة أثناء الرحلة{'\n'}
                ✅ أضرار الراكب{'\n'}
                ✅ إلغاء الرحلة المفاجئ
              </Text>
            </View>
          </>
        )}

        {tab === 'profile' && (
          <>
            <View style={[s.card, { alignItems: 'center' }]}>
              <Text style={{ fontSize: 60, marginBottom: 10 }}>🚗</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>{user?.fullName || 'سائق'}</Text>
              <Text style={{ color: '#888', marginBottom: 14 }}>{user?.phone}</Text>
            </View>
            <TouchableOpacity style={[s.btn, { backgroundColor: C.error }]} onPress={onLogout}>
              <Text style={[s.btnTxt, { color: '#fff' }]}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={s.tabBar}>
        {[
          { id: 'home', icon: '🏠', label: 'الرئيسية' },
          { id: 'earnings', icon: '💰', label: 'الأرباح' },
          { id: 'contract', icon: '📄', label: 'العقد' },
          { id: 'profile', icon: '👤', label: 'حسابي' },
        ].map(t => (
          <TouchableOpacity key={t.id} style={s.tabItem} onPress={() => setTab(t.id as any)}>
            <Text style={{ fontSize: 22 }}>{t.icon}</Text>
            <Text style={[s.tabLbl, tab === t.id && { color: C.primary, fontWeight: '700' }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const s = StyleSheet.create({
  roleBg: { flex: 1, backgroundColor: C.primary },
  roleInner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  logoWrap: { width: 90, height: 90, borderRadius: 22, backgroundColor: C.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: C.secondary, shadowOpacity: 0.4, shadowRadius: 20, elevation: 12 },
  logoW: { fontSize: 50, fontWeight: '900', color: C.primary },
  appNameTxt: { fontSize: 38, fontWeight: '900', color: '#fff', marginBottom: 6 },
  taglineTxt: { fontSize: 15, color: C.secondary, marginBottom: 48 },
  whoTxt: { fontSize: 18, color: '#fff', fontWeight: '700', marginBottom: 20 },
  roleCard: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.secondary, borderRadius: 18, padding: 20, marginBottom: 14 },
  roleEmoji: { fontSize: 32 },
  roleCardTitle: { fontSize: 20, fontWeight: '800', color: C.primary },
  roleCardSub: { fontSize: 13, color: C.primary + '99', marginTop: 2 },
  loginWrap: { padding: 28, paddingTop: Platform.OS === 'ios' ? 60 : 40 },
  backRow: { marginBottom: 32 },
  backTxt: { color: C.primary, fontSize: 16 },
  loginTitle: { fontSize: 26, fontWeight: '800', color: C.primary, textAlign: 'right', marginBottom: 28 },
  fieldLabel: { fontSize: 14, color: '#666', textAlign: 'right', marginBottom: 8 },
  field: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14, padding: 14, fontSize: 16, color: C.primary, backgroundColor: '#f9f9f9', marginBottom: 8 },
  hintBox: { backgroundColor: '#FFF8E7', borderRadius: 10, padding: 12, marginBottom: 20 },
  hintTxt: { fontSize: 13, color: '#888', textAlign: 'right' },
  header: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.primary, textAlign: 'right' },
  headerSub: { fontSize: 13, color: '#888', textAlign: 'right' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.primary, textAlign: 'right', marginBottom: 12 },
  bigNum: { fontSize: 44, fontWeight: '900', color: C.primary, textAlign: 'center', marginBottom: 4 },
  routeTxt: { fontSize: 14, color: '#555', textAlign: 'right', marginBottom: 6 },
  btn: { backgroundColor: C.secondary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  btnTxt: { color: C.primary, fontWeight: '800', fontSize: 16 },
  svcRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#eee', marginBottom: 8, gap: 10 },
  svcRowSel: { borderColor: C.secondary, backgroundColor: '#FFFBF0' },
  infoRow: { fontSize: 14, color: '#555', textAlign: 'right', marginBottom: 8 },
  infoVal: { fontWeight: '700', color: C.primary },
  secTitle: { fontSize: 16, fontWeight: '700', color: C.primary, textAlign: 'right', marginBottom: 12 },
  emptyTxt: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  rideCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tabBar: { flexDirection: 'row-reverse', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 10 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLbl: { fontSize: 10, color: '#bbb', marginTop: 2 },
});
