/* ═══════════════════════════════════════════════
   MOCK DATA
═══════════════════════════════════════════════ */
let PASSENGERS = [
  {id:'p001',name:'Karim Bouzid',nameAr:'كريم بوزيد',phone:'+213 555 010 203',trips:12,rating:4.9,spent:14800,status:'active',joined:'2025-01-15'},
  {id:'p002',name:'Yacine Aït Ali',nameAr:'ياسين آيت علي',phone:'+213 555 020 304',trips:8,rating:4.6,spent:9200,status:'active',joined:'2025-02-03'},
  {id:'p003',name:'Amira Haddad',nameAr:'أميرة حداد',phone:'+213 555 030 405',trips:25,rating:4.8,spent:31500,status:'active',joined:'2024-11-20'},
  {id:'p004',name:'Sofiane Mekki',nameAr:'سفيان مكي',phone:'+213 555 040 506',trips:3,rating:4.5,spent:3600,status:'inactive',joined:'2025-05-11'},
  {id:'p005',name:'Nadia Brahimi',nameAr:'نادية براهيمي',phone:'+213 555 050 607',trips:18,rating:5.0,spent:22400,status:'active',joined:'2025-01-08'},
  {id:'p006',name:'Mourad Benali',nameAr:'مراد بن علي',phone:'+213 555 060 708',trips:7,rating:4.3,spent:8100,status:'active',joined:'2025-03-22'},
  {id:'p007',name:'Yasmine Rezki',nameAr:'ياسمين رزقي',phone:'+213 555 070 809',trips:32,rating:4.9,spent:41200,status:'active',joined:'2024-10-01'},
  {id:'p008',name:'Omar Cherif',nameAr:'عمر شريف',phone:'+213 555 080 901',trips:14,rating:4.7,spent:16800,status:'active',joined:'2025-02-14'},
  {id:'p009',name:'Sara Boudiaf',nameAr:'سارة بوضياف',phone:'+213 555 090 102',trips:5,rating:4.4,spent:5900,status:'inactive',joined:'2025-04-30'},
  {id:'p010',name:'Mehdi Lazreg',nameAr:'مهدي لزرق',phone:'+213 555 100 203',trips:9,rating:4.6,spent:10800,status:'active',joined:'2025-03-05'},
];

let DRIVERS = [
  {id:'d001',name:'Djamel Troudi',nameAr:'جمال الدين ترودي',phone:'+213 555 100 200',vehicle:'Toyota Corolla',plate:'123 TUN 16',type:'Confort',trips:348,rating:4.9,earnings:245000,status:'on_trip',lat:36.7538,lng:3.0588},
  {id:'d002',name:'Mohamed Issa',nameAr:'محمد عيسى',phone:'+213 555 200 300',vehicle:'Peugeot 208',plate:'456 ALG 16',type:'Économique',trips:212,rating:4.7,earnings:147000,status:'online',lat:36.7300,lng:3.0870},
  {id:'d003',name:'Amina Rahhal',nameAr:'أمينة رحال',phone:'+213 555 300 400',vehicle:'Dacia Logan',plate:'789 ALG 16',type:'She',trips:156,rating:4.8,earnings:108000,status:'offline',lat:36.7700,lng:3.0420},
  {id:'d004',name:'Younes Rezzig',nameAr:'يونس رزيق',phone:'+213 555 400 500',vehicle:'Toyota Yaris',plate:'321 TUN 16',type:'Économique',trips:89,rating:4.6,earnings:62000,status:'online',lat:36.7938,lng:3.0588},
  {id:'d005',name:'Hassan Belmahi',nameAr:'حسان بلمهي',phone:'+213 555 500 600',vehicle:'Hyundai i20',plate:'654 ALG 16',type:'Économique',trips:44,rating:4.5,earnings:30800,status:'offline',lat:36.7538,lng:3.0988},
];

let TRIPS = [
  {id:'TR-1284',pax:'Karim Bouzid',drv:'Djamel Troudi',from:'Didouche Mourad',to:'Aéroport HB',dist:18.4,price:1500,type:'Confort',status:'completed',date:'21/06/2025 10:24'},
  {id:'TR-1283',pax:'Nadia Brahimi',drv:'Mohamed Issa',from:'Hussein Dey',to:'Bab El Oued',dist:7.2,price:620,type:'Économique',status:'completed',date:'21/06/2025 10:11'},
  {id:'TR-1282',pax:'Yasmine Rezki',drv:'Amina Rahhal',from:'El Harrach',to:'Ben Aknoun',dist:14.1,price:890,type:'She',status:'completed',date:'21/06/2025 09:58'},
  {id:'TR-1281',pax:'Omar Cherif',drv:'Younes Rezzig',from:'Alger Centre',to:'Kouba',dist:9.3,price:720,type:'Économique',status:'cancelled',date:'21/06/2025 09:42'},
  {id:'TR-1280',pax:'Amira Haddad',drv:'Djamel Troudi',from:'Bab Ezzouar',to:'Alger Centre',dist:12.6,price:980,type:'Confort',status:'active',date:'21/06/2025 09:31'},
  {id:'TR-1279',pax:'Mourad Benali',drv:'Mohamed Issa',from:'Birmandreis',to:'El Biar',dist:5.8,price:480,type:'Économique',status:'completed',date:'21/06/2025 09:15'},
  {id:'TR-1278',pax:'Karim Bouzid',drv:'Hassan Belmahi',from:'Chéraga',to:'Alger Centre',dist:16.2,price:1200,type:'Confort',status:'completed',date:'20/06/2025 18:44'},
  {id:'TR-1277',pax:'Sara Boudiaf',drv:'Younes Rezzig',from:'Alger Centre',to:'Dar El Beïda',dist:21.3,price:1800,type:'Économique',status:'completed',date:'20/06/2025 17:30'},
  {id:'TR-1276',pax:'Mehdi Lazreg',drv:'Amina Rahhal',from:'Hydra',to:"Sidi M'hamed",dist:8.4,price:690,type:'She',status:'cancelled',date:'20/06/2025 16:55'},
  {id:'TR-1275',pax:'Yacine Aït Ali',drv:'Djamel Troudi',from:'Belouizdad',to:'Bab El Oued',dist:6.1,price:520,type:'Confort',status:'completed',date:'20/06/2025 15:20'},
  {id:'TR-1274',pax:'Nadia Brahimi',drv:'Mohamed Issa',from:'Oued Smar',to:'Alger Centre',dist:11.7,price:850,type:'Économique',status:'completed',date:'20/06/2025 14:05'},
  {id:'TR-1273',pax:'Yasmine Rezki',drv:'Hassan Belmahi',from:'El Biar',to:'Hussein Dey',dist:9.9,price:760,type:'Économique',status:'completed',date:'20/06/2025 13:22'},
  {id:'TR-1272',pax:'Omar Cherif',drv:'Younes Rezzig',from:'Kouba',to:'Bir Mourad Raïs',dist:5.2,price:440,type:'Économique',status:'completed',date:'20/06/2025 12:10'},
  {id:'TR-1271',pax:'Amira Haddad',drv:'Amina Rahhal',from:'Bab El Oued',to:'Alger Centre',dist:3.8,price:350,type:'She',status:'completed',date:'20/06/2025 11:45'},
  {id:'TR-1270',pax:'Sofiane Mekki',drv:'Djamel Troudi',from:'Alger Centre',to:'Ben Aknoun',dist:13.5,price:1050,type:'Confort',status:'completed',date:'20/06/2025 10:30'},
];

const SEC_EVENTS = [
  {type:'ok',icon:'fa-right-to-bracket',t:'Connexion réussie',s:'admin depuis 105.235.88.42 (Alger)',time:'10:24'},
  {type:'warn',icon:'fa-triangle-exclamation',t:'Tentative de connexion échouée',s:'Mot de passe incorrect · 105.235.12.77',time:'09:17'},
  {type:'err',icon:'fa-shield-halved',t:'Tentative de force brute détectée',s:'3 essais consécutifs · 41.111.56.9 (Oran)',time:'08:53'},
  {type:'info',icon:'fa-rotate-right',t:'Actualisation du token de session',s:'Session admin prolongée automatiquement',time:'08:00'},
  {type:'ok',icon:'fa-right-from-bracket',t:'Déconnexion propre',s:'admin · session terminée normalement',time:'Hier 23:41'},
  {type:'warn',icon:'fa-key',t:'Changement de mot de passe demandé',s:'Initialisé depuis le panneau paramètres',time:'Hier 18:02'},
  {type:'info',icon:'fa-database',t:'Sauvegarde automatique effectuée',s:'Base de données exportée · 2.4 MB',time:'Hier 03:00'},
];

const LOGIN_HISTORY = [
  {user:'admin',ip:'105.235.88.42',location:'Alger, DZ',browser:'Chrome 126',status:'success',date:'21/06/2025 10:24'},
  {user:'admin',ip:'105.235.12.77',location:'Alger, DZ',browser:'Firefox 127',status:'fail',date:'21/06/2025 09:17'},
  {user:'???',ip:'41.111.56.9',location:'Oran, DZ',browser:'—',status:'blocked',date:'21/06/2025 08:53'},
  {user:'admin',ip:'105.235.88.42',location:'Alger, DZ',browser:'Chrome 126',status:'success',date:'20/06/2025 23:41'},
  {user:'admin',ip:'105.235.88.42',location:'Alger, DZ',browser:'Chrome 126',status:'success',date:'20/06/2025 08:15'},
];

const PENDING_DOCS = [
  {
    id:'doc001', name:'Riadh Khelifi', nameAr:'رياض خليفي',
    phone:'+213 555 110 220', vehicle:'Toyota Yaris 2021', plate:'987 ALG 16',
    type:'Économique', submitted:'21/06/2025 08:14', status:'pending',
    docs:[
      {label:'Permis de conduire', icon:'fa-id-card',      color:'#4FA0E0', file:'permis_khelifi.jpg',      date:'21/06 08:12'},
      {label:'Carte grise',        icon:'fa-file-lines',   color:'#2DD4BF', file:'carte_grise_khelifi.jpg', date:'21/06 08:12'},
      {label:'Véhicule — avant',   icon:'fa-car',          color:'#A855F7', file:'vehicle_f_khelifi.jpg',   date:'21/06 08:13'},
      {label:'Véhicule — arrière', icon:'fa-car-rear',     color:'#F59842', file:'vehicle_r_khelifi.jpg',   date:'21/06 08:13'},
    ]
  },
  {
    id:'doc002', name:'Lynda Oussedik', nameAr:'ليندة أوسيديك',
    phone:'+213 555 220 330', vehicle:'Dacia Sandero 2022', plate:'456 TIP 16',
    type:'She', submitted:'21/06/2025 09:33', status:'pending',
    docs:[
      {label:'Permis de conduire', icon:'fa-id-card',      color:'#4FA0E0', file:'permis_oussedik.jpg',      date:'21/06 09:31'},
      {label:'Carte grise',        icon:'fa-file-lines',   color:'#2DD4BF', file:'carte_grise_oussedik.jpg', date:'21/06 09:31'},
      {label:'Véhicule — avant',   icon:'fa-car',          color:'#A855F7', file:'vehicle_f_oussedik.jpg',   date:'21/06 09:32'},
      {label:'Véhicule — arrière', icon:'fa-car-rear',     color:'#F59842', file:'vehicle_r_oussedik.jpg',   date:'21/06 09:32'},
    ]
  },
  {
    id:'doc003', name:'Bilal Messaoudi', nameAr:'بلال مسعودي',
    phone:'+213 555 330 440', vehicle:'Hyundai Accent 2020', plate:'123 MED 25',
    type:'Confort', submitted:'21/06/2025 11:05', status:'pending',
    docs:[
      {label:'Permis de conduire', icon:'fa-id-card',      color:'#4FA0E0', file:'permis_messaoudi.jpg',      date:'21/06 11:04'},
      {label:'Carte grise',        icon:'fa-file-lines',   color:'#2DD4BF', file:'carte_grise_messaoudi.jpg', date:'21/06 11:04'},
      {label:'Véhicule — avant',   icon:'fa-car',          color:'#A855F7', file:'vehicle_f_messaoudi.jpg',   date:'21/06 11:05'},
      {label:'Véhicule — arrière', icon:'fa-car-rear',     color:'#F59842', file:'vehicle_r_messaoudi.jpg',   date:'21/06 11:05'},
    ]
  },
  {
    id:'doc004', name:'Samir Zouaoui', nameAr:'سمير زواوي',
    phone:'+213 555 440 550', vehicle:'Peugeot 301 2021', plate:'789 ORN 31',
    type:'Économique', submitted:'20/06/2025 14:22', status:'approved',
    docs:[
      {label:'Permis de conduire', icon:'fa-id-card',      color:'#4FA0E0', file:'permis_zouaoui.jpg',      date:'20/06 14:20'},
      {label:'Carte grise',        icon:'fa-file-lines',   color:'#2DD4BF', file:'carte_grise_zouaoui.jpg', date:'20/06 14:20'},
      {label:'Véhicule — avant',   icon:'fa-car',          color:'#A855F7', file:'vehicle_f_zouaoui.jpg',   date:'20/06 14:21'},
      {label:'Véhicule — arrière', icon:'fa-car-rear',     color:'#F59842', file:'vehicle_r_zouaoui.jpg',   date:'20/06 14:21'},
    ]
  },
  {
    id:'doc005', name:'Farida Bouhired', nameAr:'فريدة بوحيرد',
    phone:'+213 555 550 660', vehicle:'Renault Symbol 2019', plate:'321 ANN 06',
    type:'She', submitted:'20/06/2025 16:48', status:'rejected',
    rejectReason:'Carte grise illisible. Veuillez soumettre une photo de meilleure qualité.',
    docs:[
      {label:'Permis de conduire', icon:'fa-id-card',      color:'#4FA0E0', file:'permis_bouhired.jpg',      date:'20/06 16:46'},
      {label:'Carte grise',        icon:'fa-file-lines',   color:'#2DD4BF', file:'carte_grise_bouhired.jpg', date:'20/06 16:46'},
      {label:'Véhicule — avant',   icon:'fa-car',          color:'#A855F7', file:'vehicle_f_bouhired.jpg',   date:'20/06 16:47'},
      {label:'Véhicule — arrière', icon:'fa-car-rear',     color:'#F59842', file:'vehicle_r_bouhired.jpg',   date:'20/06 16:47'},
    ]
  },
];

let FINANCE_TXN = [
  {id:'TXN-8841',trip:'TR-1284',pax:'Karim Bouzid',drv:'Djamel Troudi',total:1500,commission:180,reversement:1320,method:'CIB',date:'21/06 10:26'},
  {id:'TXN-8840',trip:'TR-1283',pax:'Nadia Brahimi',drv:'Mohamed Issa',total:620,commission:74,reversement:546,method:'Edahabia',date:'21/06 10:13'},
  {id:'TXN-8839',trip:'TR-1282',pax:'Yasmine Rezki',drv:'Amina Rahhal',total:890,commission:107,reversement:783,method:'Espèces',date:'21/06 10:01'},
  {id:'TXN-8838',trip:'TR-1279',pax:'Mourad Benali',drv:'Mohamed Issa',total:480,commission:58,reversement:422,method:'Edahabia',date:'21/06 09:17'},
  {id:'TXN-8837',trip:'TR-1278',pax:'Karim Bouzid',drv:'Hassan Belmahi',total:1200,commission:144,reversement:1056,method:'CIB',date:'20/06 18:46'},
  {id:'TXN-8836',trip:'TR-1277',pax:'Sara Boudiaf',drv:'Younes Rezzig',total:1800,commission:216,reversement:1584,method:'Espèces',date:'20/06 17:32'},
];

/* ═══════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════ */
let attempts = 0;
let locked = false;
let lockTimer = null;
const MAX_ATT = 5;
const LOCK_TIME = 300;

function doLogin() {
  if (locked) { showError('Compte verrouillé. Réessayez dans quelques minutes.'); return; }
  const u = document.getElementById('inp-user').value.trim();
  const p = document.getElementById('inp-pass').value;
  if (u.toLowerCase() === 'admin' && p === 'WinRak2025') {
    loginSuccess();
  } else {
    attempts++;
    const rem = MAX_ATT - attempts;
    if (rem <= 0) { lockAccount(); return; }
    showError('Identifiants incorrects. ' + rem + ' tentative' + (rem > 1 ? 's' : '') + ' restante' + (rem > 1 ? 's' : '') + '.');
    document.getElementById('attempt-bar').style.display = 'block';
    document.getElementById('attempt-label').textContent = 'Tentative ' + attempts + '/' + MAX_ATT;
    document.getElementById('attempt-fill').style.width = (attempts / MAX_ATT * 100) + '%';
    logEvent('err', 'fa-triangle-exclamation', 'Tentative échouée', 'Mot de passe incorrect · ' + (_realIp || '—'), now());
  }
}

function lockAccount() {
  locked = true;
  document.getElementById('btn-login').disabled = true;
  showError('Compte verrouillé après 5 échecs. Réessayez dans 5 minutes.');
  document.getElementById('attempt-fill').style.width = '100%';
  logEvent('err', 'fa-shield-halved', 'Compte verrouillé', 'Trop de tentatives · ' + (_realIp || '—'), now());
  lockTimer = setTimeout(function () {
    locked = false; attempts = 0;
    document.getElementById('btn-login').disabled = false;
    document.getElementById('attempt-bar').style.display = 'none';
    hideError();
  }, LOCK_TIME * 1000);
}

function loginSuccess() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('app').classList.add('show');
  detectIp();
  initDashboard();
  startSession();
  loadRealData();
  var loginTime = new Date().toLocaleString('fr-FR');
  // Update last-login display once IP is resolved (give detectIp ~1s)
  setTimeout(function () {
    var ip = _realIp || '—';
    document.getElementById('last-login').textContent = loginTime + ' · ' + ip;
    logEvent('ok', 'fa-right-to-bracket', 'Connexion réussie', 'admin depuis ' + ip + ' (Algérie)', now());
  }, 1200);
}

function showError(msg) {
  var el = document.getElementById('login-error');
  document.getElementById('login-error-msg').textContent = msg;
  el.classList.add('show');
}
function hideError() { document.getElementById('login-error').classList.remove('show'); }

/* ═══════════════════════════════════════════════
   SESSION TIMER
═══════════════════════════════════════════════ */
var sessionSec = 30 * 60;
var sessInterval;

function startSession() {
  sessInterval = setInterval(function () {
    sessionSec--;
    var m = Math.floor(sessionSec / 60);
    var s = sessionSec % 60;
    document.getElementById('session-time').textContent = pad(m) + ':' + pad(s);
    if (sessionSec === 300) {
      document.getElementById('sess-warn').classList.add('show');
      document.getElementById('warn-time').textContent = '5 min';
    }
    if (sessionSec === 0) { confirmLogout(); }
  }, 1000);
}

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function refreshSession() {
  sessionSec = 30 * 60;
  document.getElementById('sess-warn').classList.remove('show');
  showToast('Session prolongée de 30 minutes');
  logEvent('info', 'fa-rotate-right', 'Session prolongée', 'admin · session renouvelée', now());
}

/* ═══════════════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════════════ */
var TITLES = {
  dashboard: 'Tableau de bord', map: 'Carte en direct',
  passengers: 'Passagers', drivers: 'Chauffeurs',
  trips: 'Historique des trajets', dispatch: 'Répartition en direct', docs: 'Vérification des Documents',
  finance: 'Gestion Financière', pricing: 'التسعير — Tarification',
  security: 'Cyber-Sécurité', settings: 'Paramètres'
};
function nav(id) {
  document.querySelectorAll('.nav-item').forEach(function (el) {
    el.classList.toggle('active', el.dataset.sec === id);
  });
  document.querySelectorAll('.sec').forEach(function (el) {
    el.classList.toggle('active', el.id === 'sec-' + id);
  });
  document.getElementById('topbar-title').textContent = TITLES[id] || id;
  if (id === 'map')      { setTimeout(initMap, 100); }
  if (id === 'pricing')  { loadPricingSection(); }
  if (id === 'security') { loadSecuritySection(); }
  if (id === 'dispatch') { loadDispatchSection(); }
}

/* ═══════════════════════════════════════════════
   LOGOUT
═══════════════════════════════════════════════ */
function doLogout() { document.getElementById('modal-overlay').classList.add('show'); }
function closeModal() { document.getElementById('modal-overlay').classList.remove('show'); }
function confirmLogout() {
  logEvent('ok', 'fa-right-from-bracket', 'Déconnexion', 'admin · session terminée', now());
  clearInterval(sessInterval);
  document.getElementById('app').classList.remove('show');
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('inp-pass').value = '';
  sessionSec = 30 * 60;
  closeModal();
}

/* ═══════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════ */
var toastTimer;
function showToast(msg, type) {
  type = type || 'ok';
  var el = document.getElementById('toast');
  var icon = document.getElementById('toast-icon');
  document.getElementById('toast-msg').textContent = msg;
  icon.className = type === 'err' ? 'fa fa-circle-xmark' : 'fa fa-circle-check';
  icon.style.color = type === 'err' ? 'var(--danger)' : 'var(--success)';
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3000);
}

/* ═══════════════════════════════════════════════
   CHARTS
═══════════════════════════════════════════════ */

// Chart instance refs — needed to update data after Supabase responds
var _chartTrips, _chartTypes, _chartRev, _chartMonthly, _chartVtype;

function initDashboard() {
  renderDateHeader();
  _chartTrips   = initTripsChart();
  _chartTypes   = initTypesChart();
  _chartRev     = initRevChart();
  _chartMonthly = initMonthlyChart();
  _chartVtype   = initVTypeChart();
  renderRecentTable();
  renderDriverCards();
  renderKpiExtra();
  renderAlerts();
  renderPaxTable();
  renderDrvTable();
  renderTripsTable();
  renderFinanceTable();
  renderDocsSection();
  renderEvLog();
  renderSessLog();
  renderLoginHistory();
}

/* ─── Apply real KPIs from dash_kpis() ─────────────────────────────────── */
function fmt(n) {
  return Math.round(n || 0).toLocaleString('fr');
}

function applyKpis(kpi) {
  if (!kpi) return;

  // Main dashboard KPIs
  var el = function (id) { return document.getElementById(id); };
  if (el('k-trips'))   el('k-trips').textContent   = fmt(kpi.trips_this_month);
  if (el('k-drivers')) el('k-drivers').textContent = fmt(kpi.drivers_online);
  if (el('k-rev'))     el('k-rev').textContent     = fmt(kpi.revenue_today);
  if (el('k-rating'))  el('k-rating').textContent  = kpi.avg_rating || '—';

  // Badge docs pending
  if (el('badge-docs')) el('badge-docs').textContent = kpi.docs_pending || '';

  // Finance KPIs
  if (el('k-fin-ca'))          el('k-fin-ca').textContent          = fmt(kpi.revenue_this_month);
  if (el('k-fin-commission'))  el('k-fin-commission').textContent  = fmt(kpi.commission_this_month);
  if (el('k-fin-reversement')) el('k-fin-reversement').textContent = fmt(kpi.driver_earnings_this_month);
}

/* ─── Update Chart.js instances with real data ──────────────────────────── */
function updateCharts(kpi) {
  if (!kpi) return;

  // Trips 7d line chart
  if (_chartTrips && Array.isArray(kpi.trips_7d) && kpi.trips_7d.length) {
    _chartTrips.data.labels                  = kpi.trips_7d.map(function (d) { return d.day; });
    _chartTrips.data.datasets[0].data        = kpi.trips_7d.map(function (d) { return d.total; });
    _chartTrips.data.datasets[1].data        = kpi.trips_7d.map(function (d) { return d.completed; });
    _chartTrips.data.datasets[2].data        = kpi.trips_7d.map(function (d) { return d.cancelled; });
    _chartTrips.update();
  }

  // Revenue 7d bar chart
  if (_chartRev && Array.isArray(kpi.revenue_7d) && kpi.revenue_7d.length) {
    _chartRev.data.labels            = kpi.revenue_7d.map(function (d) { return d.day; });
    _chartRev.data.datasets[0].data  = kpi.revenue_7d.map(function (d) { return d.revenue; });
    _chartRev.update();
  }

  // Types doughnut (main dashboard)
  if (_chartTypes && kpi.trips_by_type && Object.keys(kpi.trips_by_type).length) {
    var typeMap = { ride: 'Économique', confort: 'Confort', women: 'She', intercites: 'Intercités', delivery: 'Livraison', medicine: 'Médecine', food: 'Restauration' };
    var typeColors = { ride: '#4FA0E0', confort: '#F5C842', women: '#A855F7', intercites: '#2DD4BF', delivery: '#3DB87A', medicine: '#E05555', food: '#F59842' };
    var keys   = Object.keys(kpi.trips_by_type);
    _chartTypes.data.labels              = keys.map(function (k) { return typeMap[k] || k; });
    _chartTypes.data.datasets[0].data   = keys.map(function (k) { return kpi.trips_by_type[k]; });
    _chartTypes.data.datasets[0].backgroundColor = keys.map(function (k) { return typeColors[k] || '#888'; });
    _chartTypes.update();
  }

  // Same types doughnut in Finance section
  if (_chartVtype && kpi.trips_by_type && Object.keys(kpi.trips_by_type).length) {
    var typeMap2 = { ride: 'Économique', confort: 'Confort', women: 'She', intercites: 'Intercités', delivery: 'Livraison', medicine: 'Médecine', food: 'Restauration' };
    var typeColors2 = { ride: '#4FA0E0', confort: '#F5C842', women: '#A855F7', intercites: '#2DD4BF', delivery: '#3DB87A', medicine: '#E05555', food: '#F59842' };
    var keys2   = Object.keys(kpi.trips_by_type);
    _chartVtype.data.labels              = keys2.map(function (k) { return typeMap2[k] || k; });
    _chartVtype.data.datasets[0].data   = keys2.map(function (k) { return kpi.trips_by_type[k]; });
    _chartVtype.data.datasets[0].backgroundColor = keys2.map(function (k) { return typeColors2[k] || '#888'; });
    _chartVtype.update();
  }

  // Monthly revenue (Finance section)
  if (_chartMonthly && Array.isArray(kpi.revenue_monthly) && kpi.revenue_monthly.length) {
    _chartMonthly.data.labels             = kpi.revenue_monthly.map(function (d) { return d.month; });
    _chartMonthly.data.datasets[0].data   = kpi.revenue_monthly.map(function (d) { return d.revenue; });
    _chartMonthly.update();
  }
}

function renderDateHeader() {
  var d = new Date();
  document.getElementById('dash-date').textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

var DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function initTripsChart() {
  return new Chart(document.getElementById('chart-trips'), {
    type: 'line',
    data: {
      labels: DAYS,
      datasets: [
        { label: 'Trajets', data: [182, 165, 198, 211, 178, 224, 206], borderColor: '#F5C842', backgroundColor: 'rgba(245,200,66,.08)', fill: true, tension: .4, pointRadius: 3, pointBackgroundColor: '#F5C842' },
        { label: 'Complétés', data: [170, 155, 185, 198, 167, 210, 195], borderColor: '#3DB87A', backgroundColor: 'transparent', tension: .4, pointRadius: 3, pointBackgroundColor: '#3DB87A' },
        { label: 'Annulés', data: [12, 10, 13, 13, 11, 14, 11], borderColor: '#E05555', backgroundColor: 'transparent', tension: .4, pointRadius: 3, pointBackgroundColor: '#E05555' },
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.04)' } } } }
  });
}

function initTypesChart() {
  return new Chart(document.getElementById('chart-types'), {
    type: 'doughnut',
    data: {
      labels: ['Économique', 'Confort', 'She', 'Intercités'],
      datasets: [{ data: [52, 28, 12, 8], backgroundColor: ['#4FA0E0', '#F5C842', '#A855F7', '#2DD4BF'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', color: '#6b7591' } } } }
  });
}

function initRevChart() {
  return new Chart(document.getElementById('chart-rev'), {
    type: 'bar',
    data: {
      labels: DAYS,
      datasets: [{ label: 'Revenus (DZD)', data: [72400, 68200, 81500, 87500, 75300, 94200, 83700], backgroundColor: 'rgba(245,200,66,.2)', borderColor: '#F5C842', borderWidth: 1.5, borderRadius: 5, hoverBackgroundColor: 'rgba(245,200,66,.35)' }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: function (v) { return v.toLocaleString('fr'); } } } } }
  });
}

function initMonthlyChart() {
  var months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'];
  return new Chart(document.getElementById('chart-monthly'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [{ label: 'Revenus', data: [1840000, 2150000, 2320000, 2480000, 2690000, 2847500], borderColor: '#F5C842', backgroundColor: 'rgba(245,200,66,.07)', fill: true, tension: .4, pointRadius: 4, pointBackgroundColor: '#F5C842' }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { callback: function (v) { return (v / 1000000).toFixed(1) + 'M'; } } } } }
  });
}

function initVTypeChart() {
  return new Chart(document.getElementById('chart-vtype'), {
    type: 'doughnut',
    data: {
      labels: ['Économique', 'Confort', 'She', 'Intercités'],
      datasets: [{ data: [45, 28, 12, 15], backgroundColor: ['#4FA0E0', '#F5C842', '#A855F7', '#2DD4BF'], borderWidth: 0, hoverOffset: 6 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { padding: 14, usePointStyle: true, pointStyle: 'circle', color: '#6b7591', font: { size: 12 } } } } }
  });
}

/* ═══════════════════════════════════════════════
   RECENT TRIPS
═══════════════════════════════════════════════ */
function renderRecentTable() {
  var t = document.getElementById('tbl-recent');
  var rows = TRIPS.slice(0, 5).map(function (r) {
    return '<tr><td><span class="text-gold fw7">' + r.id + '</span><br><span class="text-muted" style="font-size:11px">' + r.date.split(' ')[1] + '</span></td><td>' + r.pax.split(' ')[0] + '</td><td>' + r.to + '</td><td class="fw7">' + r.price.toLocaleString('fr') + ' DZD</td><td>' + statusBadge(r.status) + '</td></tr>';
  }).join('');
  t.innerHTML = '<thead><tr><th>ID</th><th>Passager</th><th>Destination</th><th>Prix</th><th>Statut</th></tr></thead><tbody>' + rows + '</tbody>';
}

/* ═══════════════════════════════════════════════
   DRIVER CARDS
═══════════════════════════════════════════════ */
function renderDriverCards() {
  var online = DRIVERS.filter(function (d) { return d.status !== 'offline'; });
  document.getElementById('driver-cards').innerHTML = online.map(function (d) {
    return '<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)"><div class="av" style="background:' + drvColor(d.status) + '">' + d.name.charAt(0) + '</div><div style="flex:1"><div style="font-size:13px;font-weight:600;color:var(--text)">' + d.name + '</div><div style="font-size:11px;color:var(--text-muted)">' + d.vehicle + ' · ' + d.plate + '</div></div>' + drvStatusBadge(d.status) + '</div>';
  }).join('');
}
function drvColor(s) { return s === 'online' ? 'var(--success-dim)' : s === 'on_trip' ? 'var(--blue-dim)' : 'var(--surface3)'; }

/* ═══════════════════════════════════════════════
   KPI EXTRA
═══════════════════════════════════════════════ */
function renderKpiExtra() {
  var items = [
    { l: 'Taux de complétion', v: '93.2%', pct: 93, c: 'var(--success)' },
    { l: "Taux d'annulation", v: '5.2%', pct: 5, c: 'var(--danger)' },
    { l: 'Distance moy. / trajet', v: '10.8 km', pct: 55, c: 'var(--blue)' },
    { l: 'Durée moy. / trajet', v: '18 min', pct: 45, c: 'var(--gold)' },
    { l: 'Revenus / chauffeur / jour', v: '3 800 DZD', pct: 72, c: 'var(--teal)' },
  ];
  document.getElementById('kpi-extra').innerHTML = items.map(function (i) {
    return '<div style="padding:8px 0;border-bottom:1px solid var(--border)"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:12px;color:var(--text-muted)">' + i.l + '</span><span style="font-size:13px;font-weight:700;color:var(--text)">' + i.v + '</span></div><div class="pbar"><div class="pfill" style="width:' + i.pct + '%;background:' + i.c + '"></div></div></div>';
  }).join('');
}

/* ═══════════════════════════════════════════════
   ALERTS
═══════════════════════════════════════════════ */
var _alerts = [
  { icon: 'fa-triangle-exclamation', c: 'var(--orange)', t: '3 chauffeurs en attente de validation', s: 'Documents à vérifier' },
  { icon: 'fa-shield-halved', c: 'var(--danger)', t: 'Tentative de connexion suspecte', s: 'IP: 41.111.56.9 (Oran)' },
  { icon: 'fa-star', c: 'var(--gold)', t: 'Note moyenne en hausse', s: '+0.1 point cette semaine' },
];
function renderAlerts() {
  document.getElementById('alerts-list').innerHTML = _alerts.map(function (a) {
    return '<div style="display:flex;align-items:flex-start;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)"><div style="width:30px;height:30px;border-radius:8px;background:' + a.c + '22;display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa ' + a.icon + '" style="color:' + a.c + ';font-size:12px"></i></div><div><div style="font-size:12px;font-weight:600;color:var(--text)">' + a.t + '</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + a.s + '</div></div></div>';
  }).join('');
}

/* ═══════════════════════════════════════════════
   PASSENGERS TABLE
═══════════════════════════════════════════════ */
var paxPage = 1;
var PAX_PER = 8;
function renderPaxTable() {
  var data = PASSENGERS.slice();
  var q = document.getElementById('pax-search').value.toLowerCase();
  var f = document.getElementById('pax-filter').value;
  if (q) data = data.filter(function (d) { return d.name.toLowerCase().indexOf(q) >= 0 || d.phone.indexOf(q) >= 0; });
  if (f) data = data.filter(function (d) { return d.status === f; });
  var total = data.length;
  var start = (paxPage - 1) * PAX_PER;
  var page = data.slice(start, start + PAX_PER);
  var rows = page.map(function (p) {
    var starsHtml = '';
    for (var i = 0; i < Math.round(p.rating); i++) starsHtml += '★';
    var badge = p.status === 'active'
      ? '<span class="badge b-online"><span class="badge-dot"></span>Actif</span>'
      : '<span class="badge b-offline"><span class="badge-dot"></span>Inactif</span>';
    return '<tr><td><div class="td-name"><div class="av" style="background:var(--blue-dim);color:var(--blue)">' + p.name.charAt(0) + '</div><div><div class="av-name">' + p.name + '</div><div class="av-sub">' + p.nameAr + '</div></div></div></td><td>' + p.phone + '</td><td class="fw7">' + p.trips + '</td><td><span class="stars">' + starsHtml + '</span> <span style="font-size:12px;color:var(--text-muted)">' + p.rating + '</span></td><td class="fw7">' + p.spent.toLocaleString('fr') + ' DZD</td><td>' + p.joined + '</td><td>' + badge + '</td><td><button class="act-btn" title="Voir"><i class="fa fa-eye"></i></button> <button class="act-btn grn" title="Message"><i class="fa fa-comment"></i></button> <button class="act-btn red" title="Suspendre"><i class="fa fa-ban"></i></button></td></tr>';
  }).join('');
  document.getElementById('tbl-pax').innerHTML = '<thead><tr><th>Passager</th><th>Téléphone</th><th>Trajets</th><th>Note</th><th>Dépensé</th><th>Inscrit le</th><th>Statut</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody>';
  renderPager('pax-pager', total, PAX_PER, paxPage, function (p) { paxPage = p; renderPaxTable(); });
}

/* ═══════════════════════════════════════════════
   DRIVERS TABLE
═══════════════════════════════════════════════ */
var drvPage = 1;
var DRV_PER = 8;
function renderDrvTable() {
  var data = DRIVERS.slice();
  var q = document.getElementById('drv-search').value.toLowerCase();
  var f = document.getElementById('drv-filter').value;
  if (q) data = data.filter(function (d) { return d.name.toLowerCase().indexOf(q) >= 0 || d.vehicle.toLowerCase().indexOf(q) >= 0; });
  if (f) data = data.filter(function (d) { return d.status === f; });
  var total = data.length;
  var page = data.slice((drvPage - 1) * DRV_PER, drvPage * DRV_PER);
  var rows = page.map(function (d) {
    var starsHtml = '';
    for (var i = 0; i < Math.round(d.rating); i++) starsHtml += '★';
    return '<tr><td><div class="td-name"><div class="av" style="background:var(--success-dim);color:var(--success)">' + d.name.charAt(0) + '</div><div><div class="av-name">' + d.name + '</div><div class="av-sub">' + d.nameAr + '</div></div></div></td><td>' + d.phone + '</td><td><div style="display:flex;align-items:center;gap:8px"><i class="fa fa-car" style="color:var(--text-faint);font-size:12px"></i>' + d.vehicle + '</div><div style="font-size:11px;color:var(--text-muted);margin-top:2px">' + d.plate + '</div></td><td><span class="badge b-' + (d.type === 'She' ? 'she' : 'trip') + '" style="font-size:10px">' + d.type + '</span></td><td class="fw7">' + d.trips + '</td><td><span class="stars">' + starsHtml + '</span> <span style="font-size:12px;color:var(--text-muted)">' + d.rating + '</span></td><td class="fw7 text-gold">' + d.earnings.toLocaleString('fr') + ' DZD</td><td>' + drvStatusBadge(d.status) + '</td><td><button class="act-btn" title="Profil"><i class="fa fa-eye"></i></button> <button class="act-btn grn" title="Appeler"><i class="fa fa-phone"></i></button> <button class="act-btn red" title="Suspendre"><i class="fa fa-ban"></i></button></td></tr>';
  }).join('');
  document.getElementById('tbl-drv').innerHTML = '<thead><tr><th>Chauffeur</th><th>Téléphone</th><th>Véhicule</th><th>Type</th><th>Trajets</th><th>Note</th><th>Gains</th><th>Statut</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody>';
  renderPager('drv-pager', total, DRV_PER, drvPage, function (p) { drvPage = p; renderDrvTable(); });
}

/* ═══════════════════════════════════════════════
   TRIPS TABLE
═══════════════════════════════════════════════ */
var tripPage = 1;
var TRIP_PER = 8;
function renderTripsTable() {
  var data = TRIPS.slice();
  var q = document.getElementById('trip-search').value.toLowerCase();
  var f = document.getElementById('trip-filter').value;
  var ty = document.getElementById('trip-type').value;
  if (q) data = data.filter(function (d) { return d.id.toLowerCase().indexOf(q) >= 0 || d.pax.toLowerCase().indexOf(q) >= 0 || d.drv.toLowerCase().indexOf(q) >= 0; });
  if (f) data = data.filter(function (d) { return d.status === f; });
  if (ty) data = data.filter(function (d) { return d.type === ty; });
  var total = data.length;
  var page = data.slice((tripPage - 1) * TRIP_PER, tripPage * TRIP_PER);
  var rows = page.map(function (t) {
    var stop = t.status === 'active' ? '<button class="act-btn red" title="Arrêter"><i class="fa fa-stop"></i></button>' : '';
    return '<tr><td><span class="text-gold fw7">' + t.id + '</span></td><td>' + t.pax + '</td><td>' + t.drv + '</td><td style="max-width:120px;overflow:hidden;text-overflow:ellipsis">' + t.from + ' → ' + t.to + '</td><td>' + t.dist + ' km</td><td class="fw7">' + t.price.toLocaleString('fr') + ' DZD</td><td><span class="badge b-' + (t.type === 'She' ? 'she' : 'trip') + '" style="font-size:10px">' + t.type + '</span></td><td>' + statusBadge(t.status) + '</td><td style="color:var(--text-muted)">' + t.date + '</td><td><button class="act-btn" title="Détails"><i class="fa fa-eye"></i></button> ' + stop + '</td></tr>';
  }).join('');
  document.getElementById('tbl-trips').innerHTML = '<thead><tr><th>ID</th><th>Passager</th><th>Chauffeur</th><th>Trajet</th><th>Dist.</th><th>Prix</th><th>Type</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody>';
  renderPager('trip-pager', total, TRIP_PER, tripPage, function (p) { tripPage = p; renderTripsTable(); });
}

/* ═══════════════════════════════════════════════
   FINANCE TABLE
═══════════════════════════════════════════════ */
function renderFinanceTable() {
  var rows = FINANCE_TXN.map(function (t) {
    return '<tr><td><span class="text-gold fw7">' + t.id + '</span></td><td>' + t.trip + '</td><td>' + t.pax + '</td><td>' + t.drv + '</td><td class="fw7">' + t.total.toLocaleString('fr') + ' DZD</td><td class="text-danger">' + t.commission.toLocaleString('fr') + ' DZD</td><td class="text-success fw7">' + t.reversement.toLocaleString('fr') + ' DZD</td><td><span class="pill">' + t.method + '</span></td><td style="color:var(--text-muted)">' + t.date + '</td></tr>';
  }).join('');
  document.getElementById('tbl-finance').innerHTML = '<thead><tr><th>TXN</th><th>Trajet</th><th>Passager</th><th>Chauffeur</th><th>Total</th><th>Commission</th><th>Reversement</th><th>Méthode</th><th>Date</th></tr></thead><tbody>' + rows + '</tbody>';
}

/* ═══════════════════════════════════════════════
   DISPATCH EN DIRECT
═══════════════════════════════════════════════ */

var _dispatchRefreshTimer = null;

async function loadDispatchSection() {
  // Stop any previous auto-refresh
  if (_dispatchRefreshTimer) { clearInterval(_dispatchRefreshTimer); _dispatchRefreshTimer = null; }

  await _renderDispatch();

  // Auto-refresh every 15 s while the section is open
  _dispatchRefreshTimer = setInterval(function () {
    var active = document.querySelector('.sec.active');
    if (!active || active.id !== 'sec-dispatch') {
      clearInterval(_dispatchRefreshTimer);
      _dispatchRefreshTimer = null;
      return;
    }
    _renderDispatch();
  }, 15000);
}

async function _renderDispatch() {
  var timeEl = document.getElementById('k-disp-time');
  if (timeEl) timeEl.textContent = 'Chargement…';

  var data = { offers: [], active: [] };
  try {
    data = await fetchDispatch();
  } catch (e) {
    console.warn('[Dispatch] fetch error', e);
  }

  var offers = data.offers || [];
  var active = data.active || [];

  // KPIs
  var kPend = document.getElementById('k-disp-pending');
  var kAct  = document.getElementById('k-disp-active');
  if (kPend) kPend.textContent = offers.length;
  if (kAct)  kAct.textContent  = active.length;

  // Badge nav
  var badge = document.getElementById('badge-dispatch');
  if (badge) {
    var total = offers.length + active.length;
    badge.textContent = total;
    badge.style.display = total > 0 ? '' : 'none';
  }

  // Timestamp
  if (timeEl) timeEl.textContent = 'Mis à jour ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Tableau offres
  var offersEl  = document.getElementById('tbl-dispatch-offers');
  var offersEmp = document.getElementById('disp-offers-empty');
  if (offersEl) {
    if (offers.length === 0) {
      offersEl.innerHTML = '';
      if (offersEmp) offersEmp.style.display = '';
    } else {
      if (offersEmp) offersEmp.style.display = 'none';
      var oRows = offers.map(function (o) {
        var age = Math.round((Date.now() - new Date(o.offered_at).getTime()) / 1000);
        var ageStr = age < 60 ? age + 's' : Math.round(age / 60) + ' min';
        return '<tr>' +
          '<td class="fw7">' + (o.trip_code || o.trip_id.slice(0, 8)) + '</td>' +
          '<td>' + (o.passenger_name || '—') + '</td>' +
          '<td>' + (o.driver_name || '—') + '</td>' +
          '<td style="font-size:11px;color:var(--text-muted)">' + (o.from_address || '').slice(0, 30) + '…</td>' +
          '<td>' + Math.round(o.price || 0).toLocaleString('fr') + ' DA</td>' +
          '<td><span class="badge" style="background:var(--blue-dim);color:var(--blue)">Rang ' + (o.offer_rank || 1) + '</span></td>' +
          '<td style="color:var(--text-muted)">' + Math.round((o.distance_m || 0) / 1000 * 10) / 10 + ' km</td>' +
          '<td style="color:var(--gold)">' + ageStr + '</td>' +
        '</tr>';
      }).join('');
      offersEl.innerHTML = '<thead><tr><th>ID Course</th><th>Passager</th><th>Chauffeur proposé</th><th>Départ</th><th>Prix</th><th>Rang</th><th>Distance</th><th>Âge</th></tr></thead><tbody>' + oRows + '</tbody>';
    }
  }

  // Tableau courses actives
  var activeEl  = document.getElementById('tbl-dispatch-active');
  var activeEmp = document.getElementById('disp-active-empty');
  if (activeEl) {
    if (active.length === 0) {
      activeEl.innerHTML = '';
      if (activeEmp) activeEmp.style.display = '';
    } else {
      if (activeEmp) activeEmp.style.display = 'none';
      var aRows = active.map(function (t) {
        var statusBadge = t.status === 'in_progress'
          ? '<span class="badge b-trip"><span class="badge-dot"></span>En course</span>'
          : '<span class="badge b-online"><span class="badge-dot"></span>Acceptée</span>';
        var elapsed = t.started_at
          ? Math.round((Date.now() - new Date(t.started_at).getTime()) / 60000) + ' min'
          : '—';
        return '<tr>' +
          '<td class="fw7">' + (t.trip_code || t.trip_id.slice(0, 8)) + '</td>' +
          '<td>' + (t.passenger_name || '—') + '</td>' +
          '<td>' + (t.driver_name || '—') + '</td>' +
          '<td style="font-size:11px;color:var(--text-muted)">' + (t.to_address || '').slice(0, 30) + '…</td>' +
          '<td>' + Math.round(t.price || 0).toLocaleString('fr') + ' DA</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td style="color:var(--text-muted)">' + elapsed + '</td>' +
        '</tr>';
      }).join('');
      activeEl.innerHTML = '<thead><tr><th>ID Course</th><th>Passager</th><th>Chauffeur</th><th>Destination</th><th>Prix</th><th>Statut</th><th>Durée</th></tr></thead><tbody>' + aRows + '</tbody>';
    }
  }
}

/* ═══════════════════════════════════════════════
   SECURITY LOGS
═══════════════════════════════════════════════ */

var _evLog     = [];   // session-local events (always shown first)
var _realIp    = null; // fetched once on login
var _userAgent = navigator.userAgent;

// Detect real IP once — non-blocking
function detectIp() {
  fetch('https://api.ipify.org?format=json')
    .then(function (r) { return r.json(); })
    .then(function (d) { _realIp = d.ip; })
    .catch(function () { _realIp = null; });
}

// Detect browser name from UA
function browserName() {
  var ua = navigator.userAgent;
  if (ua.indexOf('Edg') > -1)    return 'Edge';
  if (ua.indexOf('Chrome') > -1) return 'Chrome';
  if (ua.indexOf('Firefox') > -1)return 'Firefox';
  if (ua.indexOf('Safari') > -1) return 'Safari';
  return 'Navigateur';
}

// logEvent : écrit en local + persisté dans Supabase
function logEvent(type, icon, t, s, time) {
  _evLog.unshift({ type: type, icon: icon, t: t, s: s, time: time });
  if (document.getElementById('ev-log')) renderEvLog();
  // Persist to Supabase (non-blocking)
  logSecurityEvent(type, icon, t, s, _realIp, _userAgent);
}

// Render event log : session events + real DB events
var _dbEvents = [];   // loaded from Supabase

function renderEvLog() {
  var el = document.getElementById('ev-log');
  if (!el) return;
  // Merge: session events first, then DB (deduplicated by title+time)
  var combined = _evLog.slice();
  _dbEvents.forEach(function (e) {
    combined.push({
      type: e.event_type,
      icon: e.icon,
      t:    e.title,
      s:    e.detail || '',
      time: new Date(e.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    });
  });
  var items = combined.slice(0, 12);
  if (items.length === 0) {
    el.innerHTML = '<div style="color:var(--text-muted);padding:16px;font-size:13px">Aucun événement enregistré</div>';
    return;
  }
  el.innerHTML = items.map(function (e) {
    var cls = e.type === 'ok' ? 'ok' : e.type === 'err' ? 'err' : e.type === 'warn' ? 'warn' : 'info';
    return '<div class="ev-row"><div class="ev-icon ' + cls + '"><i class="fa ' + e.icon + '"></i></div>' +
      '<div class="ev-text"><div class="t">' + e.t + '</div><div class="s">' + (e.s || '') + '</div></div>' +
      '<div class="ev-time">' + e.time + '</div></div>';
  }).join('');
}

// Render session info with real browser + IP
function renderSessLog() {
  var ip      = _realIp || '—';
  var browser = browserName();
  var el = document.getElementById('sess-log');
  if (!el) return;
  el.innerHTML = '<div class="ev-row">' +
    '<div class="ev-icon ok"><i class="fa fa-desktop"></i></div>' +
    '<div class="ev-text">' +
      '<div class="t">Session active — ' + browser + '</div>' +
      '<div class="s">' + ip + ' · Algérie · Maintenant</div>' +
    '</div>' +
    '<span class="badge b-online" style="flex-shrink:0"><span class="badge-dot"></span>Active</span>' +
  '</div>';
}

// Render login history from real DB events
function renderLoginHistory() {
  var el = document.getElementById('tbl-logins');
  if (!el) return;
  var loginEvents = _dbEvents.filter(function (e) {
    return e.title.indexOf('Connexion') > -1 || e.title.indexOf('Tentative') > -1 || e.title.indexOf('verrouillé') > -1;
  });
  if (loginEvents.length === 0) {
    // Fallback to static mock while DB is empty
    var rows = LOGIN_HISTORY.map(function (l) {
      return '<tr><td class="fw7">' + l.user + '</td><td>' + l.ip + '</td><td>' + l.location + '</td><td>' + l.browser + '</td><td>' + loginStatusBadge(l.status) + '</td><td style="color:var(--text-muted)">' + l.date + '</td></tr>';
    }).join('');
    el.innerHTML = '<thead><tr><th>Utilisateur</th><th>IP</th><th>Localisation</th><th>Navigateur</th><th>Résultat</th><th>Date</th></tr></thead><tbody>' + rows + '</tbody>';
    return;
  }
  var rows = loginEvents.slice(0, 20).map(function (e) {
    var isOk  = e.event_type === 'ok';
    var isErr = e.event_type === 'err';
    var status = isOk ? 'success' : isErr ? 'fail' : 'blocked';
    return '<tr>' +
      '<td class="fw7">admin</td>' +
      '<td>' + (e.ip_address || '—') + '</td>' +
      '<td>Algérie</td>' +
      '<td>' + browserName() + '</td>' +
      '<td>' + loginStatusBadge(status) + '</td>' +
      '<td style="color:var(--text-muted)">' + new Date(e.created_at).toLocaleString('fr-FR') + '</td>' +
    '</tr>';
  }).join('');
  el.innerHTML = '<thead><tr><th>Utilisateur</th><th>IP</th><th>Localisation</th><th>Navigateur</th><th>Résultat</th><th>Date</th></tr></thead><tbody>' + rows + '</tbody>';
}

// Load real events from Supabase when security section opens
async function loadSecuritySection() {
  try {
    var data = await fetchSecurityEvents(50);
    if (data && data.length > 0) {
      _dbEvents = data;
      renderEvLog();
      renderLoginHistory();
    }
  } catch (e) {
    console.warn('[Security] load error', e);
  }
}

/* ═══════════════════════════════════════════════
   MAP — Google Maps
═══════════════════════════════════════════════ */
var _gmap       = null;
var _gMarkers   = [];
var _mapFilter  = 'all';

var _DARK_STYLE = [
  { elementType: 'geometry',            stylers: [{ color: '#0e1119' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#07090f' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#6b7591' }] },
  { featureType: 'road',                elementType: 'geometry',        stylers: [{ color: '#1b1f2e' }] },
  { featureType: 'road',                elementType: 'geometry.stroke', stylers: [{ color: '#141720' }] },
  { featureType: 'road.highway',        elementType: 'geometry',        stylers: [{ color: '#222740' }] },
  { featureType: 'road.highway',        elementType: 'geometry.stroke', stylers: [{ color: '#1b1f2e' }] },
  { featureType: 'water',               elementType: 'geometry',        stylers: [{ color: '#07090f' }] },
  { featureType: 'poi',                 stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',             stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative',      elementType: 'geometry.stroke', stylers: [{ color: '#1b1f2e' }] },
];

function initMap() {
  if (_gmap) {
    if (typeof google !== 'undefined' && google.maps) google.maps.event.trigger(_gmap, 'resize');
    return;
  }
  if (typeof google === 'undefined' || !google.maps) {
    var tries = 0;
    var poll = setInterval(function () {
      tries++;
      if (typeof google !== 'undefined' && google.maps) { clearInterval(poll); _buildGoogleMap(); }
      if (tries > 60) clearInterval(poll);
    }, 100);
    return;
  }
  _buildGoogleMap();
}

function _buildGoogleMap() {
  var mapEl = document.getElementById('map-el');
  if (!mapEl || _gmap) return;

  _gmap = new google.maps.Map(mapEl, {
    center: { lat: 36.7538, lng: 3.0588 },
    zoom: 12,
    styles: _DARK_STYLE,
    mapTypeControl:    false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
  });

  updateMapKpis();
  mapRefresh();
}

function _markerSvg(letter, color) {
  var bg = color + '33';
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">' +
    '<circle cx="18" cy="18" r="17" fill="' + bg + '" stroke="' + color + '" stroke-width="2"/>' +
    '<text x="18" y="23" text-anchor="middle" font-family="Inter,sans-serif" font-size="13" font-weight="700" fill="' + color + '">' + letter + '</text>' +
    '</svg>'
  );
}

function _paxSvg() {
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">' +
    '<circle cx="15" cy="15" r="14" fill="#F5C84222" stroke="#F5C842" stroke-width="2"/>' +
    '<text x="15" y="20" text-anchor="middle" font-size="14">👤</text>' +
    '</svg>'
  );
}

function mapRefresh() {
  if (!_gmap) return;
  _gMarkers.forEach(function (m) { m.setMap(null); });
  _gMarkers = [];

  var colorMap = { online: '#3DB87A', on_trip: '#4FA0E0', offline: '#3a4260' };
  var drvData  = DRIVERS.map(function (d) {
    return { lat: d.lat, lng: d.lng, name: d.name, vehicle: d.vehicle, plate: d.plate, status: d.status, type: 'driver' };
  });

  drvData.forEach(function (d) {
    if (_mapFilter !== 'all' && _mapFilter !== 'drivers') return;
    var col  = colorMap[d.status] || '#888';
    var icon = { url: _markerSvg(d.name.charAt(0).toUpperCase(), col), scaledSize: new google.maps.Size(36, 36), anchor: new google.maps.Point(18, 18) };
    var info = '<div style="font-family:Inter,sans-serif;color:#dde2f0;min-width:160px">' +
      '<div style="font-weight:700;font-size:14px;margin-bottom:4px">' + d.name + '</div>' +
      '<div style="color:#6b7591;font-size:12px">' + d.vehicle + ' · ' + d.plate + '</div>' +
      '<div style="margin-top:6px;font-size:11px;color:' + col + '">' + (d.status === 'online' ? 'En ligne' : d.status === 'on_trip' ? 'En course' : 'Hors ligne') + '</div>' +
    '</div>';
    var iw = new google.maps.InfoWindow({ content: info });
    var mk = new google.maps.Marker({ position: { lat: d.lat, lng: d.lng }, map: _gmap, icon: icon, title: d.name });
    mk.addListener('click', function () { iw.open(_gmap, mk); });
    _gMarkers.push(mk);
  });

  if (_mapFilter === 'all' || _mapFilter === 'passengers') {
    [[36.762, 3.065], [36.748, 3.047]].forEach(function (c) {
      var icon = { url: _paxSvg(), scaledSize: new google.maps.Size(30, 30), anchor: new google.maps.Point(15, 15) };
      var mk   = new google.maps.Marker({ position: { lat: c[0], lng: c[1] }, map: _gmap, icon: icon, title: 'Passager' });
      _gMarkers.push(mk);
    });
  }

  if (_mapFilter === 'all') {
    var route = [
      { lat: 36.7538, lng: 3.0588 }, { lat: 36.7450, lng: 3.0650 },
      { lat: 36.7380, lng: 3.0720 }, { lat: 36.7300, lng: 3.0870 },
    ];
    var poly = new google.maps.Polyline({ path: route, geodesic: true, strokeColor: '#F5C842', strokeOpacity: 0.8, strokeWeight: 3, map: _gmap });
    _gMarkers.push(poly);
  }
}

function mapFilter(type) {
  _mapFilter = type || 'all';
  mapRefresh();
}

function updateMapKpis() {
  var online  = DRIVERS.filter(function (d) { return d.status === 'online'; }).length;
  var on_trip = DRIVERS.filter(function (d) { return d.status === 'on_trip'; }).length;
  var offline = DRIVERS.filter(function (d) { return d.status === 'offline'; }).length;
  var e1 = document.getElementById('map-kpi-online');
  var e2 = document.getElementById('map-kpi-trip');
  var e3 = document.getElementById('map-kpi-active');
  var e4 = document.getElementById('map-kpi-offline');
  if (e1) e1.textContent = online;
  if (e2) e2.textContent = on_trip;
  if (e3) e3.textContent = on_trip;
  if (e4) e4.textContent = offline;
}

function renderMapSidebar() { /* reserved for future real-time sidebar */ }

/* ═══════════════════════════════════════════════
   PAGER
═══════════════════════════════════════════════ */
function renderPager(id, total, perPage, cur, onPage) {
  var pages = Math.ceil(total / perPage);
  if (pages <= 1) { document.getElementById(id).innerHTML = ''; return; }
  var html = '<button class="page-btn" ' + (cur === 1 ? 'disabled' : '') + ' id="pg-prev-' + id + '"><i class="fa fa-chevron-left" style="font-size:10px"></i></button>';
  for (var i = 1; i <= pages; i++) {
    html += '<button class="page-btn ' + (i === cur ? 'cur' : '') + '" data-pg="' + i + '" data-tbl="' + id + '">' + i + '</button>';
  }
  html += '<button class="page-btn" ' + (cur === pages ? 'disabled' : '') + ' id="pg-next-' + id + '"><i class="fa fa-chevron-right" style="font-size:10px"></i></button>';
  var el = document.getElementById(id);
  el.innerHTML = html;
  el.querySelectorAll('[data-pg]').forEach(function (btn) {
    btn.addEventListener('click', function () { onPage(parseInt(btn.dataset.pg)); });
  });
  var prev = el.querySelector('#pg-prev-' + id);
  var next = el.querySelector('#pg-next-' + id);
  if (prev) prev.addEventListener('click', function () { if (cur > 1) onPage(cur - 1); });
  if (next) next.addEventListener('click', function () { if (cur < pages) onPage(cur + 1); });
}

/* ═══════════════════════════════════════════════
   DOCUMENT VERIFICATION
═══════════════════════════════════════════════ */
var _docsData = PENDING_DOCS.map(function (d) { return Object.assign({}, d); });
var _currentDocId = null;
var _rejectMode = false;

function renderDocsSection() {
  var q = (document.getElementById('docs-search') || {}).value || '';
  var f = (document.getElementById('docs-filter') || {}).value || '';
  var ty = (document.getElementById('docs-type') || {}).value || '';
  q = q.toLowerCase();

  var data = _docsData.filter(function (d) {
    var matchQ = !q || d.name.toLowerCase().indexOf(q) >= 0 || d.phone.indexOf(q) >= 0;
    var matchF = !f || d.status === f;
    var matchT = !ty || d.type === ty;
    return matchQ && matchF && matchT;
  });

  var grid = document.getElementById('docs-grid');
  var empty = document.getElementById('docs-empty');
  if (!grid) return;

  if (data.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = data.map(function (d) {
    var statusBadgeHtml = d.status === 'approved'
      ? '<span class="badge b-done"><i class="fa fa-circle-check" style="font-size:9px"></i> Approuvé</span>'
      : d.status === 'rejected'
      ? '<span class="badge b-cancel"><i class="fa fa-circle-xmark" style="font-size:9px"></i> Refusé</span>'
      : '<span class="badge b-pending"><i class="fa fa-clock" style="font-size:9px"></i> En attente</span>';

    var thumbsHtml = d.docs.map(function (doc) {
      return '<div class="doc-thumb-mini" onclick="openDocModal(\'' + d.id + '\')" title="' + doc.label + '">'
        + '<div class="doc-ok-badge"><i class="fa fa-check"></i></div>'
        + '<i class="fa ' + doc.icon + '" style="color:' + doc.color + ';font-size:16px"></i>'
        + '<div class="tlbl">' + doc.label.split(' ')[0] + '</div>'
        + '</div>';
    }).join('');

    var rejectNote = d.status === 'rejected' && d.rejectReason
      ? '<div style="background:var(--danger-dim);border-radius:var(--r);padding:8px 12px;margin-bottom:10px;font-size:11px;color:var(--danger);line-height:1.5"><i class="fa fa-triangle-exclamation" style="margin-right:6px"></i>' + d.rejectReason + '</div>'
      : '';

    var footBtns = d.status === 'pending'
      ? '<button class="btn-o btn-sm" onclick="openDocModal(\'' + d.id + '\')"><i class="fa fa-eye"></i> Examiner</button>'
        + '<button class="btn-danger btn-sm" onclick="quickReject(\'' + d.id + '\')"><i class="fa fa-xmark"></i></button>'
        + '<button class="btn-gold btn-sm" onclick="quickApprove(\'' + d.id + '\')"><i class="fa fa-check"></i> Approuver</button>'
      : '<button class="btn-o btn-sm" onclick="openDocModal(\'' + d.id + '\')"><i class="fa fa-eye"></i> Voir dossier</button>';

    return '<div class="doc-card ' + d.status + '" id="dc-' + d.id + '">'
      + '<div class="doc-card-head">'
      + '<div class="doc-av">' + d.name.charAt(0) + '</div>'
      + '<div class="doc-info" style="flex:1;min-width:0">'
      + '<div class="name">' + d.name + ' <span style="font-size:10px;color:var(--text-faint);font-weight:400">· ' + d.nameAr + '</span></div>'
      + '<div class="sub">' + d.vehicle + ' · <span style="color:var(--gold)">' + d.plate + '</span></div>'
      + '</div>'
      + statusBadgeHtml
      + '</div>'
      + rejectNote
      + '<div class="doc-grid-mini">' + thumbsHtml + '</div>'
      + '<div class="doc-card-foot">'
      + '<span class="doc-submitted"><i class="fa fa-clock"></i>' + d.submitted + '</span>'
      + footBtns
      + '</div>'
      + '</div>';
  }).join('');

  /* update badge */
  var pending = _docsData.filter(function (d) { return d.status === 'pending'; }).length;
  var badge = document.getElementById('badge-docs');
  if (badge) { badge.textContent = pending; badge.style.display = pending > 0 ? '' : 'none'; }
  var kpi = document.getElementById('k-docs-pending');
  if (kpi) kpi.textContent = pending;
}

function openDocModal(id) {
  var d = _docsData.find(function (x) { return x.id === id; });
  if (!d) return;
  _currentDocId = id;
  _rejectMode = false;

  document.getElementById('dm-av').textContent = d.name.charAt(0);
  document.getElementById('dm-name').textContent = d.name;
  document.getElementById('dm-sub').textContent = d.phone + ' · ' + d.nameAr;
  document.getElementById('dm-vehicle').textContent = d.vehicle;
  document.getElementById('dm-plate').textContent = d.plate;
  document.getElementById('dm-vtype').textContent = d.type;
  document.getElementById('dm-submitted').textContent = d.submitted;

  var statusMap = {
    pending:  '<span class="badge b-pending"><i class="fa fa-clock" style="font-size:9px"></i> En attente</span>',
    approved: '<span class="badge b-done"><i class="fa fa-circle-check" style="font-size:9px"></i> Approuvé</span>',
    rejected: '<span class="badge b-cancel"><i class="fa fa-circle-xmark" style="font-size:9px"></i> Refusé</span>',
  };
  document.getElementById('dm-status-badge').innerHTML = statusMap[d.status] || '';

  document.getElementById('dm-grid').innerHTML = d.docs.map(function (doc) {
    return '<div class="doc-preview-card">'
      + '<div class="doc-preview-img" style="background:linear-gradient(135deg,' + doc.color + '11,' + doc.color + '06)">'
      + '<i class="fa ' + doc.icon + '" style="color:' + doc.color + ';opacity:.5;font-size:44px"></i>'
      + '<div class="check-badge"><i class="fa fa-check" style="font-size:8px"></i> Reçu</div>'
      + '</div>'
      + '<div class="doc-preview-meta">'
      + '<div class="doc-type">' + doc.label + '</div>'
      + '<div class="doc-fname"><i class="fa fa-paperclip" style="font-size:10px;color:var(--text-faint)"></i>' + doc.file + '</div>'
      + '<div class="doc-date"><i class="fa fa-clock" style="font-size:9px"></i> Envoyé le ' + doc.date + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  var reason = document.getElementById('dm-reason');
  reason.value = d.rejectReason || '';
  reason.classList.remove('show');

  var btnApprove = document.getElementById('dm-btn-approve');
  var btnReject  = document.getElementById('dm-btn-reject');
  if (d.status !== 'pending') {
    btnApprove.disabled = true;
    btnReject.disabled  = true;
  } else {
    btnApprove.disabled = false;
    btnReject.disabled  = false;
    btnReject.innerHTML = '<i class="fa fa-circle-xmark"></i> Refuser';
    btnReject.style.background = 'var(--danger-dim)';
  }

  document.getElementById('doc-modal').classList.add('show');
}

function closeDocModal() {
  document.getElementById('doc-modal').classList.remove('show');
  _currentDocId = null;
  _rejectMode = false;
}

function dmToggleReject() {
  var reason = document.getElementById('dm-reason');
  var btn    = document.getElementById('dm-btn-reject');
  if (!_rejectMode) {
    _rejectMode = true;
    reason.classList.add('show');
    reason.focus();
    btn.innerHTML = '<i class="fa fa-circle-xmark"></i> Confirmer le refus';
    btn.style.background = 'var(--danger)';
    btn.style.color = '#fff';
    btn.style.border = 'none';
  } else {
    var motif = reason.value.trim();
    if (!motif) { reason.style.borderColor = 'var(--danger)'; setTimeout(function () { reason.style.borderColor = ''; }, 1200); return; }
    var d = _docsData.find(function (x) { return x.id === _currentDocId; });
    if (!d) return;
    d.status = 'rejected';
    d.rejectReason = motif;
    showToast('Dossier de ' + d.name + ' refusé', 'err');
    logEvent('warn', 'fa-circle-xmark', 'Dossier refusé', d.name + ' · ' + motif.substring(0, 50), now());
    closeDocModal();
    renderDocsSection();
    if (db && d.docs) {
      d.docs.forEach(function (doc) {
        if (doc.id) reviewDoc(doc.id, 'rejected', motif, null).catch(function () {});
      });
    }
  }
}

function dmApprove() {
  var d = _docsData.find(function (x) { return x.id === _currentDocId; });
  if (!d) return;
  d.status = 'approved';
  showToast(d.name + ' approuvé — peut démarrer le service');
  logEvent('ok', 'fa-user-check', 'Chauffeur approuvé', d.name + ' · ' + d.vehicle, now());
  closeDocModal();
  renderDocsSection();
  if (db && d.docs) {
    d.docs.forEach(function (doc) {
      if (doc.id) reviewDoc(doc.id, 'approved', null, null).catch(function () {});
    });
  }
}

function dmRequestInfo() {
  var d = _docsData.find(function (x) { return x.id === _currentDocId; });
  if (!d) return;
  showToast('Demande d\'informations envoyée à ' + d.name);
  logEvent('info', 'fa-circle-info', 'Infos supplémentaires demandées', d.name + ' · ' + d.phone, now());
  closeDocModal();
}

function quickApprove(id) {
  var d = _docsData.find(function (x) { return x.id === id; });
  if (!d) return;
  d.status = 'approved';
  showToast(d.name + ' approuvé — peut démarrer le service');
  logEvent('ok', 'fa-user-check', 'Chauffeur approuvé', d.name + ' · ' + d.vehicle, now());
  renderDocsSection();
  if (db && d.docs) {
    d.docs.forEach(function (doc) {
      if (doc.id) reviewDoc(doc.id, 'approved', null, null).catch(function () {});
    });
  }
}

function quickReject(id) {
  openDocModal(id);
  setTimeout(function () {
    _rejectMode = false;
    dmToggleReject();
  }, 120);
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function statusBadge(s) {
  var m = {
    completed: '<span class="badge b-done">✓ Complété</span>',
    cancelled: '<span class="badge b-cancel">✗ Annulé</span>',
    active: '<span class="badge b-trip"><span class="badge-dot"></span>En cours</span>'
  };
  return m[s] || s;
}
function drvStatusBadge(s) {
  if (s === 'online') return '<span class="badge b-online"><span class="badge-dot"></span>En ligne</span>';
  if (s === 'on_trip') return '<span class="badge b-trip"><span class="badge-dot"></span>En course</span>';
  return '<span class="badge b-offline"><span class="badge-dot"></span>Hors ligne</span>';
}
function loginStatusBadge(s) {
  if (s === 'success') return '<span class="badge b-done">✓ Succès</span>';
  if (s === 'fail') return '<span class="badge b-cancel">✗ Échoué</span>';
  return '<span class="badge" style="background:var(--danger-dim);color:var(--danger)">🚫 Bloqué</span>';
}
function fakeIP() { var a = function () { return Math.floor(Math.random() * 200) + 1; }; return a() + '.' + a() + '.' + a() + '.' + a(); }
function now() { var d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); }

/* ═══════════════════════════════════════════════
   DATA MAPPING  (Supabase → dashboard format)
═══════════════════════════════════════════════ */
function typeLabel(t) {
  var m = { economique: 'Économique', confort: 'Confort', she: 'She', intercites: 'Intercités' };
  return m[t] || (t ? t.charAt(0).toUpperCase() + t.slice(1) : '—');
}

function mapDriver(d) {
  return {
    id: d.id,
    name: d.full_name || '—',
    nameAr: d.full_name_ar || '',
    phone: d.phone || '',
    vehicle: [d.vehicle_make, d.vehicle_model].filter(Boolean).join(' '),
    plate: d.vehicle_plate || '',
    type: typeLabel(d.vehicle_type),
    trips: d.total_trips || 0,
    rating: parseFloat(d.rating) || 5.0,
    earnings: d.total_earnings || 0,
    status: d.status || 'offline',
    lat: d.current_lat || 36.7538,
    lng: d.current_lng || 3.0588
  };
}

function mapPassenger(p) {
  return {
    id: p.id,
    name: p.full_name || '—',
    nameAr: p.full_name_ar || '',
    phone: p.phone || '',
    trips: p.total_trips || 0,
    rating: parseFloat(p.rating) || 5.0,
    spent: p.total_spent || 0,
    status: p.is_active ? 'active' : 'inactive',
    joined: p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : '—'
  };
}

function mapTrip(t) {
  var sm = { in_progress: 'active', completed: 'completed', cancelled: 'cancelled', pending: 'pending', accepted: 'active' };
  return {
    id: t.trip_code || t.id,
    pax: t.passenger_name || '—',
    drv: t.driver_name || '—',
    from: t.from_address || '',
    to: t.to_address || '',
    dist: parseFloat(t.distance_km) || 0,
    price: t.price || 0,
    type: typeLabel(t.vehicle_type),
    status: sm[t.status] || t.status,
    date: t.created_at ? new Date(t.created_at).toLocaleString('fr-FR') : '—'
  };
}

function mapTxn(t) {
  var mm = { cib: 'CIB', edahabia: 'Edahabia', cash: 'Espèces' };
  return {
    id: t.txn_code || t.id,
    trip: t.trip_code || '—',
    pax: t.passenger_name || '—',
    drv: t.driver_name || '—',
    total: t.amount || 0,
    commission: t.commission || 0,
    reversement: t.driver_amount || 0,
    method: mm[t.payment_method] || t.payment_method,
    date: t.created_at ? new Date(t.created_at).toLocaleString('fr-FR') : '—'
  };
}

var DOC_META = {
  permis:        { icon: 'fa-id-card',    color: '#4FA0E0', label: 'Permis de conduire' },
  carte_grise:   { icon: 'fa-file-lines', color: '#2DD4BF', label: 'Carte grise' },
  vehicle_front: { icon: 'fa-car',        color: '#A855F7', label: 'Véhicule — avant' },
  vehicle_rear:  { icon: 'fa-car-rear',   color: '#F59842', label: 'Véhicule — arrière' },
  selfie:        { icon: 'fa-user',       color: '#E05555', label: 'Selfie' }
};

function groupDocsByDriver(rows) {
  var map = {};
  rows.forEach(function (row) {
    if (!map[row.driver_id]) {
      map[row.driver_id] = {
        id: 'drv-' + row.driver_id,
        driverId: row.driver_id,
        name: row.full_name || '—',
        nameAr: row.full_name_ar || '',
        phone: row.phone || '',
        vehicle: [row.vehicle_make, row.vehicle_model, row.vehicle_year].filter(Boolean).join(' '),
        plate: row.vehicle_plate || '',
        type: typeLabel(row.vehicle_type),
        submitted: row.uploaded_at ? new Date(row.uploaded_at).toLocaleString('fr-FR') : '—',
        status: 'pending',
        rejectReason: '',
        docs: []
      };
    }
    var meta = DOC_META[row.type] || { icon: 'fa-file', color: '#888', label: row.type };
    map[row.driver_id].docs.push({
      id: row.id,
      label: meta.label,
      icon: meta.icon,
      color: meta.color,
      file: row.file_name || '—',
      date: row.uploaded_at ? new Date(row.uploaded_at).toLocaleString('fr-FR') : '—',
      status: row.status,
      rejectReason: row.reject_reason || ''
    });
  });

  return Object.values(map).map(function (drv) {
    var statuses = drv.docs.map(function (d) { return d.status; });
    if (statuses.length > 0 && statuses.every(function (s) { return s === 'approved'; })) {
      drv.status = 'approved';
    } else if (statuses.some(function (s) { return s === 'rejected'; })) {
      drv.status = 'rejected';
      var rej = drv.docs.find(function (d) { return d.status === 'rejected'; });
      if (rej) drv.rejectReason = rej.rejectReason;
    } else {
      drv.status = 'pending';
    }
    return drv;
  });
}

/* ═══════════════════════════════════════════════
   REAL DATA LOADING
═══════════════════════════════════════════════ */
async function loadRealData() {
  if (!initSupabase()) return;
  try {
    var results = await Promise.all([
      fetchDrivers(),
      fetchPassengers(),
      fetchTrips(),
      fetchTransactions(),
      fetchPendingDocs(),
      fetchKpis()
    ]);
    var driversData    = results[0];
    var passengersData = results[1];
    var tripsData      = results[2];
    var txnsData       = results[3];
    var docsData       = results[4];
    var kpiData        = results[5];

    if (driversData    && driversData.length    > 0) { DRIVERS    = driversData.map(mapDriver);       renderDriverCards(); renderDrvTable(); }
    if (passengersData && passengersData.length  > 0) { PASSENGERS = passengersData.map(mapPassenger); renderPaxTable(); }
    if (tripsData      && tripsData.length       > 0) { TRIPS      = tripsData.map(mapTrip);           renderRecentTable(); renderTripsTable(); }
    if (txnsData       && txnsData.length        > 0) { FINANCE_TXN = txnsData.map(mapTxn);            renderFinanceTable(); }
    if (docsData       && docsData.length        > 0) { _docsData  = groupDocsByDriver(docsData);      renderDocsSection(); }
    if (kpiData)                                      { applyKpis(kpiData); updateCharts(kpiData); }

    subscribeDriverLocations(function (loc) {
      var d = DRIVERS.find(function (x) { return x.id === loc.driver_id; });
      if (d) { d.lat = loc.lat; d.lng = loc.lng; }
      // Re-draw live markers + KPIs when the map is open so positions move in real time.
      if (_gmap) { mapRefresh(); updateMapKpis(); }
    });
    subscribeNewDocuments(function () {
      fetchPendingDocs().then(function (data) {
        if (data && data.length > 0) { _docsData = groupDocsByDriver(data); renderDocsSection(); showToast('Nouveau document reçu'); }
      }).catch(function () {});
    });

    showToast('Données Supabase chargées ✓');
  } catch (e) {
    console.warn('[WinRak] Erreur chargement données Supabase:', e);
  }
}

/* ═══════════════════════════════════════════════
   PRICING ENGINE
═══════════════════════════════════════════════ */

var _pricingData   = [];   // all rows from pricing_config
var _surgeData     = [];   // all rows from surge_config
var _currentSvc    = 'ride';

// Built-in seed — mirrors 20260624_pricing_engine.sql (shown when Supabase unavailable)
var PRICING_SEED = [
  {tier:'A',service_type:'ride',     base_fare:250,short_km_limit:2,per_km_rate:32,per_min_rate:3,  women_premium_pct:15, speed_multipliers:{normal:1,fast:1,   urgent:1   }},
  {tier:'A',service_type:'women',    base_fare:250,short_km_limit:2,per_km_rate:32,per_min_rate:3,  women_premium_pct:15, speed_multipliers:{normal:1,fast:1,   urgent:1   }},
  {tier:'A',service_type:'delivery', base_fare:250,short_km_limit:3,per_km_rate:30,per_min_rate:0,  women_premium_pct:0,  speed_multipliers:{normal:1,fast:1.25,urgent:1.50}},
  {tier:'A',service_type:'medicine', base_fare:300,short_km_limit:3,per_km_rate:30,per_min_rate:0,  women_premium_pct:0,  speed_multipliers:{normal:1,fast:1.35,urgent:1.70}},
  {tier:'A',service_type:'food',     base_fare:250,short_km_limit:3,per_km_rate:30,per_min_rate:0,  women_premium_pct:0,  speed_multipliers:{normal:1,fast:1.25,urgent:1.50}},
  {tier:'B',service_type:'ride',     base_fare:220,short_km_limit:2,per_km_rate:28,per_min_rate:3,  women_premium_pct:15, speed_multipliers:{normal:1,fast:1,   urgent:1   }},
  {tier:'B',service_type:'women',    base_fare:220,short_km_limit:2,per_km_rate:28,per_min_rate:3,  women_premium_pct:15, speed_multipliers:{normal:1,fast:1,   urgent:1   }},
  {tier:'B',service_type:'delivery', base_fare:220,short_km_limit:3,per_km_rate:27,per_min_rate:0,  women_premium_pct:0,  speed_multipliers:{normal:1,fast:1.25,urgent:1.50}},
  {tier:'B',service_type:'medicine', base_fare:270,short_km_limit:3,per_km_rate:27,per_min_rate:0,  women_premium_pct:0,  speed_multipliers:{normal:1,fast:1.35,urgent:1.70}},
  {tier:'B',service_type:'food',     base_fare:220,short_km_limit:3,per_km_rate:27,per_min_rate:0,  women_premium_pct:0,  speed_multipliers:{normal:1,fast:1.25,urgent:1.50}},
  {tier:'C',service_type:'ride',     base_fare:200,short_km_limit:2,per_km_rate:25,per_min_rate:3,  women_premium_pct:15, speed_multipliers:{normal:1,fast:1,   urgent:1   }},
  {tier:'C',service_type:'women',    base_fare:200,short_km_limit:2,per_km_rate:25,per_min_rate:3,  women_premium_pct:15, speed_multipliers:{normal:1,fast:1,   urgent:1   }},
  {tier:'C',service_type:'delivery', base_fare:200,short_km_limit:3,per_km_rate:24,per_min_rate:0,  women_premium_pct:0,  speed_multipliers:{normal:1,fast:1.25,urgent:1.50}},
  {tier:'C',service_type:'medicine', base_fare:250,short_km_limit:3,per_km_rate:24,per_min_rate:0,  women_premium_pct:0,  speed_multipliers:{normal:1,fast:1.35,urgent:1.70}},
  {tier:'C',service_type:'food',     base_fare:200,short_km_limit:3,per_km_rate:24,per_min_rate:0,  women_premium_pct:0,  speed_multipliers:{normal:1,fast:1.25,urgent:1.50}},
];
var SURGE_SEED = [
  {trigger_type:'morning_peak',label_ar:'ذروة الصباح',       label_fr:'Pointe matin',        multiplier:1.20,is_auto:true, start_hour:7, end_hour:9, is_calendar:false,is_enabled:true},
  {trigger_type:'evening_peak',label_ar:'ذروة المساء',       label_fr:'Pointe soir',         multiplier:1.20,is_auto:true, start_hour:17,end_hour:20,is_calendar:false,is_enabled:true},
  {trigger_type:'night',       label_ar:'الليل المتأخر',     label_fr:'Nuit tardive',        multiplier:1.30,is_auto:true, start_hour:22,end_hour:5, is_calendar:false,is_enabled:true},
  {trigger_type:'ramadan',     label_ar:'رمضان بعد الإفطار', label_fr:'Ramadan post-ftour',  multiplier:1.35,is_auto:true, start_hour:null,end_hour:null,is_calendar:true,is_enabled:true},
  {trigger_type:'holiday',     label_ar:'أعياد ومناسبات',   label_fr:'Fêtes et événements', multiplier:1.40,is_auto:true, start_hour:null,end_hour:null,is_calendar:true,is_enabled:true},
  {trigger_type:'rain',        label_ar:'طقس سيئ / مطر',    label_fr:'Mauvais temps',       multiplier:1.25,is_auto:false,start_hour:null,end_hour:null,is_calendar:false,is_enabled:true},
  {trigger_type:'event',       label_ar:'حدث استثنائي',     label_fr:'Événement spécial',   multiplier:1.00,is_auto:false,start_hour:null,end_hour:null,is_calendar:false,is_enabled:true},
];

var SVC_LABELS = {
  ride:     { fr: 'Trajet',        ar: 'نقل الركاب',   icon: 'fa-car',      hasTiers: false, hasWomen: false, hasDuration: true  },
  women:    { fr: 'She',           ar: 'خدمة النساء',  icon: 'fa-venus',    hasTiers: false, hasWomen: true,  hasDuration: true  },
  delivery: { fr: 'Livraison',     ar: 'توصيل الطلبات',icon: 'fa-box',      hasTiers: true,  hasWomen: false, hasDuration: false },
  medicine: { fr: 'Médecine',      ar: 'توصيل الأدوية',icon: 'fa-capsules', hasTiers: true,  hasWomen: false, hasDuration: false },
  food:     { fr: 'Restauration',  ar: 'توصيل الأكل',  icon: 'fa-utensils', hasTiers: true,  hasWomen: false, hasDuration: false },
};

var TIER_META = {
  A: { label: 'Tier A — مرتفع', color: 'var(--gold)',    cities: 'الجزائر، وهران، تمنراست' },
  B: { label: 'Tier B — متوسط', color: 'var(--blue)',    cities: 'عنابة، سطيف، بجاية، باتنة' },
  C: { label: 'Tier C — منخفض', color: 'var(--success)', cities: 'قسنطينة، الجلفة، المسيلة' },
};

async function loadPricingSection() {
  if (!window._supabase) {
    // No Supabase — load built-in seed values so the UI is usable
    _pricingData = PRICING_SEED;
    _surgeData   = SURGE_SEED;
    renderPricingGrid();
    renderSurgeAuto();
    renderSurgeManual();
    loadReferralTable();
    return;
  }
  try {
    var res = await Promise.all([
      window._supabase.rpc('rpc_get_pricing_config'),
      window._supabase.rpc('rpc_get_surge_config'),
    ]);
    if (res[0].data) _pricingData = res[0].data;
    if (res[1].data) _surgeData   = res[1].data;
    renderPricingGrid();
    renderSurgeAuto();
    renderSurgeManual();
  } catch (e) {
    console.warn('[Pricing] RPC unavailable — using seed data', e.message);
    _pricingData = PRICING_SEED;
    _surgeData   = SURGE_SEED;
    renderPricingGrid();
    renderSurgeAuto();
    renderSurgeManual();
  }
  loadReferralTable();
}

function switchPricingTab(svc) {
  _currentSvc = svc;
  document.querySelectorAll('.pricing-tab').forEach(function (b) {
    var isActive = b.dataset.svc === svc;
    b.classList.toggle('btn-gold', isActive);
    b.classList.toggle('active-tab', isActive);
    b.classList.toggle('btn-o', !isActive);
  });
  renderPricingGrid();
}

function renderPricingGrid() {
  var grid = document.getElementById('pricing-grid');
  if (!grid) return;
  var rows = _pricingData.filter(function (r) { return r.service_type === _currentSvc; });
  if (rows.length === 0) {
    grid.innerHTML = '<div style="color:var(--text-muted);padding:20px">Chargement…</div>';
    return;
  }
  grid.innerHTML = ['A', 'B', 'C'].map(function (tier) {
    var r = rows.find(function (x) { return x.tier === tier; });
    if (!r) return '';
    var meta = TIER_META[tier];
    var svcMeta = SVC_LABELS[_currentSvc];
    var hasSpeed = svcMeta.hasTiers;
    var speed = (typeof r.speed_multipliers === 'object') ? r.speed_multipliers : JSON.parse(r.speed_multipliers || '{}');
    return '<div class="card" style="border-top:3px solid ' + meta.color + '">' +
      '<div class="card-head"><span class="card-title" style="color:' + meta.color + '">' + meta.label + '</span></div>' +
      '<div style="font-size:11px;color:var(--text-muted);margin-bottom:14px">' + meta.cities + '</div>' +
      '<div class="setting-row">' +
        '<div class="setting-lbl"><div class="t">الحد الأدنى (DZD)</div><div class="s">Base · 0–' + r.short_km_limit + ' km</div></div>' +
        '<input class="pill-inp" data-tier="' + tier + '" data-svc="' + _currentSvc + '" data-field="base_fare" type="number" min="50" step="50" value="' + r.base_fare + '">' +
      '</div>' +
      '<div class="setting-row">' +
        '<div class="setting-lbl"><div class="t">حد الرحلة القصيرة (km)</div><div class="s">Seuil km forfaitaire</div></div>' +
        '<input class="pill-inp" data-tier="' + tier + '" data-svc="' + _currentSvc + '" data-field="short_km_limit" type="number" min="0.5" step="0.5" value="' + r.short_km_limit + '">' +
      '</div>' +
      '<div class="setting-row">' +
        '<div class="setting-lbl"><div class="t">السعر / km (DZD)</div><div class="s">Après le seuil</div></div>' +
        '<input class="pill-inp" data-tier="' + tier + '" data-svc="' + _currentSvc + '" data-field="per_km_rate" type="number" min="5" step="1" value="' + r.per_km_rate + '">' +
      '</div>' +
      (svcMeta.hasDuration ? '<div class="setting-row">' +
        '<div class="setting-lbl"><div class="t">السعر / دقيقة (DZD)</div><div class="s">Temps de trajet</div></div>' +
        '<input class="pill-inp" data-tier="' + tier + '" data-svc="' + _currentSvc + '" data-field="per_min_rate" type="number" min="0" step="0.5" value="' + r.per_min_rate + '">' +
      '</div>' : '') +
      (svcMeta.hasWomen ? '<div class="setting-row">' +
        '<div class="setting-lbl"><div class="t">علاوة النساء (%)</div><div class="s">10% → سائقة · 5% → منصة</div></div>' +
        '<input class="pill-inp" data-tier="' + tier + '" data-svc="' + _currentSvc + '" data-field="women_premium_pct" type="number" min="0" step="1" value="' + r.women_premium_pct + '">' +
      '</div>' : '') +
      (hasSpeed ? '<div style="margin-top:10px;font-size:10px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">Multiplicateurs de vitesse</div>' +
        '<div class="setting-row">' +
          '<div class="setting-lbl"><div class="t">عادي</div><div class="s">Normal</div></div>' +
          '<input class="pill-inp" data-tier="' + tier + '" data-svc="' + _currentSvc + '" data-field="speed_normal" type="number" min="1" step="0.05" value="' + (speed.normal || 1.0) + '">' +
        '</div>' +
        '<div class="setting-row">' +
          '<div class="setting-lbl"><div class="t">سريع</div><div class="s">Fast</div></div>' +
          '<input class="pill-inp" data-tier="' + tier + '" data-svc="' + _currentSvc + '" data-field="speed_fast" type="number" min="1" step="0.05" value="' + (speed.fast || 1.25) + '">' +
        '</div>' +
        '<div class="setting-row" style="border-bottom:none">' +
          '<div class="setting-lbl"><div class="t">عاجل</div><div class="s">Urgent</div></div>' +
          '<input class="pill-inp" data-tier="' + tier + '" data-svc="' + _currentSvc + '" data-field="speed_urgent" type="number" min="1" step="0.05" value="' + (speed.urgent || 1.5) + '">' +
        '</div>' : '') +
    '</div>';
  }).join('');
}

async function savePricingConfig() {
  var inputs = document.querySelectorAll('#pricing-grid .pill-inp');
  var byKey = {};
  inputs.forEach(function (inp) {
    var key = inp.dataset.tier + '|' + inp.dataset.svc;
    if (!byKey[key]) byKey[key] = { tier: inp.dataset.tier, svc: inp.dataset.svc };
    byKey[key][inp.dataset.field] = parseFloat(inp.value);
  });

  try {
    var promises = Object.values(byKey).map(function (row) {
      var speedMult = {
        normal: row['speed_normal'] || 1.0,
        fast:   row['speed_fast']   || 1.25,
        urgent: row['speed_urgent'] || 1.50,
      };
      return window._supabase.rpc('rpc_upsert_pricing_config', {
        p_tier:              row.tier,
        p_service_type:      row.svc,
        p_base_fare:         Math.round(row['base_fare']        || 200),
        p_short_km_limit:    row['short_km_limit']   || 2.0,
        p_per_km_rate:       Math.round(row['per_km_rate']      || 25),
        p_per_min_rate:      row['per_min_rate']     || 0,
        p_women_premium_pct: row['women_premium_pct']|| 0,
        p_speed_multipliers: speedMult,
      });
    });
    await Promise.all(promises);
    // Refresh local cache
    var res = await window._supabase.rpc('rpc_get_pricing_config');
    if (res.data) _pricingData = res.data;
    renderPricingGrid();
    showToast('Tarification enregistrée ✓');
  } catch (e) {
    console.error('[Pricing] save error', e);
    showToast('Erreur lors de la sauvegarde', 'err');
  }
}

function renderSurgeAuto() {
  var wrap = document.getElementById('pricing-surge-auto');
  if (!wrap) return;
  var autoRows = _surgeData.filter(function (r) { return r.is_auto; });
  wrap.innerHTML = autoRows.map(function (r) {
    var timeLabel = (r.start_hour !== null)
      ? r.start_hour + 'h – ' + r.end_hour + 'h'
      : (r.is_calendar ? 'Calendrier' : '—');
    return '<div class="card" style="padding:14px 16px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
        '<div>' +
          '<div style="font-size:13px;font-weight:600;color:var(--text)">' + r.label_ar + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted)">' + r.label_fr + ' · ' + timeLabel + '</div>' +
        '</div>' +
        '<button class="tog ' + (r.is_enabled ? 'on' : '') + '" data-surge-id="' + r.trigger_type + '" onclick="toggleSurgeEnabled(this,\'' + r.trigger_type + '\')"></button>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:11px;color:var(--text-muted)">×</span>' +
        '<input class="pill-inp" data-surge-type="' + r.trigger_type + '" data-surge-field="multiplier" type="number" min="1" max="3" step="0.05" value="' + r.multiplier + '" style="width:70px">' +
        '<span style="font-size:11px;color:var(--gold);font-weight:700">' + r.multiplier + 'x</span>' +
      '</div>' +
    '</div>';
  }).join('');

  // Live preview multiplier label
  wrap.querySelectorAll('input[data-surge-field="multiplier"]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var lbl = inp.nextElementSibling;
      if (lbl) lbl.textContent = parseFloat(inp.value).toFixed(2) + 'x';
    });
  });
}

function toggleSurgeEnabled(btn, triggerType) {
  btn.classList.toggle('on');
}

async function saveSurgeConfig() {
  var inputs = document.querySelectorAll('#pricing-surge-auto input[data-surge-type]');
  var byType = {};
  inputs.forEach(function (inp) {
    if (!byType[inp.dataset.surgeType]) byType[inp.dataset.surgeType] = {};
    byType[inp.dataset.surgeType][inp.dataset.surgeField] = parseFloat(inp.value);
  });
  // Read toggle state
  document.querySelectorAll('#pricing-surge-auto .tog').forEach(function (btn) {
    var t = btn.dataset.surgeId;
    if (t && byType[t]) byType[t]['enabled'] = btn.classList.contains('on');
  });
  try {
    var promises = Object.entries(byType).map(function (entry) {
      var type = entry[0]; var vals = entry[1];
      return window._supabase.rpc('rpc_upsert_surge_config', {
        p_trigger_type: type,
        p_multiplier:   vals['multiplier'] || 1.20,
        p_is_enabled:   vals['enabled'] !== undefined ? vals['enabled'] : true,
      });
    });
    await Promise.all(promises);
    var res = await window._supabase.rpc('rpc_get_surge_config');
    if (res.data) _surgeData = res.data;
    renderSurgeAuto();
    renderSurgeManual();
    showToast('Surge config enregistrée ✓');
  } catch (e) {
    console.error('[Surge] save error', e);
    showToast('Erreur surge config', 'err');
  }
}

function renderSurgeManual() {
  var wrap = document.getElementById('pricing-surge-manual');
  var status = document.getElementById('pricing-surge-status');
  if (!wrap) return;
  var manualRows = _surgeData.filter(function (r) { return !r.is_auto; });
  wrap.innerHTML = manualRows.map(function (r) {
    var isRain  = r.trigger_type === 'rain';
    var color   = isRain ? 'var(--blue)' : 'var(--orange)';
    var icon    = isRain ? 'fa-cloud-rain' : 'fa-calendar-star';
    return '<button class="btn-o btn-sm surge-manual-btn" data-trigger="' + r.trigger_type + '" data-mult="' + r.multiplier + '" ' +
      'onclick="activateManualSurge(this)" style="gap:8px;border-color:' + color + ';color:' + color + '">' +
      '<i class="fa ' + icon + '"></i> ' + r.label_ar +
      ' <span style="font-size:10px;opacity:.7">× ' + r.multiplier + '</span></button>';
  }).join('');
  if (status) status.textContent = 'Chargé';
}

/* ── REFERRAL ───────────────────────────────────────────── */

async function loadReferralTable() {
  var tbody = document.getElementById('tbl-referrals');
  if (!tbody) return;

  if (!window._supabase) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text-muted);padding:20px;text-align:center">Connecter Supabase pour voir les données réelles</td></tr>';
    return;
  }

  try {
    var res = await window._supabase.rpc('rpc_dash_referrals', { p_limit: 100 });
    var rows = res.data || [];

    // KPIs
    var total    = rows.length;
    var rewarded = rows.filter(function (r) { return r.status === 'rewarded'; }).length;
    var pending  = rows.filter(function (r) { return r.status === 'pending'; }).length;

    // Count unique referrers with active discount (approximate via rewarded in last 30d)
    var activeDisc = rows.filter(function (r) {
      if (r.status !== 'rewarded' || !r.reward_at) return false;
      return (Date.now() - new Date(r.reward_at).getTime()) < 30 * 86400000;
    }).reduce(function (acc, r) { acc.add(r.referrer_id); return acc; }, new Set()).size;

    var el = function (id) { return document.getElementById(id); };
    if (el('ref-total'))      el('ref-total').textContent      = total;
    if (el('ref-rewarded'))   el('ref-rewarded').textContent   = rewarded;
    if (el('ref-pending'))    el('ref-pending').textContent    = pending;
    if (el('ref-active-disc'))el('ref-active-disc').textContent= activeDisc;

    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text-muted);padding:20px;text-align:center">Aucun parrainage enregistré</td></tr>';
      return;
    }

    var statusBadge = function (s) {
      if (s === 'rewarded')  return '<span class="badge b-online"><span class="badge-dot"></span>مكافأ</span>';
      if (s === 'cancelled') return '<span class="badge b-offline">ملغى</span>';
      return '<span class="badge b-pending">انتظار</span>';
    };

    tbody.innerHTML = '<thead><tr>' +
      '<th>الكود</th><th>الراعي (Parrain)</th><th>الجديد (Filleul)</th>' +
      '<th>الرحلات</th><th>الحالة</th><th>تاريخ المكافأة</th>' +
    '</tr></thead><tbody>' +
    rows.map(function (r) {
      var progress = r.trips_done + ' / ' + r.trips_required;
      var progPct  = Math.min(100, Math.round((r.trips_done / r.trips_required) * 100));
      var progBar  = '<div style="background:var(--border);border-radius:4px;height:4px;width:80px;margin-top:4px">' +
        '<div style="background:var(--gold);width:' + progPct + '%;height:4px;border-radius:4px"></div></div>';
      return '<tr>' +
        '<td><span class="pill text-gold fw7">' + (r.referral_code || '—') + '</span></td>' +
        '<td style="font-weight:600">' + (r.referrer_name || '—') + '</td>' +
        '<td>' + (r.referred_name || '—') + '</td>' +
        '<td>' + progress + progBar + '</td>' +
        '<td>' + statusBadge(r.status) + '</td>' +
        '<td style="color:var(--text-muted);font-size:12px">' + (r.reward_at ? new Date(r.reward_at).toLocaleDateString('fr-DZ') : '—') + '</td>' +
      '</tr>';
    }).join('') + '</tbody>';
  } catch (e) {
    console.warn('[Referral] load error', e);
    showToast('Erreur chargement parrainages', 'err');
  }
}

async function activateManualSurge(btn) {
  var trigger = btn.dataset.trigger;
  var mult    = parseFloat(btn.dataset.mult) || 1.25;
  var isActive = btn.classList.contains('surge-on');
  try {
    var res = await window._supabase.rpc('rpc_toggle_manual_surge', {
      p_trigger_type: trigger,
      p_city_id:      null,
      p_multiplier:   mult,
      p_reason:       btn.textContent.trim(),
      p_ends_at:      null,
    });
    if (res.data) {
      var action = res.data.action;
      btn.classList.toggle('surge-on', action === 'activated');
      btn.style.background = action === 'activated' ? 'var(--orange-dim,rgba(255,165,0,.15))' : '';
      var status = document.getElementById('pricing-surge-status');
      if (status) {
        var active = document.querySelectorAll('.surge-on').length;
        status.textContent = active > 0 ? active + ' surge(s) actif(s)' : 'Aucun surge manuel';
        status.style.color = active > 0 ? 'var(--orange)' : 'var(--text-muted)';
      }
      showToast(action === 'activated' ? 'Surge activé ✓' : 'Surge désactivé');
    }
  } catch (e) {
    console.error('[Surge] toggle error', e);
    showToast('Erreur activation surge', 'err');
  }
}

/* ═══════════════════════════════════════════════
   INIT — run after DOM ready
═══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  /* Login */
  document.getElementById('inp-pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
  document.getElementById('inp-user').addEventListener('keydown', function (e) { if (e.key === 'Enter') document.getElementById('inp-pass').focus(); });
  document.getElementById('btn-login').addEventListener('click', doLogin);
  document.getElementById('pw-eye').addEventListener('click', function () {
    var inp = document.getElementById('inp-pass');
    var icon = document.querySelector('#pw-eye i');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    icon.className = inp.type === 'password' ? 'fa fa-eye' : 'fa fa-eye-slash';
  });

  /* Sidebar */
  document.getElementById('toggle-sb').addEventListener('click', function () {
    document.getElementById('sidebar').classList.toggle('col');
    document.getElementById('main').classList.toggle('col');
  });

  /* Navigation */
  document.querySelectorAll('.nav-item').forEach(function (el) {
    el.addEventListener('click', function () { nav(el.dataset.sec); });
  });

  /* Refresh session */
  document.getElementById('refresh-btn').addEventListener('click', refreshSession);

  /* Logout */
  document.getElementById('logout-btn').addEventListener('click', doLogout);

  /* Table search/filter */
  document.getElementById('pax-search').addEventListener('input', function () { paxPage = 1; renderPaxTable(); });
  document.getElementById('pax-filter').addEventListener('change', function () { paxPage = 1; renderPaxTable(); });
  document.getElementById('drv-search').addEventListener('input', function () { drvPage = 1; renderDrvTable(); });
  document.getElementById('drv-filter').addEventListener('change', function () { drvPage = 1; renderDrvTable(); });
  document.getElementById('trip-search').addEventListener('input', function () { tripPage = 1; renderTripsTable(); });
  document.getElementById('trip-filter').addEventListener('change', function () { tripPage = 1; renderTripsTable(); });
  document.getElementById('trip-type').addEventListener('change', function () { tripPage = 1; renderTripsTable(); });

  /* Docs search/filter */
  document.getElementById('docs-search').addEventListener('input', renderDocsSection);
  document.getElementById('docs-filter').addEventListener('change', renderDocsSection);
  document.getElementById('docs-type').addEventListener('change', renderDocsSection);

  /* Close doc modal on backdrop click */
  document.getElementById('doc-modal').addEventListener('click', function (e) {
    if (e.target === this) closeDocModal();
  });
});
