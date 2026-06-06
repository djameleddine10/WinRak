import React, { useState, createContext, useContext, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar, SafeAreaView,
  Platform, Modal, Animated, Easing, Dimensions, Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import RideMap from './Map';

// لون الثيم الأصفر (من تصميم Figma)
const YELLOW = '#FFD400';

// تنسيق المدة بالدقائق → "00h 25m"
const fmtDur = (min: number) => {
  const m = Math.max(0, Math.round(min || 0));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}h ${String(m % 60).padStart(2, '0')}m`;
};

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
    loginBtn: 'تسجيل الدخول', continueGoogle: 'المتابعة عبر Google', orSep: 'أو',
    newUser: 'مستخدم جديد؟', createAccountLink: 'أنشئ حساباً', createAccount: 'إنشاء حساب جديد',
    fullName: 'الاسم الكامل', createBtn: 'إنشاء حساب', haveAccount: 'لديك حساب؟', loginLink: 'سجّل الدخول',
    verification: 'التحقق', enterCodeSent: 'أدخل الرمز المرسل إلى هاتفك', requestNewOtp: 'إرسال رمز جديد',
    confirm: 'تأكيد', googleSoon: 'تسجيل Gmail سيُفعّل قريباً — استعمل الهاتف الآن', testHint: '💡 رمز التجربة: 000000',
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
    statTrips: 'رحلة', statHours: 'ساعة عمل', statEarned: 'الأرباح', tripsToday: 'رحلات اليوم',
    pToday: 'اليوم', pWeek: 'الأسبوع', pMonth: 'الشهر', pAll: 'الكل',
    mHome: 'الرئيسية', mRides: 'الرحلات', mAccount: 'الحساب', mSignOut: 'تسجيل الخروج',
    payCard: 'بطاقة', payCash: 'نقداً', noTrips: 'لا توجد رحلات بعد', goOnlineCard: 'ابدأ العمل لاستقبال الطلبات',
    offlineStatus: 'أنت غير متصل حالياً', backOnline: 'عُدت للاتصال', scanning: 'جاري البحث...',
    acceptance: 'القبول', ratingLbl: 'التقييم', cancellation: 'الإلغاء', hailRide: 'طلب راكب',
    reject: 'رفض', accept: 'قبول', rideRequestLbl: 'طلب رحلة', cancelTrip: 'إلغاء',
    arrivedPickup: 'وصلت لنقطة الانطلاق', startTripBtn: 'بدء الرحلة', pauseTrip: 'إيقاف مؤقت', resumeTrip: 'استئناف',
    arrivedDrop: 'وصلت لنقطة النزول', dropPoint: 'نقطة نزول', tripFinished: 'انتهت الرحلة', goOnlineNow: 'ابدأ العمل', goOfflineNow: 'إيقاف',
    stopOverPoints: 'نقاط التوقّف المحدّدة',
    walletBalance: 'رصيد المحفظة', dedicated: 'موثّق', profileSettings: 'إعدادات الملف', passwordLbl: 'كلمة المرور',
    vehicleDetails: 'تفاصيل المركبة', customerSupport: 'دعم العملاء', accountDetails: 'تفاصيل الحساب',
    firstName: 'الاسم', lastName: 'اللقب', email: 'البريد الإلكتروني', city: 'المدينة', save: 'حفظ', saved: 'تم الحفظ',
    vehicleBrand: 'ماركة المركبة', vehicleModel: 'الموديل', yearLbl: 'السنة', plateNumber: 'رقم اللوحة',
    currentPassword: 'كلمة المرور الحالية', newPassword: 'كلمة المرور الجديدة', supportText: 'للمساعدة تواصل معنا:',
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
    loginBtn: 'Se connecter', continueGoogle: 'Continuer avec Google', orSep: 'ou',
    newUser: 'Nouveau ?', createAccountLink: 'Créer un compte', createAccount: 'Créer un compte',
    fullName: 'Nom complet', createBtn: 'Créer le compte', haveAccount: 'Déjà un compte ?', loginLink: 'Connexion',
    verification: 'Vérification', enterCodeSent: 'Entrez le code envoyé à votre téléphone', requestNewOtp: 'Renvoyer le code',
    confirm: 'Confirmer', googleSoon: 'Connexion Gmail bientôt — utilisez le téléphone', testHint: '💡 Code test : 000000',
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
    statTrips: 'Courses', statHours: 'h en ligne', statEarned: 'Gagné', tripsToday: 'Courses du jour',
    pToday: 'Jour', pWeek: 'Semaine', pMonth: 'Mois', pAll: 'Tout',
    mHome: 'Accueil', mRides: 'Courses', mAccount: 'Compte', mSignOut: 'Déconnexion',
    payCard: 'Carte', payCash: 'Espèces', noTrips: 'Aucune course', goOnlineCard: 'Passez en ligne pour recevoir des demandes',
    offlineStatus: 'Vous êtes hors ligne', backOnline: 'Vous êtes de nouveau en ligne', scanning: 'Recherche...',
    acceptance: 'Acceptation', ratingLbl: 'Note', cancellation: 'Annulation', hailRide: 'Héler',
    reject: 'Refuser', accept: 'Accepter', rideRequestLbl: 'Demande', cancelTrip: 'Annuler',
    arrivedPickup: 'Arrivé au départ', startTripBtn: 'Démarrer', pauseTrip: 'Pause', resumeTrip: 'Reprendre',
    arrivedDrop: 'Arrivé à destination', dropPoint: 'Point', tripFinished: 'Course terminée', goOnlineNow: 'Commencer', goOfflineNow: 'Arrêter',
    stopOverPoints: 'Points d\'arrêt désignés',
    walletBalance: 'Solde du portefeuille', dedicated: 'Vérifié', profileSettings: 'Paramètres du profil', passwordLbl: 'Mot de passe',
    vehicleDetails: 'Détails du véhicule', customerSupport: 'Support client', accountDetails: 'Détails du compte',
    firstName: 'Prénom', lastName: 'Nom', email: 'E-mail', city: 'Ville', save: 'Enregistrer', saved: 'Enregistré',
    vehicleBrand: 'Marque', vehicleModel: 'Modèle', yearLbl: 'Année', plateNumber: 'Plaque',
    currentPassword: 'Mot de passe actuel', newPassword: 'Nouveau mot de passe', supportText: 'Besoin d\'aide ? Contactez-nous :',
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
    loginBtn: 'Login', continueGoogle: 'Continue with Google', orSep: 'or',
    newUser: 'New user?', createAccountLink: 'Create account', createAccount: 'Create New Account',
    fullName: 'Full name', createBtn: 'Create Account', haveAccount: 'Already have an account?', loginLink: 'Login',
    verification: 'Verification', enterCodeSent: 'Enter the code sent to your phone', requestNewOtp: 'Request new OTP',
    confirm: 'Confirm', googleSoon: 'Gmail login coming soon — use phone for now', testHint: '💡 Test code: 000000',
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
    statTrips: 'Trips', statHours: 'hrs Online', statEarned: 'Earned', tripsToday: 'Trips today',
    pToday: 'Today', pWeek: 'Week', pMonth: 'Month', pAll: 'All time',
    mHome: 'Home', mRides: 'Rides', mAccount: 'Account', mSignOut: 'Sign Out',
    payCard: 'Card', payCash: 'Cash', noTrips: 'No trips yet', goOnlineCard: 'Go online to receive requests',
    offlineStatus: 'You are currently offline', backOnline: 'You are back online', scanning: 'Scanning...',
    acceptance: 'Acceptance', ratingLbl: 'Rating', cancellation: 'Cancellation', hailRide: 'Hail ride',
    reject: 'Reject', accept: 'Accept', rideRequestLbl: 'Ride request', cancelTrip: 'Cancel',
    arrivedPickup: 'Arrived pickup location', startTripBtn: 'Start trip', pauseTrip: 'Pause trip', resumeTrip: 'Resume trip',
    arrivedDrop: 'Arrived drop point', dropPoint: 'Drop point', tripFinished: 'Trip Finished', goOnlineNow: 'Go online', goOfflineNow: 'Go offline',
    stopOverPoints: 'Designated stop over points',
    walletBalance: 'Wallet Balance', dedicated: 'Dedicated', profileSettings: 'Profile settings', passwordLbl: 'Password',
    vehicleDetails: 'Vehicle details', customerSupport: 'Customer support', accountDetails: 'Account details',
    firstName: 'First name', lastName: 'Last name', email: 'Email', city: 'City', save: 'Save', saved: 'Saved',
    vehicleBrand: 'Vehicle brand', vehicleModel: 'Model', yearLbl: 'Year', plateNumber: 'Plate number',
    currentPassword: 'Current password', newPassword: 'New password', supportText: 'Need help? Contact us:',
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
  const [screen, setScreen] = useState<'splash' | 'role' | 'login' | 'passenger' | 'driver'>('splash');
  const [role, setRole] = useState<'passenger' | 'driver'>('passenger');
  const [token, setToken] = useState('');
  const [user, setUser] = useState<any>(null);

  const handleLogin = (t: string, u: any) => { setToken(t); setUser(u); setScreen(role); };

  if (screen === 'splash') return <SplashScreen onDone={() => setScreen('role')} />;
  if (screen === 'role') return <RoleScreen onSelect={(r) => { setRole(r); setScreen('login'); }} />;
  if (screen === 'login') return <LoginScreen role={role} onLogin={handleLogin} onBack={() => setScreen('role')} />;
  if (screen === 'passenger') return <PassengerApp token={token} user={user} onLogout={() => setScreen('role')} />;
  if (screen === 'driver') return <DriverApp token={token} user={user} onLogout={() => setScreen('role')} />;
  return null;
}

// ─── شاشة البداية المتحرّكة (Splash) ──────────────────────────
function SplashScreen({ onDone }: { onDone: () => void }) {
  const scale = useRef(new Animated.Value(0.3)).current;
  const appear = useRef(new Animated.Value(0)).current;
  const blackPulse = useRef(new Animated.Value(0)).current;
  const whitePulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
        Animated.timing(appear, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.timing(blackPulse, { toValue: 1, duration: 750, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(whitePulse, { toValue: 1, duration: 750, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.delay(250),
      Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);

  const pulseStyle = (v: Animated.Value, color: string, size: number) => ({
    position: 'absolute' as const,
    width: size, height: size, borderRadius: size / 2,
    borderWidth: 3, borderColor: color,
    opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 2.3] }) }],
  });

  return (
    <Animated.View style={{ flex: 1, backgroundColor: YELLOW, justifyContent: 'center', alignItems: 'center', opacity: fade }}>
      <StatusBar barStyle="dark-content" backgroundColor={YELLOW} />
      <Animated.View style={pulseStyle(blackPulse, '#111', 130)} />
      <Animated.View style={pulseStyle(whitePulse, '#fff', 130)} />
      <Animated.View style={{ transform: [{ scale }], opacity: appear, width: 124, height: 124, borderRadius: 62, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, elevation: 10 }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff' }} />
      </Animated.View>
      <Animated.Text style={{ position: 'absolute', bottom: 90, fontSize: 30, fontWeight: '900', color: '#111', opacity: appear, letterSpacing: 1 }}>WinRak</Animated.Text>
    </Animated.View>
  );
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

// زر Google (الوحيد المتبقي بعد حذف Facebook و LinkedIn)
function GoogleBtn() {
  const { t } = useLang();
  return (
    <TouchableOpacity style={au.googleBtn} onPress={() => Alert.alert('Google', t('googleSoon'))}>
      <View style={au.googleG}><Text style={{ fontWeight: '900', color: '#4285F4', fontSize: 16 }}>G</Text></View>
      <Text style={au.googleTxt}>{t('continueGoogle')}</Text>
    </TouchableOpacity>
  );
}

// ─── شاشة تسجيل الدخول / إنشاء حساب / التحقق ───────────────────
function LoginScreen({ role, onLogin, onBack }: { role: string; onLogin: (t: string, u: any) => void; onBack: () => void; }) {
  const { t } = useLang();
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('login');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const proceed = async () => {
    if (phone.replace(/\D/g, '').length < 6) return Alert.alert('', t('enterPhone'));
    setLoading(true);
    await apiFetch('POST', '/auth/send-otp', { phone });
    setLoading(false);
    setMode('verify');
  };

  if (mode === 'verify')
    return <Verification phone={phone} fullName={fullName} onLogin={onLogin} onBack={() => setMode('login')} />;

  const isSignup = mode === 'signup';
  return (
    <View style={au.bg}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <Gear dark />
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={au.wrap} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={onBack} style={{ marginBottom: 18 }}><Text style={au.back}>←</Text></TouchableOpacity>
          <Text style={au.title}>
            {isSignup ? t('createAccount') : (role === 'passenger' ? t('passengerLogin') : t('driverLogin'))}
          </Text>

          {isSignup && (
            <TextInput style={au.input} value={fullName} onChangeText={setFullName}
              placeholder={t('fullName')} placeholderTextColor="#999" />
          )}
          <TextInput style={au.input} value={phone} onChangeText={setPhone}
            placeholder={t('phone')} placeholderTextColor="#999" keyboardType="phone-pad" />

          <TouchableOpacity onPress={() => setPhone(role === 'driver' ? '+213660000001' : '+213555000001')}>
            <Text style={au.testHint}>{role === 'driver' ? t('fillTestD') : t('fillTestP')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={au.yellowBtn} onPress={proceed} disabled={loading}>
            {loading ? <ActivityIndicator color="#111" /> : <Text style={au.yellowBtnTxt}>{isSignup ? t('createBtn') : t('loginBtn')}</Text>}
          </TouchableOpacity>

          <View style={au.orRow}><View style={au.line} /><Text style={au.orTxt}>{t('orSep')}</Text><View style={au.line} /></View>
          <GoogleBtn />

          <TouchableOpacity style={{ marginTop: 26 }} onPress={() => setMode(isSignup ? 'login' : 'signup')}>
            <Text style={au.switchTxt}>
              {isSignup ? t('haveAccount') + ' ' : t('newUser') + ' '}
              <Text style={{ color: YELLOW, fontWeight: '800' }}>{isSignup ? t('loginLink') : t('createAccountLink')}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── شاشة التحقق (OTP) ────────────────────────────────────────
function Verification({ phone, fullName, onLogin, onBack }: { phone: string; fullName: string; onLogin: (t: string, u: any) => void; onBack: () => void; }) {
  const { t } = useLang();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [secs, setSecs] = useState(120);
  const [loading, setLoading] = useState(false);
  const refs = useRef<any[]>([]);

  useEffect(() => {
    if (secs <= 0) return;
    const id = setTimeout(() => setSecs(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secs]);

  const setDigit = (i: number, v: string) => {
    const c = v.replace(/\D/g, '').slice(-1);
    const next = [...digits]; next[i] = c; setDigits(next);
    if (c && i < 5) refs.current[i + 1]?.focus();
  };
  const onKey = (i: number, key: string) => { if (key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus(); };

  const confirm = async (codeArg?: string) => {
    const code = codeArg ?? digits.join('');
    if (code.length < 6) return;
    setLoading(true);
    const r = await apiFetch('POST', '/auth/verify-otp', { phone, code, fullName });
    setLoading(false);
    if (r.success !== false) onLogin(r.accessToken, r.user);
    else Alert.alert(t('error'), r.message === 'connFail' ? t('connFail') : (r.message || t('error')));
  };
  const resend = async () => { setSecs(120); setDigits(['', '', '', '', '', '']); await apiFetch('POST', '/auth/send-otp', { phone }); };
  const mmss = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 28, paddingTop: Platform.OS === 'ios' ? 10 : 40 }}>
          <TouchableOpacity onPress={onBack}><Text style={au.back}>←</Text></TouchableOpacity>
          <Text style={[au.title, { marginTop: 14 }]}>{t('verification')}</Text>
        </View>

        <View style={au.yellowSheet}>
          <View style={au.timerPill}><Text style={{ fontWeight: '800', color: '#111' }}>⏱ {mmss}</Text></View>
          <Text style={{ color: '#111', textAlign: 'center', marginBottom: 18, fontSize: 13 }}>{t('enterCodeSent')}</Text>

          <View style={au.otpRow}>
            {digits.map((d, i) => (
              <TextInput key={i} ref={(el) => { refs.current[i] = el; }}
                style={au.otpBox} value={d} keyboardType="numeric" maxLength={1}
                onChangeText={(v) => setDigit(i, v)}
                onKeyPress={(e) => onKey(i, e.nativeEvent.key)} />
            ))}
          </View>

          <TouchableOpacity onPress={resend}><Text style={au.resend}>{t('requestNewOtp')}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => { const z = ['0','0','0','0','0','0']; setDigits(z); confirm('000000'); }}>
            <Text style={{ color: '#111', textAlign: 'center', marginVertical: 8, fontSize: 12 }}>{t('testHint')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={au.confirmBtn} onPress={() => confirm()} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={au.confirmTxt}>{t('confirm')}</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── تطبيق الراكب ─────────────────────────────────────────────
function PassengerApp({ token, user, onLogout }: { token: string; user: any; onLogout: () => void }) {
  const { t, openSettings } = useLang();
  const [view, setView] = useState<'home' | 'rides' | 'account'>('home');
  const [drawer, setDrawer] = useState(false);
  const [svc, setSvc] = useState('GO');
  const [estimate, setEstimate] = useState<any>(null);
  const [activeRide, setActiveRide] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [driver, setDriver] = useState<any>(null);
  const [myLoc, setMyLoc] = useState<any>(null);
  const [destPicker, setDestPicker] = useState(false);

  const SCRH = Dimensions.get('window').height;
  const SERVICES = [
    { type: 'GO', icon: '🚗', name: 'GO', desc: t('economic') },
    { type: 'PLUS', icon: '🚙', name: 'PLUS', desc: t('comfort') },
    { type: 'XL', icon: '🚐', name: 'XL', desc: t('family') },
    { type: 'SHE', icon: '👩', name: 'SHE', desc: t('forWomen') },
  ];
  const DESTS = [
    { address: 'باب الوادي، الجزائر', lat: 36.7906, lng: 3.0506 },
    { address: 'حيدرة، الجزائر', lat: 36.7490, lng: 3.0520 },
    { address: 'الأبيار، الجزائر', lat: 36.7680, lng: 3.0360 },
    { address: 'بئر مراد رايس', lat: 36.7380, lng: 3.0490 },
    { address: 'المطار الدولي', lat: 36.6910, lng: 3.2150 },
  ];
  const [dropoff, setDropoff] = useState(DESTS[0]);
  const PICKUP = myLoc ? { lat: myLoc.lat, lng: myLoc.lng, address: t('myLocation') } : { lat: 36.7525, lng: 3.042, address: t('myLocation') };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setMyLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      } catch {}
    })();
  }, []);

  // estimate auto-updates with service/destination
  useEffect(() => {
    if (activeRide) return;
    apiFetch('POST', '/rides/estimate', { pickupLat: PICKUP.lat, pickupLng: PICKUP.lng, dropoffLat: dropoff.lat, dropoffLng: dropoff.lng, vehicleType: svc }, token).then(r => { if (r.total) setEstimate(r); });
  }, [svc, dropoff, myLoc, activeRide]);

  const requestRide = async () => {
    setLoading(true);
    const r = await apiFetch('POST', '/rides/request', {
      pickupLat: PICKUP.lat, pickupLng: PICKUP.lng, pickupAddress: PICKUP.address,
      dropoffLat: dropoff.lat, dropoffLng: dropoff.lng, dropoffAddress: dropoff.address,
      serviceType: svc, paymentMethod: 'CASH',
    }, token);
    setLoading(false);
    if (r.ride) { setActiveRide(r.ride); setDriver(null); } else Alert.alert(t('error'), t('connFail'));
  };
  const cancelRide = async () => { if (activeRide) await apiFetch('POST', `/rides/${activeRide.id}/status`, { status: 'CANCELLED' }, token); setActiveRide(null); setDriver(null); };

  useEffect(() => {
    if (!activeRide || activeRide.status === 'COMPLETED') return;
    const iv = setInterval(async () => {
      const r = await apiFetch('GET', `/rides/${activeRide.id}`, undefined, token);
      if (r.ride) {
        setActiveRide((prev: any) => ({ ...prev, status: r.ride.status }));
        if (r.driver && !driver) setDriver(r.driver);
        if (r.ride.status === 'COMPLETED') { Alert.alert(t('rideEnded'), t('thanks')); clearInterval(iv); setTimeout(() => { setActiveRide(null); setDriver(null); }, 1500); }
      }
    }, 3000);
    return () => clearInterval(iv);
  }, [activeRide?.id, driver]);

  const loadRides = async () => { const r = await apiFetch('GET', '/rides/my', undefined, token); if (r.rides) setRides(r.rides); };
  useEffect(() => { if (view === 'rides') loadRides(); }, [view]);

  const statusTxt = (s: string) => s === 'SEARCHING' ? t('searching') : s === 'ACCEPTED' ? t('accepted') : s === 'ARRIVED' ? t('arrived') : s === 'ONGOING' ? t('ongoing') : s;
  const initials = (user?.fullName || 'P').trim().charAt(0).toUpperCase();
  const nav = (v: any) => { setView(v); setDrawer(false); };

  const DrawerMenu = () => (
    <Modal visible={drawer} transparent animationType="fade" onRequestClose={() => setDrawer(false)}>
      <TouchableOpacity style={dr.drawerBg} activeOpacity={1} onPress={() => setDrawer(false)}>
        <TouchableOpacity activeOpacity={1} style={dr.drawerPanel}>
          <View style={dr.avatarBig}><Text style={dr.avatarTxt}>{initials}</Text></View>
          <Text style={dr.drawerName}>{user?.fullName || t('passengerName')}</Text>
          <View style={{ alignItems: 'center', marginBottom: 10 }}><Text style={{ color: YELLOW, fontWeight: '700' }}>⭐ {user?.winPoints || 0} WinPoints</Text></View>
          {[{ id: 'home', icon: 'map', label: t('mHome') }, { id: 'rides', icon: 'time', label: t('tRides') }, { id: 'account', icon: 'person', label: t('mAccount') }].map(it => (
            <TouchableOpacity key={it.id} style={[dr.drawerItem, view === it.id && dr.drawerItemActive]} onPress={() => nav(it.id)}>
              <Ionicons name={it.icon as any} size={20} color={view === it.id ? '#111' : '#fff'} />
              <Text style={[dr.drawerItemTxt, view === it.id && { color: '#111', fontWeight: '800' }]}>{it.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={dr.drawerItem} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" /><Text style={[dr.drawerItemTxt, { color: '#FF6B6B' }]}>{t('mSignOut')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[dr.drawerItem, { marginTop: 'auto' }]} onPress={() => { setDrawer(false); openSettings(); }}>
            <Ionicons name="settings-outline" size={20} color="#fff" /><Text style={dr.drawerItemTxt}>{t('settings')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  // ===== RIDES history / ACCOUNT (dark scroll) =====
  if (view === 'rides' || view === 'account') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
        <StatusBar barStyle="dark-content" backgroundColor={YELLOW} />
        <DrawerMenu />
        <SafeAreaView style={{ backgroundColor: YELLOW }}>
          <View style={dr.headerTop}>
            <TouchableOpacity style={dr.menuBtn} onPress={() => setDrawer(true)}><Ionicons name="menu" size={24} color={YELLOW} /></TouchableOpacity>
            <TouchableOpacity style={dr.avatarSm} onPress={() => setDrawer(true)}><Text style={{ color: '#111', fontWeight: '800' }}>{initials}</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
          {view === 'rides' && (
            <>
              <Text style={dr.sectionTitle}>{t('ridesHistory')} ({rides.length})</Text>
              {rides.length === 0 ? <Text style={dr.emptyTxt}>{t('noRides')}</Text> : rides.map((r: any) => <TripCard key={r.id} trip={r} />)}
            </>
          )}
          {view === 'account' && (
            <>
              <View style={dr.accCard}>
                <View style={[dr.avatarBig, { marginBottom: 12 }]}><Text style={dr.avatarTxt}>{initials}</Text></View>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{user?.fullName || t('passengerName')}</Text>
                <Text style={{ color: '#888', marginBottom: 10 }}>{user?.phone}</Text>
                <View style={{ backgroundColor: YELLOW, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7 }}>
                  <Text style={{ color: '#111', fontWeight: '800' }}>⭐ {user?.winPoints || 0} WinPoints</Text>
                </View>
              </View>
              <TouchableOpacity style={[dr.smallBtn, { backgroundColor: C.error }]} onPress={onLogout}><Text style={{ color: '#fff', fontWeight: '800' }}>{t('mSignOut')}</Text></TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ===== HOME (full-map booking + live tracking) =====
  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#e8eef2" />
      <DrawerMenu />

      {/* destination picker */}
      <Modal visible={destPicker} transparent animationType="slide" onRequestClose={() => setDestPicker(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setDestPicker(false)}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 34 }}>
            <Text style={{ fontWeight: '800', fontSize: 16, marginBottom: 14, color: '#111' }}>{t('to')}</Text>
            {DESTS.map((d, i) => (
              <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: i < DESTS.length - 1 ? 1 : 0, borderBottomColor: '#eee' }} onPress={() => { setDropoff(d); setDestPicker(false); }}>
                <Ionicons name="location" size={20} color={YELLOW} /><Text style={{ fontSize: 15, color: '#111' }}>{d.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <RideMap pickup={PICKUP} dropoff={dropoff} driver={driver} height={SCRH} />

      <SafeAreaView style={rs.floatTop} pointerEvents="box-none">
        <TouchableOpacity style={dr.menuBtn} onPress={() => setDrawer(true)}><Ionicons name="menu" size={24} color={YELLOW} /></TouchableOpacity>
        <TouchableOpacity style={dr.avatarSm} onPress={() => setDrawer(true)}><Text style={{ color: '#111', fontWeight: '800' }}>{initials}</Text></TouchableOpacity>
      </SafeAreaView>

      <View style={rs.sheet}>
        <View style={rs.grab} />
        {!activeRide ? (
          // ── Booking ──
          <>
            <Text style={ps.label}>{t('from')}</Text>
            <View style={[au.input, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <Ionicons name="location" size={16} color="#111" /><Text style={{ color: '#111', flex: 1 }} numberOfLines={1}>{PICKUP.address}</Text>
            </View>
            <Text style={ps.label}>{t('to')}</Text>
            <TouchableOpacity style={[au.input, { flexDirection: 'row', alignItems: 'center', gap: 8 }]} onPress={() => setDestPicker(true)}>
              <Ionicons name="location" size={16} color={YELLOW === '#FFD400' ? '#E0A800' : YELLOW} /><Text style={{ color: '#111', flex: 1 }} numberOfLines={1}>{dropoff.address}</Text>
              <Ionicons name="chevron-down" size={16} color="#888" />
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
              {SERVICES.map(sv => (
                <TouchableOpacity key={sv.type} style={[ps.svcChip, svc === sv.type && { backgroundColor: YELLOW, borderColor: YELLOW }]} onPress={() => setSvc(sv.type)}>
                  <Text style={{ fontSize: 18 }}>{sv.icon}</Text>
                  <Text style={[ps.svcTxt, svc === sv.type && { color: '#111', fontWeight: '800' }]}>{sv.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {estimate && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>{estimate.total} {t('da')}</Text>
                <Text style={{ color: '#999' }}>{estimate.estimatedDistance?.toFixed(1)} {t('km')} • {fmtDur(estimate.estimatedDuration)}</Text>
              </View>
            )}

            <TouchableOpacity style={[rs.btn, { backgroundColor: YELLOW }]} onPress={requestRide} disabled={loading}>
              {loading ? <ActivityIndicator color="#111" /> : <Text style={rs.btnD}>{t('confirmOrder')}</Text>}
            </TouchableOpacity>
          </>
        ) : activeRide.status === 'SEARCHING' ? (
          // ── Searching ──
          <>
            <View style={{ alignItems: 'center', paddingVertical: 10 }}>
              <ActivityIndicator color={YELLOW} size="large" />
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16, marginTop: 12 }}>{t('searching')}</Text>
              <Text style={{ color: '#999', marginTop: 4 }}>{activeRide.totalFare} {t('da')} • {activeRide.distance} {t('km')}</Text>
            </View>
            <TouchableOpacity style={[rs.btn, { backgroundColor: C.error }]} onPress={cancelRide}><Text style={rs.btnW}>{t('cancelTrip')}</Text></TouchableOpacity>
          </>
        ) : (
          // ── Driver assigned / en route ──
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[rs.pAvatar, { width: 50, height: 50, borderRadius: 25 }]}><Text style={{ color: '#111', fontWeight: '900', fontSize: 20 }}>{(driver?.fullName || 'D').charAt(0)}</Text></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{driver?.fullName || t('driver')}</Text>
                <Text style={{ color: '#999', fontSize: 13 }}>{driver?.carModel} • {driver?.carPlate}</Text>
                <View style={{ marginTop: 2 }}><Stars n={Math.round(driver?.rating || 5)} /></View>
              </View>
              <TouchableOpacity style={rs.circleBtn} onPress={() => driver && Alert.alert('📞', driver.fullName)}><Ionicons name="call" size={18} color="#111" /></TouchableOpacity>
            </View>
            <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, marginTop: 14 }}>
              <Text style={{ color: YELLOW, fontWeight: '800', textAlign: 'center' }}>{statusTxt(activeRide.status)}</Text>
              <Text style={{ color: '#999', textAlign: 'center', marginTop: 4 }}>{activeRide.totalFare} {t('da')}</Text>
            </View>
            {(activeRide.status === 'ACCEPTED' || activeRide.status === 'ARRIVED') && (
              <TouchableOpacity style={[rs.btn, { backgroundColor: C.error }]} onPress={cancelRide}><Text style={rs.btnW}>{t('cancelTrip')}</Text></TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
}

// ─── تطبيق السائق ─────────────────────────────────────────────
function Stars({ n = 4, size = 12 }: { n?: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons key={i} name={i <= n ? 'star' : 'star-outline'} size={size} color={YELLOW} style={{ marginRight: 1 }} />
      ))}
    </View>
  );
}

function TripCard({ trip }: { trip: any }) {
  const { t } = useLang();
  const time = new Date(trip.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const pay = trip.paymentMethod === 'CARD' ? t('payCard') : t('payCash');
  const short = (s: string) => (s || '').split('،')[0].split(',')[0].slice(0, 14);
  return (
    <View style={dr.tripCard}>
      <View style={{ width: 70 }}>
        <Text style={dr.tripTime}>{time}</Text>
        <Stars n={Math.round(trip.rating || 5)} />
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={dr.tripRoute} numberOfLines={1}>{short(trip.pickupAddress)} → {short(trip.dropoffAddress)}</Text>
      </View>
      <View style={{ width: 64, alignItems: 'flex-end' }}>
        <Text style={dr.tripFare}>{trip.totalFare} {t('da')}</Text>
        <Text style={dr.tripPay}>{pay}</Text>
      </View>
    </View>
  );
}

function DriverApp({ token, user, onLogout }: { token: string; user: any; onLogout: () => void }) {
  const { t, openSettings } = useLang();
  const [view, setView] = useState<'home' | 'rides' | 'account'>('home');
  const [drawer, setDrawer] = useState(false);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [isOnline, setIsOnline] = useState(false);
  const [earnings, setEarnings] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [myRide, setMyRide] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);

  const loadEarnings = () => apiFetch('GET', '/drivers/me/earnings?period=today', undefined, token).then(r => { if (r.success !== false) setEarnings(r); });
  const loadTrips = () => apiFetch('GET', '/drivers/me/trips', undefined, token).then(r => { if (r.trips) setTrips(r.trips); });
  useEffect(() => { loadEarnings(); loadTrips(); apiFetch('GET', '/contracts/my', undefined, token).then(r => { if (r.contract) setContract(r.contract); }); }, []);

  useEffect(() => {
    if (!isOnline || myRide) return;
    const iv = setInterval(async () => { const r = await apiFetch('GET', '/rides/available', undefined, token); if (r.rides) setRequests(r.rides); }, 3000);
    return () => clearInterval(iv);
  }, [isOnline, myRide]);

  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [countdown, setCountdown] = useState(25);
  const [stopIndex, setStopIndex] = useState(0);
  const [nearDrop, setNearDrop] = useState(false);
  const [acctView, setAcctView] = useState<'main' | 'details' | 'vehicle' | 'password' | 'support'>('main');
  const [prof, setProf] = useState({ firstName: '', lastName: '', email: '', city: '', phone: '' });
  const [veh, setVeh] = useState({ brand: '', model: '', year: '', plate: '' });

  useEffect(() => {
    if (view !== 'account') return;
    apiFetch('GET', '/drivers/me', undefined, token).then(r => {
      if (r.user) { const p = (r.user.fullName || '').split(' '); setProf({ firstName: p[0] || '', lastName: p.slice(1).join(' '), email: r.user.email || '', city: r.user.city || '', phone: r.user.phone || '' }); }
      if (r.driver) setVeh({ brand: r.driver.carBrand || '', model: r.driver.carModel || '', year: String(r.driver.carYear || ''), plate: r.driver.carPlate || '' });
    });
  }, [view]);
  const saveProfile = async () => { await apiFetch('PATCH', '/drivers/me/profile', { fullName: `${prof.firstName} ${prof.lastName}`.trim(), email: prof.email, city: prof.city, phone: prof.phone }, token); Alert.alert('✅', t('saved')); setAcctView('main'); };
  const saveVehicle = async () => { await apiFetch('PATCH', '/drivers/me/vehicle', veh, token); Alert.alert('✅', t('saved')); setAcctView('main'); };

  // محاكاة القيادة: زر "Arrived" يظهر بعد الاقتراب من الوجهة (~10ث من بدء الرحلة)
  useEffect(() => {
    if (myRide?.status === 'ONGOING' && !nearDrop && !paused) {
      const id = setTimeout(() => setNearDrop(true), 10000);
      return () => clearTimeout(id);
    }
  }, [myRide?.status, nearDrop, paused]);

  // countdown for the top incoming request (auto-skip at 0)
  useEffect(() => {
    if (!isOnline || myRide || requests.length === 0) { setCountdown(25); return; }
    if (countdown <= 0) { setRequests([]); return; }
    const id = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [isOnline, myRide, requests, countdown]);

  const acceptRide = async (ride: any) => { const r = await apiFetch('POST', `/rides/${ride.id}/accept`, {}, token); if (r.success) { setMyRide(r.ride); setPaused(false); setStopIndex(0); setNearDrop(false); setRequests([]); } };
  const reject = () => { setRequests([]); setCountdown(25); };
  const updateRide = async (status: string) => {
    await apiFetch('POST', `/rides/${myRide.id}/status`, { status }, token);
    if (status === 'COMPLETED') { setFinished(true); loadEarnings(); loadTrips(); setTimeout(() => { setFinished(false); setMyRide(null); setPaused(false); }, 2300); }
    else setMyRide({ ...myRide, status });
  };
  const cancelRide = async () => { if (myRide) await apiFetch('POST', `/rides/${myRide.id}/status`, { status: 'CANCELLED' }, token); setMyRide(null); setPaused(false); };
  const callPassenger = () => { if (myRide?.passengerPhone) Linking.openURL(`tel:${myRide.passengerPhone}`); else Alert.alert('📞', myRide?.passengerName || ''); };
  const toggleOnline = async () => {
    setLoading(true);
    const r = await apiFetch('PATCH', '/drivers/status', { isOnline: !isOnline }, token);
    setLoading(false);
    if (r.success !== false) { setIsOnline(r.isOnline); if (r.isOnline) setView('rides'); }
  };

  const initials = (user?.fullName || 'D').trim().charAt(0).toUpperCase();
  const nav = (v: any) => { setView(v); setDrawer(false); if (v === 'account') setAcctView('main'); };
  const SCRH = Dimensions.get('window').height;
  const driverLoc = myRide ? { lat: myRide.pickupLat + 0.003, lng: myRide.pickupLng + 0.002 } : { lat: 36.7525, lng: 3.042 };
  const initOf = (n: string) => (n || 'P').trim().charAt(0).toUpperCase();

  // ── Side Drawer ──
  const DrawerMenu = () => (
    <Modal visible={drawer} transparent animationType="fade" onRequestClose={() => setDrawer(false)}>
      <TouchableOpacity style={dr.drawerBg} activeOpacity={1} onPress={() => setDrawer(false)}>
        <TouchableOpacity activeOpacity={1} style={dr.drawerPanel}>
          <View style={dr.avatarBig}><Text style={dr.avatarTxt}>{initials}</Text></View>
          <Text style={dr.drawerName}>{user?.fullName || t('driverName')}</Text>
          <View style={{ alignItems: 'center', marginBottom: 24 }}><Stars n={5} size={14} /></View>
          {[
            { id: 'home', icon: 'home', label: t('mHome') },
            { id: 'rides', icon: 'car-sport', label: t('mRides') },
            { id: 'account', icon: 'person', label: t('mAccount') },
          ].map(it => (
            <TouchableOpacity key={it.id} style={[dr.drawerItem, view === it.id && dr.drawerItemActive]} onPress={() => nav(it.id)}>
              <Ionicons name={it.icon as any} size={20} color={view === it.id ? '#111' : '#fff'} />
              <Text style={[dr.drawerItemTxt, view === it.id && { color: '#111', fontWeight: '800' }]}>{it.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={dr.drawerItem} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={[dr.drawerItemTxt, { color: '#FF6B6B' }]}>{t('mSignOut')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[dr.drawerItem, { marginTop: 'auto' }]} onPress={() => { setDrawer(false); openSettings(); }}>
            <Ionicons name="settings-outline" size={20} color="#fff" />
            <Text style={dr.drawerItemTxt}>{t('settings')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const PERIODS = [{ id: 'today', l: t('pToday') }, { id: 'week', l: t('pWeek') }, { id: 'month', l: t('pMonth') }, { id: 'all', l: t('pAll') }];

  // بطاقة الراكب (للرحلة النشطة والطلب الوارد)
  const PassengerCard = ({ ride }: { ride: any }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ alignItems: 'center', width: 86 }}>
        <View style={rs.pAvatar}><Text style={{ color: '#111', fontWeight: '900', fontSize: 22 }}>{initOf(ride.passengerName)}</Text></View>
        <Text style={rs.pName} numberOfLines={1}>{ride.passengerName || t('passengerName')}</Text>
        <Stars n={Math.round(ride.passengerRating || 5)} />
      </View>
      <View style={{ flex: 1, paddingLeft: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 18 }}>{ride.totalFare} {t('da')}</Text>
          <Text style={{ color: '#999', fontSize: 13 }}>{ride.distance} {t('km')}</Text>
          <Text style={{ color: '#999', fontSize: 13 }}>{fmtDur(ride.duration)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Ionicons name="location" size={15} color="#fff" /><Text style={rs.addr} numberOfLines={1}>{ride.pickupAddress}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="location" size={15} color={YELLOW} /><Text style={rs.addr} numberOfLines={1}>{ride.dropoffAddress}</Text>
        </View>
        {(ride.stops || []).map((s: any, i: number) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <Ionicons name="location" size={15} color={YELLOW} /><Text style={rs.addr} numberOfLines={1}>{s.address}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ===== RIDES VIEW (full-map flow) =====
  if (view === 'rides') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#e8eef2" />
        <DrawerMenu />

        {finished ? (
          <View style={rs.finishWrap}>
            <View style={rs.finishCard}>
              <Ionicons name="checkmark-sharp" size={96} color={YELLOW} />
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#111', marginTop: 10 }}>{t('tripFinished')}</Text>
            </View>
          </View>
        ) : (
          <>
            <RideMap
              pickup={myRide ? { lat: myRide.pickupLat, lng: myRide.pickupLng } : driverLoc}
              dropoff={myRide ? { lat: myRide.dropoffLat, lng: myRide.dropoffLng } : null}
              driver={myRide ? driverLoc : null}
              height={SCRH}
            />

            {/* floating top bar */}
            <SafeAreaView style={rs.floatTop} pointerEvents="box-none">
              <TouchableOpacity style={dr.menuBtn} onPress={() => setDrawer(true)}><Ionicons name="menu" size={24} color={YELLOW} /></TouchableOpacity>
              <TouchableOpacity style={dr.avatarSm} onPress={() => setDrawer(true)}><Text style={{ color: '#111', fontWeight: '800' }}>{initials}</Text></TouchableOpacity>
            </SafeAreaView>

            {/* Hail/online floating button */}
            {isOnline && !myRide && (
              <View style={rs.hailWrap}>
                <View style={rs.hailBtn}><Ionicons name="person" size={22} color={YELLOW} /></View>
              </View>
            )}

            {/* bottom sheet */}
            <View style={rs.sheet}>
              <View style={rs.grab} />
              {myRide ? (
                <>
                  <PassengerCard ride={myRide} />
                  {myRide.status === 'ACCEPTED' && (
                    <>
                      <View style={rs.callRow}>
                        <TouchableOpacity style={rs.circleBtn} onPress={callPassenger}><Ionicons name="call" size={18} color="#111" /></TouchableOpacity>
                        <TouchableOpacity style={rs.circleBtn} onPress={() => Alert.alert('💬', myRide.passengerName)}><Ionicons name="chatbubble-ellipses" size={18} color="#111" /></TouchableOpacity>
                        <TouchableOpacity style={[rs.btn, { flex: 1, backgroundColor: C.error }]} onPress={cancelRide}><Text style={rs.btnW}>{t('cancelTrip')}</Text></TouchableOpacity>
                      </View>
                      <TouchableOpacity style={[rs.btn, { backgroundColor: YELLOW }]} onPress={() => updateRide('ARRIVED')}><Text style={rs.btnD}>{t('arrivedPickup')}</Text></TouchableOpacity>
                    </>
                  )}
                  {myRide.status === 'ARRIVED' && (
                    <TouchableOpacity style={[rs.btn, { backgroundColor: YELLOW }]} onPress={() => updateRide('ONGOING')}><Text style={rs.btnD}>{t('startTripBtn')}</Text></TouchableOpacity>
                  )}
                  {myRide.status === 'ONGOING' && (() => {
                    const stops = myRide.stops || [];
                    const moreStops = stops.length > 0 && stopIndex < stops.length;
                    const arriveLabel = moreStops ? `${t('arrivedDrop')} ${stopIndex + 1}` : t('arrivedDrop');
                    const onArrive = () => { if (moreStops) { setStopIndex(stopIndex + 1); setNearDrop(false); } else updateRide('COMPLETED'); };
                    const pauseBtn = (full?: boolean) => (
                      <TouchableOpacity style={[rs.btn, full ? {} : { flex: 1 }, { backgroundColor: paused ? YELLOW : '#fff' }]} onPress={() => setPaused(!paused)}>
                        <Text style={rs.btnD}>{paused ? t('resumeTrip') : t('pauseTrip')}</Text>
                      </TouchableOpacity>
                    );
                    // قبل الاقتراب: زر واحد بعرض كامل — بعده: زرّان مع Arrived
                    return !nearDrop ? pauseBtn(true) : (
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        {pauseBtn()}
                        <TouchableOpacity style={[rs.btn, { flex: 1, backgroundColor: paused ? '#d9d9d9' : YELLOW }]} onPress={onArrive}>
                          <Text style={rs.btnD}>{arriveLabel}</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })()}
                </>
              ) : isOnline ? (
                requests.length > 0 ? (
                  <>
                    <PassengerCard ride={requests[0]} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
                      <TouchableOpacity style={[rs.btn, { flex: 1, backgroundColor: C.error }]} onPress={reject}><Text style={rs.btnW}>{t('reject')}</Text></TouchableOpacity>
                      <View style={rs.countdown}><Text style={{ color: '#111', fontWeight: '800' }}>{countdown}</Text></View>
                      <TouchableOpacity style={[rs.btn, { flex: 1, backgroundColor: YELLOW }]} onPress={() => acceptRide(requests[0])}><Text style={rs.btnD}>{t('accept')}</Text></TouchableOpacity>
                    </View>
                    {(requests[0].stops || []).length > 0 && (
                      <View style={{ marginTop: 16 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13, marginBottom: 8 }}>{t('stopOverPoints')}</Text>
                        {requests[0].stops.map((s: any, i: number) => (
                          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <View style={{ width: 8, height: 8, borderRadius: 4, borderWidth: 2, borderColor: YELLOW }} />
                            <Text style={{ color: '#bbb', fontSize: 12 }} numberOfLines={1}>{s.address}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </>
                ) : (
                  <>
                    <Text style={rs.statusTitle}>{t('scanning')}</Text>
                    <View style={rs.statsRow}>
                      <View style={rs.statItem}><Ionicons name="checkmark-circle" size={20} color={YELLOW} /><Text style={rs.statBig}>{earnings?.acceptance || 95}%</Text><Text style={rs.statSm}>{t('acceptance')}</Text></View>
                      <View style={rs.statItem}><Ionicons name="star" size={20} color={YELLOW} /><Text style={rs.statBig}>{earnings?.rating || 4.9}</Text><Text style={rs.statSm}>{t('ratingLbl')}</Text></View>
                      <View style={rs.statItem}><Ionicons name="close-circle" size={20} color={C.error} /><Text style={rs.statBig}>{earnings?.cancellation || 2}%</Text><Text style={rs.statSm}>{t('cancellation')}</Text></View>
                    </View>
                    <TouchableOpacity style={[rs.btn, { backgroundColor: '#222', marginTop: 12 }]} onPress={toggleOnline}><Text style={[rs.btnW, { color: C.error }]}>{t('goOfflineNow')}</Text></TouchableOpacity>
                  </>
                )
              ) : (
                <>
                  <Text style={rs.statusTitle}>{t('offlineStatus')}</Text>
                  <View style={rs.statsRow}>
                    <View style={rs.statItem}><Ionicons name="checkmark-circle" size={20} color="#666" /><Text style={rs.statBig}>{earnings?.acceptance || 95}%</Text><Text style={rs.statSm}>{t('acceptance')}</Text></View>
                    <View style={rs.statItem}><Ionicons name="star" size={20} color="#666" /><Text style={rs.statBig}>{earnings?.rating || 4.9}</Text><Text style={rs.statSm}>{t('ratingLbl')}</Text></View>
                    <View style={rs.statItem}><Ionicons name="close-circle" size={20} color="#666" /><Text style={rs.statBig}>{earnings?.cancellation || 2}%</Text><Text style={rs.statSm}>{t('cancellation')}</Text></View>
                  </View>
                  <TouchableOpacity style={[rs.btn, { backgroundColor: YELLOW, marginTop: 12 }]} onPress={toggleOnline} disabled={loading}>
                    {loading ? <ActivityIndicator color="#111" /> : <Text style={rs.btnD}>{t('goOnlineNow')}</Text>}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </>
        )}
      </View>
    );
  }

  // ===== ACCOUNT (profile + settings) =====
  if (view === 'account') {
    if (acctView !== 'main') {
      const title = acctView === 'details' ? t('accountDetails') : acctView === 'vehicle' ? t('vehicleDetails') : acctView === 'password' ? t('passwordLbl') : t('customerSupport');
      return (
        <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
          <StatusBar barStyle="light-content" backgroundColor="#0D0D0D" />
          <DrawerMenu />
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20 }}>
              <TouchableOpacity onPress={() => setAcctView('main')}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{title}</Text>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 0 }}>
              {acctView === 'details' && (<>
                <Text style={ps.label}>{t('firstName')}</Text>
                <TextInput style={au.input} value={prof.firstName} onChangeText={(v) => setProf({ ...prof, firstName: v })} placeholderTextColor="#999" />
                <Text style={ps.label}>{t('lastName')}</Text>
                <TextInput style={au.input} value={prof.lastName} onChangeText={(v) => setProf({ ...prof, lastName: v })} placeholderTextColor="#999" />
                <Text style={ps.label}>{t('email')}</Text>
                <TextInput style={au.input} value={prof.email} onChangeText={(v) => setProf({ ...prof, email: v })} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#999" />
                <Text style={ps.label}>{t('city')}</Text>
                <TextInput style={au.input} value={prof.city} onChangeText={(v) => setProf({ ...prof, city: v })} placeholderTextColor="#999" />
                <Text style={ps.label}>{t('phone')}</Text>
                <TextInput style={au.input} value={prof.phone} onChangeText={(v) => setProf({ ...prof, phone: v })} keyboardType="phone-pad" placeholderTextColor="#999" />
                <TouchableOpacity style={[rs.btn, { backgroundColor: YELLOW, marginTop: 10 }]} onPress={saveProfile}><Text style={rs.btnD}>{t('save')}</Text></TouchableOpacity>
              </>)}
              {acctView === 'vehicle' && (<>
                <Text style={ps.label}>{t('vehicleBrand')}</Text>
                <TextInput style={au.input} value={veh.brand} onChangeText={(v) => setVeh({ ...veh, brand: v })} placeholder="Toyota" placeholderTextColor="#999" />
                <Text style={ps.label}>{t('vehicleModel')}</Text>
                <TextInput style={au.input} value={veh.model} onChangeText={(v) => setVeh({ ...veh, model: v })} placeholder="Camry" placeholderTextColor="#999" />
                <Text style={ps.label}>{t('yearLbl')}</Text>
                <TextInput style={au.input} value={veh.year} onChangeText={(v) => setVeh({ ...veh, year: v })} keyboardType="numeric" placeholder="2006" placeholderTextColor="#999" />
                <Text style={ps.label}>{t('plateNumber')}</Text>
                <TextInput style={au.input} value={veh.plate} onChangeText={(v) => setVeh({ ...veh, plate: v })} placeholder="80519MR" placeholderTextColor="#999" />
                <TouchableOpacity style={[rs.btn, { backgroundColor: YELLOW, marginTop: 10 }]} onPress={saveVehicle}><Text style={rs.btnD}>{t('save')}</Text></TouchableOpacity>
              </>)}
              {acctView === 'password' && (<>
                <Text style={ps.label}>{t('currentPassword')}</Text>
                <TextInput style={au.input} secureTextEntry placeholder="••••••" placeholderTextColor="#999" />
                <Text style={ps.label}>{t('newPassword')}</Text>
                <TextInput style={au.input} secureTextEntry placeholder="••••••" placeholderTextColor="#999" />
                <TouchableOpacity style={[rs.btn, { backgroundColor: YELLOW, marginTop: 10 }]} onPress={() => { Alert.alert('✅', t('saved')); setAcctView('main'); }}><Text style={rs.btnD}>{t('save')}</Text></TouchableOpacity>
              </>)}
              {acctView === 'support' && (<>
                <Text style={{ color: '#bbb', fontSize: 15, marginBottom: 16 }}>{t('supportText')}</Text>
                <TouchableOpacity style={dr.tripCard} onPress={() => Linking.openURL('tel:+213555000000')}>
                  <Ionicons name="call" size={20} color={YELLOW} /><Text style={{ color: '#fff', marginLeft: 12 }}>+213 555 000 000</Text>
                </TouchableOpacity>
                <TouchableOpacity style={dr.tripCard} onPress={() => Linking.openURL('mailto:support@winrak.dz')}>
                  <Ionicons name="mail" size={20} color={YELLOW} /><Text style={{ color: '#fff', marginLeft: 12 }}>support@winrak.dz</Text>
                </TouchableOpacity>
              </>)}
            </ScrollView>
          </SafeAreaView>
        </View>
      );
    }
    const wallet = Math.round(earnings?.total || 0);
    const ITEMS = [
      { id: 'details', icon: 'create-outline', label: t('profileSettings') },
      { id: 'password', icon: 'lock-closed-outline', label: t('passwordLbl') },
      { id: 'vehicle', icon: 'car-outline', label: t('vehicleDetails') },
      { id: 'support', icon: 'headset-outline', label: t('customerSupport') },
    ];
    return (
      <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
        <StatusBar barStyle="dark-content" backgroundColor={YELLOW} />
        <DrawerMenu />
        <SafeAreaView style={{ backgroundColor: YELLOW }}>
          <View style={dr2.acctHeader}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <TouchableOpacity style={dr.menuBtn} onPress={() => setDrawer(true)}><Ionicons name="menu" size={24} color={YELLOW} /></TouchableOpacity>
              <View style={dr2.wallet}><Text style={{ color: '#999', fontSize: 10 }}>{t('walletBalance')}</Text><Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>{t('da')} {wallet.toLocaleString()}</Text></View>
              <View style={{ width: 44 }} />
            </View>
            <View style={{ alignItems: 'center', marginTop: 6 }}>
              <View style={dr2.acctAvatar}>
                <Text style={{ color: '#111', fontWeight: '900', fontSize: 32 }}>{initials}</Text>
                <View style={dr2.pencil}><Ionicons name="pencil" size={12} color="#111" /></View>
              </View>
              <Text style={{ color: '#111', fontSize: 18, fontWeight: '900', marginTop: 8 }}>{user?.fullName || t('driverName')}</Text>
              <Stars n={5} size={13} />
              <Text style={{ color: '#5a4a00', fontSize: 12, marginTop: 4 }}>{user?.phone}</Text>
            </View>
          </View>
        </SafeAreaView>
        <ScrollView contentContainerStyle={{ padding: 18 }}>
          {ITEMS.map(it => (
            <TouchableOpacity key={it.id} style={dr2.acctRow} onPress={() => setAcctView(it.id as any)}>
              <Ionicons name={it.icon as any} size={20} color={YELLOW} />
              <Text style={{ color: '#fff', flex: 1, marginLeft: 14, fontSize: 15, fontWeight: '600' }}>{it.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#666" />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={{ alignItems: 'center', marginTop: 20 }} onPress={onLogout}>
            <Text style={{ color: YELLOW, fontWeight: '800', fontSize: 15 }}>⏻ {t('mSignOut')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ===== HOME (yellow header + scroll) =====
  return (
    <View style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <StatusBar barStyle="dark-content" backgroundColor={YELLOW} />
      <DrawerMenu />
      <SafeAreaView style={{ backgroundColor: YELLOW }}>
        <View style={dr.yHeader}>
          <View style={dr.headerTop}>
            <TouchableOpacity style={dr.menuBtn} onPress={() => setDrawer(true)}><Ionicons name="menu" size={24} color={YELLOW} /></TouchableOpacity>
            <TouchableOpacity style={dr.avatarSm} onPress={() => setDrawer(true)}><Text style={{ color: '#111', fontWeight: '800', fontSize: 16 }}>{initials}</Text></TouchableOpacity>
          </View>
          {view === 'home' && (
            <>
              <View style={dr.chipsRow}>
                {PERIODS.map(p => (
                  <TouchableOpacity key={p.id} style={[dr.chip, period === p.id && dr.chipActive]} onPress={() => setPeriod(p.id as any)}>
                    <Text style={[dr.chipTxt, period === p.id && { color: YELLOW }]}>{p.l}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={dr.statsBox}>
                <View style={dr.statCol}><Text style={dr.statNum}>{earnings?.driver?.totalTrips || 0}</Text><Text style={dr.statLbl}>{t('statTrips')}</Text></View>
                <View style={dr.statDiv} />
                <View style={dr.statCol}><Text style={dr.statNum}>{earnings?.hoursOnline || 0}</Text><Text style={dr.statLbl}>{t('statHours')}</Text></View>
                <View style={dr.statDiv} />
                <View style={dr.statCol}><Text style={dr.statNum}>{Math.round(earnings?.total || 0)}</Text><Text style={dr.statLbl}>{t('da')} {t('statEarned')}</Text></View>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 40 }}>
        {view === 'home' && (
          <>
            <TouchableOpacity style={[dr.onlineBtn, { backgroundColor: isOnline ? '#1f3d2e' : '#1a1a1a', borderColor: isOnline ? C.success : '#333' }]} onPress={toggleOnline} disabled={loading}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isOnline ? C.success : '#777' }} />
                <Text style={{ color: '#fff', fontWeight: '700' }}>{isOnline ? t('onlineMsg') : t('goOnlineCard')}</Text>
              </View>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: isOnline ? C.error : YELLOW, fontWeight: '800' }}>{isOnline ? t('stopWork') : t('startWork')}</Text>}
            </TouchableOpacity>
            <Text style={dr.sectionTitle}>{t('tripsToday')}</Text>
            {trips.length === 0 ? <Text style={dr.emptyTxt}>{t('noTrips')}</Text> : trips.map((tr: any) => <TripCard key={tr.id} trip={tr} />)}
          </>
        )}
      </ScrollView>
    </View>
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

// أنماط شاشات الدخول (الثيم الأسود/الأصفر)
const au = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0D0D0D' },
  wrap: { padding: 28, paddingTop: Platform.OS === 'ios' ? 80 : 64, flexGrow: 1 },
  back: { color: '#fff', fontSize: 26 },
  title: { color: '#fff', fontSize: 26, fontWeight: '800', marginBottom: 26 },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111', marginBottom: 12 },
  testHint: { color: '#888', fontSize: 12, marginBottom: 18, marginTop: 2 },
  yellowBtn: { backgroundColor: YELLOW, borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  yellowBtnTxt: { color: '#111', fontWeight: '800', fontSize: 16 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: '#333' },
  orTxt: { color: '#888', fontSize: 13 },
  googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 8, paddingVertical: 13 },
  googleG: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  googleTxt: { color: '#111', fontWeight: '700', fontSize: 15 },
  switchTxt: { color: '#bbb', textAlign: 'center', fontSize: 14 },
  // verification
  yellowSheet: { flex: 1, backgroundColor: YELLOW, marginTop: 28, borderTopLeftRadius: 140, paddingTop: 54, paddingHorizontal: 28, alignItems: 'stretch' },
  timerPill: { alignSelf: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, elevation: 4 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  otpBox: { width: 46, height: 56, backgroundColor: '#fff', borderRadius: 10, borderWidth: 2, borderColor: '#111', textAlign: 'center', fontSize: 24, fontWeight: '800', color: '#111' },
  resend: { color: '#111', textAlign: 'center', textDecorationLine: 'underline', fontWeight: '700', marginTop: 4 },
  confirmBtn: { backgroundColor: '#111', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 14 },
  confirmTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
});

// أنماط شاشة السائق (Home + Drawer)
const dr = StyleSheet.create({
  yHeader: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 18 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  menuBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  avatarSm: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#111' },
  chipsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  chip: { backgroundColor: '#111', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 7 },
  chipActive: { backgroundColor: '#000' },
  chipTxt: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statsBox: { flexDirection: 'row', borderWidth: 2, borderColor: '#111', borderRadius: 14, paddingVertical: 14 },
  statCol: { flex: 1, alignItems: 'center' },
  statDiv: { width: 1.5, backgroundColor: '#111', marginVertical: 4 },
  statNum: { fontSize: 22, fontWeight: '900', color: '#111' },
  statLbl: { fontSize: 11, color: '#3a3a1a', marginTop: 2 },
  onlineBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 12, marginTop: 4 },
  tripCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171717', borderRadius: 12, padding: 14, marginBottom: 10 },
  tripTime: { color: '#fff', fontWeight: '700', fontSize: 13, marginBottom: 3 },
  tripRoute: { color: '#ddd', fontSize: 13 },
  tripFare: { color: '#fff', fontWeight: '800', fontSize: 14 },
  tripPay: { color: '#888', fontSize: 11, marginTop: 2 },
  emptyTxt: { color: '#666', textAlign: 'center', marginTop: 30, fontSize: 14 },
  reqCard: { backgroundColor: '#171717', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a2a' },
  activeCard: { backgroundColor: '#171717', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: '#2ED57366' },
  routeWhite: { color: '#ccc', fontSize: 13, marginTop: 4 },
  smallBtn: { borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  accCard: { backgroundColor: '#171717', borderRadius: 16, padding: 20, marginBottom: 14, alignItems: 'center' },
  // drawer
  drawerBg: { flex: 1, backgroundColor: '#00000088', flexDirection: 'row' },
  drawerPanel: { width: '74%', backgroundColor: '#141414', paddingTop: 70, paddingHorizontal: 22, paddingBottom: 30 },
  avatarBig: { width: 92, height: 92, borderRadius: 46, backgroundColor: YELLOW, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 12 },
  avatarTxt: { color: '#111', fontWeight: '900', fontSize: 38 },
  drawerName: { color: '#fff', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 15, paddingHorizontal: 16, borderRadius: 12, marginBottom: 4 },
  drawerItemActive: { backgroundColor: YELLOW },
  drawerItemTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

// أنماط تدفق الرحلة (Rides view بالخريطة)
const rs = StyleSheet.create({
  floatTop: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: Platform.OS === 'ios' ? 8 : 16 },
  hailWrap: { position: 'absolute', bottom: 230, alignSelf: 'center' },
  hailBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0D0D0D', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 22 },
  grab: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#444', alignSelf: 'center', marginBottom: 16 },
  pAvatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: YELLOW, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  pName: { color: '#fff', fontWeight: '700', fontSize: 12, marginBottom: 3 },
  addr: { color: '#bbb', fontSize: 12, flex: 1 },
  callRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  circleBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: YELLOW, justifyContent: 'center', alignItems: 'center' },
  btn: { borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  btnD: { color: '#111', fontWeight: '800', fontSize: 15 },
  btnW: { color: '#fff', fontWeight: '800', fontSize: 15 },
  countdown: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: YELLOW },
  statusTitle: { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center', gap: 3 },
  statBig: { color: '#fff', fontWeight: '900', fontSize: 16 },
  statSm: { color: '#888', fontSize: 12 },
  finishWrap: { flex: 1, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center', padding: 40 },
  finishCard: { backgroundColor: '#fff', borderRadius: 20, paddingVertical: 60, paddingHorizontal: 50, alignItems: 'center', width: '100%' },
});

// أنماط شاشة الحساب (Account)
const dr2 = StyleSheet.create({
  acctHeader: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 26, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  wallet: { backgroundColor: '#111', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 6, alignItems: 'center' },
  acctAvatar: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#111' },
  pencil: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: YELLOW, borderWidth: 2, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  acctRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171717', borderRadius: 14, padding: 16, marginBottom: 10 },
});

// أنماط واجهة الراكب (booking)
const ps = StyleSheet.create({
  label: { color: '#999', fontSize: 12, marginBottom: 6, marginTop: 2 },
  svcChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, backgroundColor: '#1c1c1c', borderWidth: 1.5, borderColor: '#2a2a2a', gap: 2 },
  svcTxt: { color: '#bbb', fontSize: 11, fontWeight: '600' },
});
