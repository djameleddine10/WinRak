import { useUIStore } from '../stores/ui.store'

const T = {
  // Sidebar
  dashboard:      { fr: 'Tableau de bord',    ar: 'لوحة التحكم' },
  map:            { fr: 'Carte en direct',     ar: 'الخريطة المباشرة' },
  drivers:        { fr: 'Chauffeurs',          ar: 'السائقون' },
  passengers:     { fr: 'Passagers',           ar: 'الركاب' },
  rides:          { fr: 'Courses',             ar: 'الرحلات' },
  restaurants:    { fr: 'Restaurants',         ar: 'المطاعم' },
  pharmacies:     { fr: 'Pharmacies',          ar: 'الصيدليات' },
  pricing:        { fr: 'Tarification',        ar: 'التسعير' },
  notifications:  { fr: 'Notifications',       ar: 'الإشعارات' },
  settings:       { fr: 'Paramètres',          ar: 'الإعدادات' },
  logout:         { fr: 'Déconnexion',         ar: 'تسجيل الخروج' },

  // Settings page
  settings_title:    { fr: 'Paramètres',                           ar: 'الإعدادات' },
  settings_subtitle: { fr: 'Configuration de la plateforme WinRak', ar: 'إعدادات منصة WinRak' },

  appearance:       { fr: 'Apparence',         ar: 'المظهر' },
  appearance_desc:  { fr: 'Choisissez le thème de l\'interface',   ar: 'اختر مظهر الواجهة' },
  theme_dark:       { fr: 'Mode sombre',       ar: 'الوضع الداكن' },
  theme_light:      { fr: 'Mode clair',        ar: 'الوضع الفاتح' },
  theme_dark_desc:  { fr: 'Interface sombre, idéale pour une utilisation prolongée', ar: 'واجهة داكنة مثالية للاستخدام المطوّل' },
  theme_light_desc: { fr: 'Interface claire, idéale pour les environnements lumineux', ar: 'واجهة فاتحة مثالية للأماكن المضيئة' },

  language:         { fr: 'Langue',            ar: 'اللغة' },
  language_desc:    { fr: 'Choisissez la langue de l\'interface',  ar: 'اختر لغة الواجهة' },
  lang_fr:          { fr: 'Français',          ar: 'الفرنسية' },
  lang_ar:          { fr: 'Arabe (عربي)',       ar: 'العربية' },
  lang_fr_desc:     { fr: 'Interface en français',                 ar: 'الواجهة بالفرنسية' },
  lang_ar_desc:     { fr: 'Interface en arabe (RTL)',              ar: 'الواجهة بالعربية (RTL)' },

  platform_info:    { fr: 'Informations de la plateforme',         ar: 'معلومات المنصة' },
  platform_name:    { fr: 'Nom de la plateforme',                  ar: 'اسم المنصة' },
  support_email:    { fr: 'Email support',                         ar: 'البريد الإلكتروني للدعم' },
  support_phone:    { fr: 'Téléphone support',                     ar: 'هاتف الدعم' },
  save:             { fr: 'Sauvegarder',                           ar: 'حفظ' },
  saving:           { fr: 'Enregistrement…',                       ar: 'جارٍ الحفظ…' },

  maintenance:      { fr: 'Mode Maintenance',                      ar: 'وضع الصيانة' },
  maintenance_on:   { fr: '⚠️ Application en maintenance',         ar: '⚠️ التطبيق في وضع الصيانة' },
  maintenance_off:  { fr: 'Application opérationnelle',            ar: 'التطبيق يعمل بشكل طبيعي' },

  change_password:  { fr: 'Changer le mot de passe',               ar: 'تغيير كلمة المرور' },
  new_password:     { fr: 'Nouveau mot de passe',                  ar: 'كلمة المرور الجديدة' },
  min_chars:        { fr: 'Minimum 6 caractères',                  ar: 'الحد الأدنى 6 أحرف' },
  update_password:  { fr: 'Changer le mot de passe',               ar: 'تغيير كلمة المرور' },
  updating:         { fr: 'Mise à jour…',                          ar: 'جارٍ التحديث…' },

  admin_account:    { fr: 'Compte Administrateur',                  ar: 'حساب المسؤول' },
  admin_label:      { fr: 'Admin',                                  ar: 'مسؤول' },
  admin_name_default: { fr: 'Administrateur',                       ar: 'المسؤول' },

  active_wilayas:   { fr: 'Wilayas actives',                       ar: 'الولايات النشطة' },
  save_wilayas:     { fr: 'Sauvegarder les wilayas',               ar: 'حفظ الولايات' },

  // Common
  search:           { fr: 'Rechercher…',       ar: 'بحث…' },
  status:           { fr: 'Statut',            ar: 'الحالة' },
  all:              { fr: 'Tous',              ar: 'الكل' },
  actions:          { fr: 'Actions',           ar: 'إجراءات' },
  cancel:           { fr: 'Annuler',           ar: 'إلغاء' },
  confirm:          { fr: 'Confirmer',         ar: 'تأكيد' },
  loading:          { fr: 'Chargement…',       ar: 'جارٍ التحميل…' },
  error:            { fr: 'Erreur',            ar: 'خطأ' },
  success:          { fr: 'Succès',            ar: 'تم بنجاح' },
  name:             { fr: 'Nom',               ar: 'الاسم' },
  phone:            { fr: 'Téléphone',         ar: 'الهاتف' },
  email:            { fr: 'Email',             ar: 'البريد الإلكتروني' },
  date:             { fr: 'Date',              ar: 'التاريخ' },
  price:            { fr: 'Prix',              ar: 'السعر' },
  distance:         { fr: 'Distance',          ar: 'المسافة' },
  rating:           { fr: 'Note',              ar: 'التقييم' },
  active:           { fr: 'Actif',             ar: 'نشط' },
  inactive:         { fr: 'Inactif',           ar: 'غير نشط' },
  online:           { fr: 'En ligne',          ar: 'متصل' },
  offline:          { fr: 'Hors ligne',        ar: 'غير متصل' },
  on_trip:          { fr: 'En course',         ar: 'في رحلة' },
  approved:         { fr: 'Approuvé',          ar: 'موافق عليه' },
  pending:          { fr: 'En attente',        ar: 'في الانتظار' },
  rejected:         { fr: 'Rejeté',            ar: 'مرفوض' },
  completed:        { fr: 'Terminé',           ar: 'مكتمل' },
  cancelled:        { fr: 'Annulé',            ar: 'ملغى' },
  in_progress:      { fr: 'En cours',          ar: 'جارٍ' },
} as const

export type TKey = keyof typeof T

export function useT() {
  const lang = useUIStore(s => s.lang)
  return (key: TKey): string => T[key][lang]
}

export { T }
