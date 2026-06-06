import React, { useState, createContext, useContext, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar, SafeAreaView,
  Platform, Modal,
} from 'react-native';
import * as Location from 'expo-location';
import RideMap from './Map';

// ✅ Backend على السحابة - يعمل من أي مكان
const API = 'https://winrak-backend-production.up.railway.app/api/v1';
const C = {
  primary: '#1A1A2E',
  secondary: '#F5A623',
  accent: '#00D4AA',
  error: '#FF4757',
  success: '#2ED573',
  bg: '#F8F9FA',
};

// ═══ الترجمات (3 لغات) ════════════════════════════════════════
const TR: any = {
  ar: {
    tagline: 'وين راك؟ نجيك! 🚖', who: 'من أنت؟',
    passenger: 'راكب', passengerSub: 'اطلب رحلة الآن',
    driver: 'سائق', driverSub: 'استقبل رحلات واربح',
    back: '← رجوع', passengerLogin: '🧑 دخول الراكب', driverLogin: '🚗 دخول السائق',
    phone: 'رقم الهاتف', fillTestP: '💡 اضغط لتعبئة رقم تجريبي (راكب)', fillTestD: '💡 اضغط لتعبئة رقم تجريبي (سائق)',
    sendCode: 'إرسال رمز التحقق', codeLabel: 'رمز التحقق (6 أرقام)', fillCode: '💡 اضغط لتعبئة الرمز التجريبي: 000000',
    login: 'دخول ✅', enterPhone: 'أدخل رقم الهاتف', codeSent: 'تم إرسال الرمز', error: 'خطأ',
    connFail: 'تعذر الاتصال بالخادم',
    hello: 'مرحباً', passengerApp: '🧑 تطبيق الراكب', driverApp: '🚗 تطبيق السائق',
    winBalance: '⭐ رصيد WinPoints', points: 'نقطة', readyTrip: '📍 رحلة تجريبية جاهزة',
    from: 'من', to: 'إلى', orderNow: 'اطلب رحلة الآن 🚖', activeRide: '🚖 رحلتك الجارية', status: 'الحالة',
    searching: '🔍 جاري البحث عن سائق...', accepted: '✅ قبل السائق — في الطريق إليك',
    arrived: '📍 وصل السائق!', ongoing: '🚗 الرحلة جارية', fare: 'الأجرة',
    waitingDriver: 'ننتظر سائقاً قريباً...', driverFound: '🚗 وُجد سائق!', rideEnded: '✅ انتهت الرحلة',
    thanks: 'شكراً لاستخدامك WinRak!', requested: '✅ تم الطلب!',
    chooseService: 'اختر نوع الخدمة', calcPrice: 'احسب السعر 💰', estimate: 'تقدير الرحلة',
    price: '💰 السعر', distance: '📏 المسافة', duration: '⏱️ المدة', km: 'كم', min: 'دق',
    confirmOrder: 'تأكيد الطلب 🚖', ridesHistory: 'سجل رحلاتك', noRides: 'لا توجد رحلات بعد',
    completed: '✅ مكتملة', cancelled: '❌ ملغاة', logout: 'تسجيل الخروج',
    tHome: 'الرئيسية', tBook: 'اطلب', tRides: 'رحلاتي', tProfile: 'حسابي', tRequests: 'الطلبات', tContract: 'العقد',
    economic: 'اقتصادي', comfort: 'مريح', family: 'عائلي', forWomen: 'للسيدات',
    yourStatus: 'حالتك الآن', onlineMsg: '🟢 متصل — تستقبل الطلبات', offlineMsg: '🔴 غير متصل',
    stopWork: 'إيقاف الخدمة', startWork: 'ابدأ العمل', todayEarnings: '💰 أرباح اليوم', da: 'دج',
    totalTrips: 'رحلة إجمالاً', contractShort: '🛡️ عقد الشراكة', contractType: 'نوع العقد',
    yourShare: 'حصتك', winrakLosses: 'WinRak تغطي الخسائر',
    offlineHint: '🔴 أنت غير متصل. اذهب للرئيسية واضغط "ابدأ العمل" لاستقبال الطلبات.',
    currentRide: '🚖 رحلتك الحالية', share85: 'حصتك (85%)', arrivedBtn: '📍 وصلت إلى الراكب',
    startRideBtn: '🚗 بدء الرحلة', endRideBtn: '✅ إنهاء الرحلة', incoming: '📲 الطلبات الواردة',
    waitingReq: 'في انتظار طلبات الركاب...', acceptBtn: 'قبول الطلب ✅',
    acceptedRide: '✅ قبلت الرحلة', goToPassenger: 'توجّه إلى الراكب', rideCompleted: '✅ اكتملت الرحلة',
    earningsAdded: 'تمت إضافة أرباحك (85%)', done: 'تم', notifiedArrival: 'أبلغنا الراكب بوصولك',
    rideStarted: 'بدأت الرحلة', onlineAlert: '🟢 متصل!', willReceive: 'ستستقبل الطلبات الآن',
    offlineAlert: '🔴 غير متصل', stoppedService: 'أوقفت الخدمة',
    contractFull: '📄 عقد الشراكة مع WinRak', active: '✅ ساري المفعول', profitDist: '💰 توزيع الأرباح',
    lossSharing: '🛡️ تقاسم الخسائر — الميزة الحصرية', winrakBears: 'WinRak تتحمل', maxLoss: 'أقصى خسارة شهرية عليك',
    coverList: '✅ حوادث الطريق\n✅ أعطال السيارة أثناء الرحلة\n✅ أضرار الراكب\n✅ إلغاء الرحلة المفاجئ',
    settings: 'الإعدادات', chooseLang: 'اختر اللغة', close: 'إغلاق',
    passengerName: 'راكب', driverName: 'سائق',
    tMap: 'الخريطة', myLocation: '📍 موقعي الحالي', locating: 'جاري تحديد موقعك...',
    locationOff: 'لم نتمكن من تحديد موقعك — فعّل صلاحية الموقع', routeMap: '🗺️ مسار الرحلة', driverOnMap: 'السائق على الخريطة',
  },
  fr: {
    tagline: 'Où es-tu ? On vient ! 🚖', who: 'Qui êtes-vous ?',
    passenger: 'Passager', passengerSub: 'Commander une course',
    driver: 'Chauffeur', driverSub: 'Recevez des courses et gagnez',
    back: '← Retour', passengerLogin: '🧑 Connexion passager', driverLogin: '🚗 Connexion chauffeur',
    phone: 'Numéro de téléphone', fillTestP: '💡 Remplir un numéro test (passager)', fillTestD: '💡 Remplir un numéro test (chauffeur)',
    sendCode: 'Envoyer le code', codeLabel: 'Code de vérification (6 chiffres)', fillCode: '💡 Remplir le code test : 000000',
    login: 'Connexion ✅', enterPhone: 'Entrez le numéro', codeSent: 'Code envoyé', error: 'Erreur',
    connFail: 'Échec de connexion au serveur',
    hello: 'Bonjour', passengerApp: '🧑 Application passager', driverApp: '🚗 Application chauffeur',
    winBalance: '⭐ Solde WinPoints', points: 'points', readyTrip: '📍 Course de démonstration',
    from: 'De', to: 'À', orderNow: 'Commander maintenant 🚖', activeRide: '🚖 Votre course en cours', status: 'Statut',
    searching: '🔍 Recherche d\'un chauffeur...', accepted: '✅ Chauffeur accepté — en route',
    arrived: '📍 Le chauffeur est arrivé !', ongoing: '🚗 Course en cours', fare: 'Prix',
    waitingDriver: 'En attente d\'un chauffeur proche...', driverFound: '🚗 Chauffeur trouvé !', rideEnded: '✅ Course terminée',
    thanks: 'Merci d\'utiliser WinRak !', requested: '✅ Course commandée !',
    chooseService: 'Choisissez le service', calcPrice: 'Calculer le prix 💰', estimate: 'Estimation',
    price: '💰 Prix', distance: '📏 Distance', duration: '⏱️ Durée', km: 'km', min: 'min',
    confirmOrder: 'Confirmer 🚖', ridesHistory: 'Historique des courses', noRides: 'Aucune course',
    completed: '✅ Terminée', cancelled: '❌ Annulée', logout: 'Déconnexion',
    tHome: 'Accueil', tBook: 'Commander', tRides: 'Mes courses', tProfile: 'Profil', tRequests: 'Demandes', tContract: 'Contrat',
    economic: 'Économique', comfort: 'Confort', family: 'Familial', forWomen: 'Pour femmes',
    yourStatus: 'Votre statut', onlineMsg: '🟢 En ligne — vous recevez des demandes', offlineMsg: '🔴 Hors ligne',
    stopWork: 'Arrêter', startWork: 'Commencer', todayEarnings: '💰 Gains du jour', da: 'DA',
    totalTrips: 'courses au total', contractShort: '🛡️ Contrat de partenariat', contractType: 'Type de contrat',
    yourShare: 'Votre part', winrakLosses: 'WinRak couvre les pertes',
    offlineHint: '🔴 Vous êtes hors ligne. Allez à l\'accueil et appuyez sur "Commencer".',
    currentRide: '🚖 Votre course actuelle', share85: 'Votre part (85%)', arrivedBtn: '📍 Arrivé chez le passager',
    startRideBtn: '🚗 Démarrer la course', endRideBtn: '✅ Terminer la course', incoming: '📲 Demandes entrantes',
    waitingReq: 'En attente de demandes...', acceptBtn: 'Accepter ✅',
    acceptedRide: '✅ Course acceptée', goToPassenger: 'Dirigez-vous vers le passager', rideCompleted: '✅ Course terminée',
    earningsAdded: 'Vos gains ont été ajoutés (85%)', done: 'Fait', notifiedArrival: 'Passager informé de votre arrivée',
    rideStarted: 'Course démarrée', onlineAlert: '🟢 En ligne !', willReceive: 'Vous recevrez des demandes',
    offlineAlert: '🔴 Hors ligne', stoppedService: 'Service arrêté',
    contractFull: '📄 Contrat de partenariat WinRak', active: '✅ Actif', profitDist: '💰 Répartition des profits',
    lossSharing: '🛡️ Partage des pertes — exclusif', winrakBears: 'WinRak prend en charge', maxLoss: 'Perte mensuelle max',
    coverList: '✅ Accidents de route\n✅ Pannes pendant la course\n✅ Dommages passager\n✅ Annulation soudaine',
    settings: 'Paramètres', chooseLang: 'Choisissez la langue', close: 'Fermer',
    passengerName: 'Passager', driverName: 'Chauffeur',
    tMap: 'Carte', myLocation: '📍 Ma position', locating: 'Localisation...',
    locationOff: 'Position introuvable — activez la localisation', routeMap: '🗺️ Itinéraire', driverOnMap: 'Chauffeur sur la carte',
  },
  en: {
    tagline: 'Where are you? We\'ll come! 🚖', who: 'Who are you?',
    passenger: 'Passenger', passengerSub: 'Order a ride now',
    driver: 'Driver', driverSub: 'Get rides and earn',
    back: '← Back', passengerLogin: '🧑 Passenger Login', driverLogin: '🚗 Driver Login',
    phone: 'Phone number', fillTestP: '💡 Tap to fill test number (passenger)', fillTestD: '💡 Tap to fill test number (driver)',
    sendCode: 'Send verification code', codeLabel: 'Verification code (6 digits)', fillCode: '💡 Tap to fill test code: 000000',
    login: 'Login ✅', enterPhone: 'Enter phone number', codeSent: 'Code sent', error: 'Error',
    connFail: 'Could not connect to server',
    hello: 'Hello', passengerApp: '🧑 Passenger App', driverApp: '🚗 Driver App',
    winBalance: '⭐ WinPoints Balance', points: 'points', readyTrip: '📍 Demo ride ready',
    from: 'From', to: 'To', orderNow: 'Order a ride now 🚖', activeRide: '🚖 Your active ride', status: 'Status',
    searching: '🔍 Searching for a driver...', accepted: '✅ Driver accepted — on the way',
    arrived: '📍 Driver has arrived!', ongoing: '🚗 Ride in progress', fare: 'Fare',
    waitingDriver: 'Waiting for a nearby driver...', driverFound: '🚗 Driver found!', rideEnded: '✅ Ride ended',
    thanks: 'Thanks for using WinRak!', requested: '✅ Ride requested!',
    chooseService: 'Choose service type', calcPrice: 'Calculate price 💰', estimate: 'Estimate',
    price: '💰 Price', distance: '📏 Distance', duration: '⏱️ Duration', km: 'km', min: 'min',
    confirmOrder: 'Confirm order 🚖', ridesHistory: 'Your rides history', noRides: 'No rides yet',
    completed: '✅ Completed', cancelled: '❌ Cancelled', logout: 'Logout',
    tHome: 'Home', tBook: 'Book', tRides: 'My rides', tProfile: 'Profile', tRequests: 'Requests', tContract: 'Contract',
    economic: 'Economic', comfort: 'Comfort', family: 'Family', forWomen: 'For women',
    yourStatus: 'Your status', onlineMsg: '🟢 Online — receiving requests', offlineMsg: '🔴 Offline',
    stopWork: 'Stop service', startWork: 'Start working', todayEarnings: '💰 Today\'s earnings', da: 'DA',
    totalTrips: 'total trips', contractShort: '🛡️ Partnership contract', contractType: 'Contract type',
    yourShare: 'Your share', winrakLosses: 'WinRak covers losses',
    offlineHint: '🔴 You are offline. Go to Home and tap "Start working" to receive requests.',
    currentRide: '🚖 Your current ride', share85: 'Your share (85%)', arrivedBtn: '📍 Arrived at passenger',
    startRideBtn: '🚗 Start ride', endRideBtn: '✅ End ride', incoming: '📲 Incoming requests',
    waitingReq: 'Waiting for passenger requests...', acceptBtn: 'Accept request ✅',
    acceptedRide: '✅ Ride accepted', goToPassenger: 'Head to the passenger', rideCompleted: '✅ Ride completed',
    earningsAdded: 'Your earnings added (85%)', done: 'Done', notifiedArrival: 'Passenger notified of arrival',
    rideStarted: 'Ride started', onlineAlert: '🟢 Online!', willReceive: 'You\'ll receive requests now',
    offlineAlert: '🔴 Offline', stoppedService: 'Service stopped',
    contractFull: '📄 Partnership contract with WinRak', active: '✅ Active', profitDist: '💰 Profit distribution',
    lossSharing: '🛡️ Loss sharing — exclusive feature', winrakBears: 'WinRak bears', maxLoss: 'Max monthly loss on you',
    coverList: '✅ Road accidents\n✅ Car breakdowns during ride\n✅ Passenger damages\n✅ Sudden cancellation',
    settings: 'Settings', chooseLang: 'Choose language', close: 'Close',
    passengerName: 'Passenger', driverName: 'Driver',
    tMap: 'Map', myLocation: '📍 My location', locating: 'Locating you...',
    locationOff: 'Could not locate you — enable location permission', routeMap: '🗺️ Trip route', driverOnMap: 'Driver on map',
  },
};

// ═══ سياق اللغة ═══════════════════════════════════════════════
const LangCtx = createContext<any>(null);
const useLang = () => useContext(LangCtx);

function LangProvider({ children }: { children: any }) {
  const [lang, setLang] = useState<'ar' | 'fr' | 'en'>('ar');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isRTL = lang === 'ar';
  const t = (k: string) => TR[lang][k] ?? k;
  const val = useMemo(() => ({ lang, setLang, isRTL, t, openSettings: () => setSettingsOpen(true) }), [lang]);

  const LANGS = [
    { code: 'ar', label: 'العربية', flag: '🇩🇿' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <LangCtx.Provider value={val}>
      {children}
      <Modal visible={settingsOpen} transparent animationType="fade" onRequestClose={() => setSettingsOpen(false)}>
        <View style={st.modalBg}>
          <View style={st.modalCard}>
            <Text style={st.modalTitle}>⚙️ {t('settings')}</Text>
            <Text style={st.modalSub}>{t('chooseLang')}</Text>
            {LANGS.map(l => (
              <TouchableOpacity key={l.code}
                style={[st.langRow, lang === l.code && st.langRowSel]}
                onPress={() => { setLang(l.code as any); setSettingsOpen(false); }}>
                <Text style={{ fontSize: 24 }}>{l.flag}</Text>
                <Text style={[st.langLbl, lang === l.code && { color: C.primary, fontWeight: '800' }]}>{l.label}</Text>
                {lang === l.code && <Text style={{ color: C.success, fontSize: 18 }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={st.modalClose} onPress={() => setSettingsOpen(false)}>
              <Text style={{ color: '#888', fontWeight: '700' }}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LangCtx.Provider>
  );
}

// زر الإعدادات ⚙️ أعلى اليسار (ثابت دائماً)
function Gear({ dark }: { dark?: boolean }) {
  const { openSettings } = useLang();
  return (
    <TouchableOpacity onPress={openSettings} style={st.gear} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
      <Text style={{ fontSize: 22 }}>⚙️</Text>
    </TouchableOpacity>
  );
}

async function apiFetch(method: string, path: string, body?: object, token?: string) {
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await res.json();
  } catch {
    return { success: false, message: 'connFail' };
  }
}

// ═════════════════════════════════════════════════════════════
export default function App() {
  return (
    <LangProvider>
      <Root />
    </LangProvider>
  );
}

function Root() {
  const [screen, setScreen] = useState<'role' | 'login' | 'passenger' | 'driver'>('role');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);

  const handleLogin = (t: string, u: any) => { setToken(t); setUser(u); setScreen(role); };

  if (screen === 'role') return <RoleScreen onSelect={(r) => { setRole(r); setScreen('login'); }} />;
  if (screen === 'login') return <LoginScreen role={role} onLogin={handleLogin} onBack={() => setScreen('role')} />;
  if (screen === 'passenger') return <PassengerApp token={token} user={user} onLogout={() => setScreen('role')} />;
  if (screen === 'driver') return <DriverApp token={token} user={user} onLogout={() => setScreen('role')} />;
  return null;
}

// ─── شاشة اختيار الدور ────────────────────────────────────────
function RoleScreen({ onSelect }: { onSelect: (r: 'passenger' | 'driver') => void }) {
  const { t } = useLang();
  return (
    <View style={st.roleBg}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <Gear dark />
      <View style={st.roleInner}>
        <View style={st.logoWrap}><Text style={st.logoW}>W</Text></View>
        <Text style={st.appNameTxt}>WinRak</Text>
        <Text style={st.taglineTxt}>{t('tagline')}</Text>
        <Text style={st.whoTxt}>{t('who')}</Text>

        <TouchableOpacity style={st.roleCard} onPress={() => onSelect('passenger')}>
          <Text style={st.roleEmoji}>🧑</Text>
          <View>
            <Text style={st.roleCardTitle}>{t('passenger')}</Text>
            <Text style={st.roleCardSub}>{t('passengerSub')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[st.roleCard, { backgroundColor: C.accent }]} onPress={() => onSelect('driver')}>
          <Text style={st.roleEmoji}>🚗</Text>
          <View>
            <Text style={[st.roleCardTitle, { color: C.primary }]}>{t('driver')}</Text>
            <Text style={[st.roleCardSub, { color: '#1A1A2Eaa' }]}>{t('driverSub')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── شاشة تسجيل الدخول ────────────────────────────────────────
function LoginScreen({ role, onLogin, onBack }: { role: string; onLogin: (t: string, u: any) => void; onBack: () => void; }) {
  const { t, isRTL } = useLang();
  const ta: any = isRTL ? 'right' : 'left';
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone) return Alert.alert('', t('enterPhone'));
    setLoading(true);
    const r = await apiFetch('POST', '/auth/send-otp', { phone });
    setLoading(false);
    if (r.success !== false) { setStep('otp'); Alert.alert('✅', t('codeSent')); }
    else Alert.alert(t('error'), t('connFail'));
  };
  const verify = async () => {
    setLoading(true);
    const r = await apiFetch('POST', '/auth/verify-otp', { phone, code });
    setLoading(false);
    if (r.success !== false) onLogin(r.accessToken, r.user);
    else Alert.alert(t('error'), r.message === 'connFail' ? t('connFail') : (r.message || t('error')));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <Gear />
      <ScrollView contentContainerStyle={st.loginWrap}>
        <TouchableOpacity onPress={onBack} style={st.backRow}>
          <Text style={[st.backTxt, { textAlign: ta }]}>{t('back')}</Text>
        </TouchableOpacity>
        <Text style={[st.loginTitle, { textAlign: ta }]}>{role === 'passenger' ? t('passengerLogin') : t('driverLogin')}</Text>

        {step === 'phone' ? (
          <>
            <Text style={[st.fieldLabel, { textAlign: ta }]}>{t('phone')}</Text>
            <TextInput style={[st.field, { textAlign: ta }]} value={phone} onChangeText={setPhone}
              placeholder="+213XXXXXXXXX" keyboardType="phone-pad" />
            <TouchableOpacity style={st.hintBox} onPress={() => setPhone(role === 'driver' ? '+213660000001' : '+213555000001')}>
              <Text style={[st.hintTxt, { textAlign: ta }]}>{role === 'driver' ? t('fillTestD') : t('fillTestP')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.btn} onPress={sendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} /> : <Text style={st.btnTxt}>{t('sendCode')}</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[st.fieldLabel, { textAlign: ta }]}>{t('codeLabel')}</Text>
            <TextInput style={[st.field, { textAlign: 'center', fontSize: 28, letterSpacing: 8, fontWeight: '700' }]}
              value={code} onChangeText={setCode} keyboardType="numeric" maxLength={6} />
            <TouchableOpacity style={st.hintBox} onPress={() => setCode('000000')}>
              <Text style={[st.hintTxt, { textAlign: ta }]}>{t('fillCode')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={st.btn} onPress={verify} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} /> : <Text style={st.btnTxt}>{t('login')}</Text>}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── تطبيق الراكب ─────────────────────────────────────────────
function PassengerApp({ token, user, onLogout }: { token: string; user: any; onLogout: () => void }) {
  const { t, isRTL } = useLang();
  const ta: any = isRTL ? 'right' : 'left';
  const fd: any = isRTL ? 'row-reverse' : 'row';
  const [tab, setTab] = useState<'home' | 'book' | 'rides' | 'profile'>('home');
  const [svc, setSvc] = useState('GO');
  const [estimate, setEstimate] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [driver, setDriver] = useState<any>(null);
  const [myLoc, setMyLoc] = useState<any>(null);
  const [locating, setLocating] = useState(true);

  const SERVICES = [
    { type: 'GO', icon: '🚗', name: 'WinRak GO', desc: t('economic') },
    { type: 'PLUS', icon: '🚙', name: 'WinRak PLUS', desc: t('comfort') },
    { type: 'XL', icon: '🚐', name: 'WinRak XL', desc: t('family') },
    { type: 'SHE', icon: '👩', name: 'WinRak SHE', desc: t('forWomen') },
  ];
  // نقطة الانطلاق = موقعك الحقيقي (GPS)، أو حيدرة افتراضياً
  const PICKUP = myLoc
    ? { lat: myLoc.lat, lng: myLoc.lng, address: t('myLocation') }
    : { lat: 36.749, lng: 3.052, address: 'حيدرة، الجزائر' };
  const DROPOFF = { lat: 36.770, lng: 2.990, address: 'باب الوادي، الجزائر' };

  // الحصول على الموقع الحقيقي عند فتح التطبيق
  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setMyLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {}
      setLocating(false);
    })();
  }, []);

  const getEstimate = async () => {
    setLoading(true);
    const r = await apiFetch('POST', '/rides/estimate', { pickupLat: PICKUP.lat, pickupLng: PICKUP.lng, dropoffLat: DROPOFF.lat, dropoffLng: DROPOFF.lng, vehicleType: svc }, token);
    setLoading(false);
    if (r.total) setEstimate(r);
  };
  const requestRide = async () => {
    setLoading(true);
    const r = await apiFetch('POST', '/rides/request', {
      pickupLat: PICKUP.lat, pickupLng: PICKUP.lng, pickupAddress: PICKUP.address,
      dropoffLat: DROPOFF.lat, dropoffLng: DROPOFF.lng, dropoffAddress: DROPOFF.address,
      serviceType: svc, paymentMethod: 'CASH',
    }, token);
    setLoading(false);
    if (r.ride) { setActiveRide(r.ride); setDriver(null); setTab('home'); Alert.alert(t('requested'), `${svc} — ${r.ride.totalFare} ${t('da')}\n${t('searching')}`); }
    else Alert.alert(t('error'), t('connFail'));
  };

  React.useEffect(() => {
    if (!activeRide || activeRide.status === 'COMPLETED') return;
    const iv = setInterval(async () => {
      const r = await apiFetch('GET', `/rides/${activeRide.id}`, undefined, token);
      if (r.ride) {
        setActiveRide((prev: any) => ({ ...prev, status: r.ride.status }));
        if (r.driver && !driver) { setDriver(r.driver); Alert.alert(t('driverFound'), `${r.driver.fullName}\n${r.driver.carModel} • ${r.driver.carPlate}\n⭐ ${r.driver.rating}`); }
        if (r.ride.status === 'COMPLETED') { Alert.alert(t('rideEnded'), t('thanks')); clearInterval(iv); }
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [activeRide?.id, driver]);

  const loadRides = async () => { const r = await apiFetch('GET', '/rides/my', undefined, token); if (r.rides) setRides(r.rides); };
  React.useEffect(() => { if (tab === 'rides') loadRides(); }, [tab]);

  const statusTxt = (st2: string) => st2 === 'SEARCHING' ? t('searching') : st2 === 'ACCEPTED' ? t('accepted') : st2 === 'ARRIVED' ? t('arrived') : st2 === 'ONGOING' ? t('ongoing') : st2;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      <View style={st.header}>
        <Gear />
        <Text style={[st.headerSub, { textAlign: ta }]}>{t('hello')} {user?.fullName?.split(' ')[0] || ''} 👋</Text>
        <Text style={[st.headerTitle, { textAlign: ta }]}>{t('passengerApp')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>
        {tab === 'home' && (
          <>
            <View style={st.card}>
              <Text style={[st.cardTitle, { textAlign: ta }]}>{t('winBalance')}</Text>
              <Text style={st.bigNum}>{user?.winPoints || 0} <Text style={{ fontSize: 16, color: '#888' }}>{t('points')}</Text></Text>
            </View>
            <View style={st.card}>
              <Text style={[st.cardTitle, { textAlign: ta }]}>{t('routeMap')}</Text>
              {locating ? (
                <View style={{ height: 220, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eef2f5', borderRadius: 16 }}>
                  <ActivityIndicator color={C.accent} /><Text style={{ color: '#888', marginTop: 8 }}>{t('locating')}</Text>
                </View>
              ) : (
                <RideMap pickup={PICKUP} dropoff={DROPOFF} driver={driver} height={220} />
              )}
              <Text style={[st.routeTxt, { textAlign: ta, marginTop: 10 }]}>🟢 {t('from')}: {PICKUP.address}</Text>
              <Text style={[st.routeTxt, { textAlign: ta }]}>🔴 {t('to')}: {DROPOFF.address}</Text>
              <TouchableOpacity style={[st.btn, { marginTop: 10 }]} onPress={() => setTab('book')}><Text style={st.btnTxt}>{t('orderNow')}</Text></TouchableOpacity>
            </View>
            {activeRide && activeRide.status !== 'COMPLETED' && (
              <View style={[st.card, { borderColor: C.accent, borderWidth: 2 }]}>
                <Text style={[st.cardTitle, { textAlign: ta }]}>{t('activeRide')}</Text>
                <Text style={[st.routeTxt, { textAlign: ta }]}>{t('status')}: <Text style={{ color: C.accent, fontWeight: '700' }}>{statusTxt(activeRide.status)}</Text></Text>
                <Text style={[st.routeTxt, { textAlign: ta }]}>{t('fare')}: {activeRide.totalFare} {t('da')}</Text>
                <View style={{ marginTop: 10 }}>
                  <RideMap pickup={PICKUP} dropoff={DROPOFF} driver={driver} height={200} />
                </View>
                {driver && (
                  <View style={{ marginTop: 12, backgroundColor: C.accent + '15', borderRadius: 12, padding: 12 }}>
                    <Text style={{ fontWeight: '800', color: C.primary, textAlign: ta, fontSize: 16 }}>🚗 {driver.fullName}</Text>
                    <Text style={{ color: '#666', textAlign: ta, marginTop: 4 }}>{driver.carModel} • {driver.carPlate}</Text>
                    <Text style={{ color: C.secondary, textAlign: ta, marginTop: 2, fontWeight: '700' }}>⭐ {driver.rating}</Text>
                  </View>
                )}
                {activeRide.status === 'SEARCHING' && (
                  <View style={{ marginTop: 10, flexDirection: fd, alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color={C.accent} /><Text style={{ color: '#888' }}>{t('waitingDriver')}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        {tab === 'book' && (
          <>
            <View style={st.card}>
              <Text style={[st.cardTitle, { textAlign: ta }]}>{t('chooseService')}</Text>
              {SERVICES.map(sv => (
                <TouchableOpacity key={sv.type} style={[st.svcRow, { flexDirection: fd }, svc === sv.type && st.svcRowSel]} onPress={() => { setSvc(sv.type); setEstimate(null); }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: C.secondary, minWidth: 60 }}>{estimate && svc === sv.type ? `${estimate.total} ${t('da')}` : ''}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ textAlign: ta, fontWeight: '700', color: C.primary }}>{sv.name}</Text>
                    <Text style={{ textAlign: ta, color: '#888', fontSize: 12 }}>{sv.desc}</Text>
                  </View>
                  <Text style={{ fontSize: 26 }}>{sv.icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[st.btn, { backgroundColor: '#eee' }]} onPress={getEstimate} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} /> : <Text style={[st.btnTxt, { color: C.primary }]}>{t('calcPrice')}</Text>}
            </TouchableOpacity>
            {estimate && (
              <View style={[st.card, { backgroundColor: '#FFFBF0' }]}>
                <Text style={[st.cardTitle, { textAlign: ta }]}>{t('estimate')}</Text>
                <Text style={[st.infoRow, { textAlign: ta }]}>{t('price')}: <Text style={st.infoVal}>{estimate.total} {t('da')}</Text></Text>
                <Text style={[st.infoRow, { textAlign: ta }]}>{t('distance')}: <Text style={st.infoVal}>{estimate.estimatedDistance?.toFixed(1)} {t('km')}</Text></Text>
                <Text style={[st.infoRow, { textAlign: ta }]}>{t('duration')}: <Text style={st.infoVal}>{estimate.estimatedDuration} {t('min')}</Text></Text>
              </View>
            )}
            <TouchableOpacity style={st.btn} onPress={requestRide} disabled={loading}>
              {loading ? <ActivityIndicator color={C.primary} /> : <Text style={st.btnTxt}>{t('confirmOrder')}</Text>}
            </TouchableOpacity>
          </>
        )}

        {tab === 'rides' && (
          <>
            <Text style={[st.secTitle, { textAlign: ta }]}>{t('ridesHistory')} ({rides.length})</Text>
            {rides.length === 0 && <Text style={st.emptyTxt}>{t('noRides')}</Text>}
            {rides.map((r: any) => (
              <View key={r.id} style={st.rideCard}>
                <View style={{ flexDirection: fd, justifyContent: 'space-between' }}>
                  <Text style={{ color: r.status === 'COMPLETED' ? C.success : C.error, fontWeight: '700', fontSize: 13 }}>{r.status === 'COMPLETED' ? t('completed') : r.status === 'CANCELLED' ? t('cancelled') : '🔄 ' + r.status}</Text>
                  <Text style={{ color: C.secondary, fontWeight: '800', fontSize: 15 }}>{r.totalFare} {t('da')}</Text>
                </View>
                <Text style={[st.routeTxt, { textAlign: ta }]}>{r.pickupAddress} ← {r.dropoffAddress}</Text>
                <Text style={{ color: '#aaa', fontSize: 11, textAlign: ta }}>{new Date(r.requestedAt).toLocaleDateString()} | {r.serviceType}</Text>
              </View>
            ))}
          </>
        )}

        {tab === 'profile' && (
          <>
            <View style={[st.card, { alignItems: 'center' }]}>
              <Text style={{ fontSize: 60, marginBottom: 10 }}>🧑</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>{user?.fullName || t('passengerName')}</Text>
              <Text style={{ color: '#888', marginBottom: 14 }}>{user?.phone}</Text>
              <View style={{ backgroundColor: C.secondary + '22', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 }}>
                <Text style={{ color: C.primary, fontWeight: '700' }}>⭐ {user?.winPoints || 0} WinPoints</Text>
              </View>
            </View>
            <TouchableOpacity style={[st.btn, { backgroundColor: C.error }]} onPress={onLogout}><Text style={[st.btnTxt, { color: '#fff' }]}>{t('logout')}</Text></TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={[st.tabBar, { flexDirection: fd }]}>
        {[{ id: 'home', icon: '🏠', label: t('tHome') }, { id: 'book', icon: '🚖', label: t('tBook') }, { id: 'rides', icon: '📋', label: t('tRides') }, { id: 'profile', icon: '👤', label: t('tProfile') }].map(tb => (
          <TouchableOpacity key={tb.id} style={st.tabItem} onPress={() => setTab(tb.id as any)}>
            <Text style={{ fontSize: 22 }}>{tb.icon}</Text>
            <Text style={[st.tabLbl, tab === tb.id && { color: C.primary, fontWeight: '700' }]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── تطبيق السائق ─────────────────────────────────────────────
function DriverApp({ token, user, onLogout }: { token: string; user: any; onLogout: () => void }) {
  const { t, isRTL } = useLang();
  const ta: any = isRTL ? 'right' : 'left';
  const fd: any = isRTL ? 'row-reverse' : 'row';
  const [tab, setTab] = useState<'home' | 'requests' | 'contract' | 'profile'>('home');
  const [isOnline, setIsOnline] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [myRide, setMyRide] = useState<any>(null);

  const loadEarnings = () => apiFetch('GET', '/drivers/me/earnings?period=today', undefined, token).then(r => { if (r.success !== false) setEarnings(r); });
  React.useEffect(() => { loadEarnings(); apiFetch('GET', '/contracts/my', undefined, token).then(r => { if (r.contract) setContract(r.contract); }); }, []);

  React.useEffect(() => {
    if (!isOnline || myRide) return;
    const iv = setInterval(async () => { const r = await apiFetch('GET', '/rides/available', undefined, token); if (r.rides) setRequests(r.rides); }, 3000);
    return () => clearInterval(iv);
  }, [isOnline, myRide]);

  const acceptRide = async (ride: any) => { const r = await apiFetch('POST', `/rides/${ride.id}/accept`, {}, token); if (r.success) { setMyRide(r.ride); setTab('requests'); Alert.alert(t('acceptedRide'), t('goToPassenger')); } };
  const updateRide = async (status: string) => {
    await apiFetch('POST', `/rides/${myRide.id}/status`, { status }, token);
    if (status === 'COMPLETED') { setMyRide(null); loadEarnings(); Alert.alert(t('rideCompleted'), t('earningsAdded')); }
    else { setMyRide({ ...myRide, status }); Alert.alert(t('done'), status === 'ARRIVED' ? t('notifiedArrival') : t('rideStarted')); }
  };
  const toggleOnline = async () => {
    setLoading(true);
    const r = await apiFetch('PATCH', '/drivers/status', { isOnline: !isOnline }, token);
    setLoading(false);
    if (r.success !== false) { setIsOnline(r.isOnline); Alert.alert(r.isOnline ? t('onlineAlert') : t('offlineAlert'), r.isOnline ? t('willReceive') : t('stoppedService')); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={[st.header, { backgroundColor: C.primary }]}>
        <Gear dark />
        <Text style={[st.headerSub, { color: '#ffffff88', textAlign: ta }]}>{t('hello')} {user?.fullName?.split(' ')[0] || t('driverName')} 👋</Text>
        <Text style={[st.headerTitle, { color: '#fff', textAlign: ta }]}>{t('driverApp')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 90 }}>
        {tab === 'home' && (
          <>
            <View style={[st.card, { borderColor: isOnline ? C.success : '#eee', borderWidth: 2 }]}>
              <Text style={[st.cardTitle, { textAlign: ta }]}>{t('yourStatus')}</Text>
              <Text style={{ textAlign: 'center', fontSize: 16, color: isOnline ? C.success : '#aaa', fontWeight: '700', marginBottom: 14 }}>{isOnline ? t('onlineMsg') : t('offlineMsg')}</Text>
              <TouchableOpacity style={[st.btn, { backgroundColor: isOnline ? C.error : C.success }]} onPress={toggleOnline} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={[st.btnTxt, { color: '#fff' }]}>{isOnline ? t('stopWork') : t('startWork')}</Text>}
              </TouchableOpacity>
            </View>
            <View style={st.card}>
              <Text style={[st.cardTitle, { textAlign: ta }]}>{t('todayEarnings')}</Text>
              <Text style={st.bigNum}>{Math.round(earnings?.total || 0)} <Text style={{ fontSize: 16, color: '#888' }}>{t('da')}</Text></Text>
              <Text style={{ textAlign: 'center', color: '#888', fontSize: 13 }}>{earnings?.driver?.totalTrips || 0} {t('totalTrips')}</Text>
            </View>
            {contract && (
              <View style={[st.card, { borderColor: C.accent, borderWidth: 1.5 }]}>
                <Text style={[st.cardTitle, { color: C.accent, textAlign: ta }]}>{t('contractShort')}</Text>
                <Text style={[st.infoRow, { textAlign: ta }]}>{t('contractType')}: <Text style={st.infoVal}>{contract.contractType}</Text></Text>
                <Text style={[st.infoRow, { textAlign: ta }]}>{t('yourShare')}: <Text style={[st.infoVal, { color: C.success }]}>{contract.profitDriverPercent}%</Text></Text>
                <Text style={[st.infoRow, { textAlign: ta }]}>{t('winrakLosses')}: <Text style={[st.infoVal, { color: C.accent }]}>{contract.lossWinrakPercent}%</Text></Text>
              </View>
            )}
          </>
        )}

        {tab === 'requests' && (
          <>
            {!isOnline && <View style={st.card}><Text style={{ textAlign: 'center', color: '#888', padding: 10 }}>{t('offlineHint')}</Text></View>}
            {myRide ? (
              <View style={[st.card, { borderColor: C.success, borderWidth: 2 }]}>
                <Text style={[st.cardTitle, { color: C.success, textAlign: ta }]}>{t('currentRide')}</Text>
                <Text style={[st.infoRow, { textAlign: ta }]}>{t('fare')}: <Text style={st.infoVal}>{myRide.totalFare} {t('da')}</Text></Text>
                <Text style={[st.routeTxt, { textAlign: ta }]}>🟢 {myRide.pickupAddress}</Text>
                <Text style={[st.routeTxt, { textAlign: ta }]}>🔴 {myRide.dropoffAddress}</Text>
                <Text style={[st.infoRow, { textAlign: ta }]}>{t('share85')}: <Text style={[st.infoVal, { color: C.success }]}>{Math.round(myRide.totalFare * 0.85)} {t('da')}</Text></Text>
                {myRide.status === 'ACCEPTED' && <TouchableOpacity style={[st.btn, { marginTop: 12, backgroundColor: C.secondary }]} onPress={() => updateRide('ARRIVED')}><Text style={st.btnTxt}>{t('arrivedBtn')}</Text></TouchableOpacity>}
                {myRide.status === 'ARRIVED' && <TouchableOpacity style={[st.btn, { marginTop: 12, backgroundColor: C.accent }]} onPress={() => updateRide('ONGOING')}><Text style={[st.btnTxt, { color: '#fff' }]}>{t('startRideBtn')}</Text></TouchableOpacity>}
                {myRide.status === 'ONGOING' && <TouchableOpacity style={[st.btn, { marginTop: 12, backgroundColor: C.success }]} onPress={() => updateRide('COMPLETED')}><Text style={[st.btnTxt, { color: '#fff' }]}>{t('endRideBtn')}</Text></TouchableOpacity>}
              </View>
            ) : (
              <>
                <Text style={[st.secTitle, { textAlign: ta }]}>{t('incoming')} ({requests.length})</Text>
                {isOnline && requests.length === 0 && <View style={{ alignItems: 'center', padding: 20 }}><ActivityIndicator color={C.accent} /><Text style={{ color: '#888', marginTop: 10 }}>{t('waitingReq')}</Text></View>}
                {requests.map((rq: any) => (
                  <View key={rq.id} style={st.rideCard}>
                    <View style={{ flexDirection: fd, justifyContent: 'space-between' }}>
                      <Text style={{ color: C.secondary, fontWeight: '800', fontSize: 18 }}>{rq.totalFare} {t('da')}</Text>
                      <Text style={{ color: '#888', fontSize: 12 }}>{rq.serviceType} • {rq.distance} {t('km')}</Text>
                    </View>
                    <Text style={[st.routeTxt, { textAlign: ta }]}>🟢 {rq.pickupAddress}</Text>
                    <Text style={[st.routeTxt, { textAlign: ta }]}>🔴 {rq.dropoffAddress}</Text>
                    <TouchableOpacity style={[st.btn, { marginTop: 10, backgroundColor: C.success }]} onPress={() => acceptRide(rq)}><Text style={[st.btnTxt, { color: '#fff' }]}>{t('acceptBtn')}</Text></TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </>
        )}

        {tab === 'contract' && contract && (
          <>
            <View style={[st.card, { backgroundColor: C.primary }]}>
              <Text style={[st.cardTitle, { color: '#fff', fontSize: 18, textAlign: ta }]}>{t('contractFull')}</Text>
              <View style={{ backgroundColor: C.success + '33', borderRadius: 16, padding: 8, alignSelf: 'center', marginTop: 6 }}><Text style={{ color: C.success, fontWeight: '700' }}>{t('active')}</Text></View>
            </View>
            <View style={st.card}>
              <Text style={[st.cardTitle, { textAlign: ta }]}>{t('profitDist')}</Text>
              <View style={{ flexDirection: fd, justifyContent: 'space-around', marginTop: 8 }}>
                <View style={{ alignItems: 'center', backgroundColor: C.success + '22', borderRadius: 14, padding: 16, minWidth: 110 }}><Text style={{ fontSize: 36, fontWeight: '900', color: C.success }}>{contract.profitDriverPercent}%</Text><Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{t('yourShare')}</Text></View>
                <Text style={{ alignSelf: 'center', color: '#ccc', fontWeight: '700' }}>vs</Text>
                <View style={{ alignItems: 'center', backgroundColor: C.secondary + '22', borderRadius: 14, padding: 16, minWidth: 110 }}><Text style={{ fontSize: 36, fontWeight: '900', color: C.secondary }}>{contract.profitWinrakPercent}%</Text><Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>WinRak</Text></View>
              </View>
            </View>
            <View style={[st.card, { borderColor: C.accent, borderWidth: 2 }]}>
              <Text style={[st.cardTitle, { color: C.accent, textAlign: ta }]}>{t('lossSharing')}</Text>
              <Text style={[st.infoRow, { textAlign: ta }]}>{t('winrakBears')}: <Text style={[st.infoVal, { color: C.accent, fontSize: 20 }]}>{contract.lossWinrakPercent}%</Text></Text>
              <Text style={[st.infoRow, { textAlign: ta }]}>{t('maxLoss')}: <Text style={[st.infoVal, { color: C.error }]}>{contract.monthlyLossCap?.toLocaleString()} {t('da')}</Text></Text>
              <Text style={{ textAlign: ta, color: '#666', fontSize: 13, marginTop: 10, lineHeight: 22 }}>{t('coverList')}</Text>
            </View>
          </>
        )}

        {tab === 'profile' && (
          <>
            <View style={[st.card, { alignItems: 'center' }]}>
              <Text style={{ fontSize: 60, marginBottom: 10 }}>🚗</Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: C.primary }}>{user?.fullName || t('driverName')}</Text>
              <Text style={{ color: '#888', marginBottom: 14 }}>{user?.phone}</Text>
            </View>
            <TouchableOpacity style={[st.btn, { backgroundColor: C.error }]} onPress={onLogout}><Text style={[st.btnTxt, { color: '#fff' }]}>{t('logout')}</Text></TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={[st.tabBar, { flexDirection: fd }]}>
        {[{ id: 'home', icon: '🏠', label: t('tHome') }, { id: 'requests', icon: '📲', label: t('tRequests') }, { id: 'contract', icon: '📄', label: t('tContract') }, { id: 'profile', icon: '👤', label: t('tProfile') }].map(tb => (
          <TouchableOpacity key={tb.id} style={st.tabItem} onPress={() => setTab(tb.id as any)}>
            <Text style={{ fontSize: 22 }}>{tb.icon}</Text>
            <Text style={[st.tabLbl, tab === tb.id && { color: C.primary, fontWeight: '700' }]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const st = StyleSheet.create({
  gear: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 16, left: 16, zIndex: 100, width: 40, height: 40, borderRadius: 20, backgroundColor: '#ffffff22', justifyContent: 'center', alignItems: 'center' },
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
  loginWrap: { padding: 28, paddingTop: Platform.OS === 'ios' ? 100 : 70 },
  backRow: { marginBottom: 32 },
  backTxt: { color: C.primary, fontSize: 16 },
  loginTitle: { fontSize: 26, fontWeight: '800', color: C.primary, marginBottom: 28 },
  fieldLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  field: { borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 14, padding: 14, fontSize: 16, color: C.primary, backgroundColor: '#f9f9f9', marginBottom: 8 },
  hintBox: { backgroundColor: '#FFF8E7', borderRadius: 10, padding: 12, marginBottom: 20 },
  hintTxt: { fontSize: 13, color: '#888' },
  header: { paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 8 : 14, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: C.primary },
  headerSub: { fontSize: 13, color: '#888' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.primary, marginBottom: 12 },
  bigNum: { fontSize: 44, fontWeight: '900', color: C.primary, textAlign: 'center', marginBottom: 4 },
  routeTxt: { fontSize: 14, color: '#555', marginBottom: 6 },
  btn: { backgroundColor: C.secondary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  btnTxt: { color: C.primary, fontWeight: '800', fontSize: 16 },
  svcRow: { alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 2, borderColor: '#eee', marginBottom: 8, gap: 10 },
  svcRowSel: { borderColor: C.secondary, backgroundColor: '#FFFBF0' },
  infoRow: { fontSize: 14, color: '#555', marginBottom: 8 },
  infoVal: { fontWeight: '700', color: C.primary },
  secTitle: { fontSize: 16, fontWeight: '700', color: C.primary, marginBottom: 12 },
  emptyTxt: { textAlign: 'center', color: '#aaa', marginTop: 40, fontSize: 15 },
  rideCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  tabBar: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 24 : 10 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabLbl: { fontSize: 10, color: '#bbb', marginTop: 2 },
  modalBg: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalCard: { backgroundColor: '#fff', borderRadius: 22, padding: 24, width: '100%', maxWidth: 360 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: C.primary, textAlign: 'center', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 20 },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 2, borderColor: '#eee', marginBottom: 10 },
  langRowSel: { borderColor: C.secondary, backgroundColor: '#FFFBF0' },
  langLbl: { flex: 1, fontSize: 17, color: '#555', fontWeight: '600' },
  modalClose: { padding: 14, alignItems: 'center', marginTop: 6 },
});
