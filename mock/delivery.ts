// Mock data for the WinRak delivery hub (التوصيل): pharmacies, OTC medicines and
// the courier. Restaurants and parcels are placeholders for now — only the pharmacy
// vertical is wired end-to-end. All `icon` fields are valid MaterialCommunityIcons.

import { type TranslationKey } from '../i18n/translations'

export type MedCategory = 'pain' | 'cold' | 'digestive' | 'firstaid' | 'baby' | 'vitamins'

export interface Pharmacy {
  id:          string
  name:        string
  area:        string
  distanceKm:  number
  etaMin:      number
  rating:      number
  deliveryFee: number
  open24h:     boolean   // night pharmacy — مفتوحة ليلاً ونهاراً
  openNow:     boolean
}

export interface Med {
  id:       string
  nameKey:  TranslationKey
  detailKey: TranslationKey
  category: MedCategory
  price:    number
  icon:     string
  rx:       boolean      // requires a prescription (kept out of the OTC catalog)
}

export interface MedCategoryMeta {
  key:      MedCategory
  labelKey: TranslationKey
  icon:     string
}

// Pharmacies around Algiers. The 24/24 ones power the "ليل ونهار" night-delivery promise.
export const pharmacies: Pharmacy[] = [
  { id: 'ph01', name: 'صيدلية الشفاء',        area: 'ديدوش مراد، الجزائر', distanceKm: 1.2, etaMin: 15, rating: 4.9, deliveryFee: 120, open24h: true,  openNow: true },
  { id: 'ph02', name: 'صيدلية النور الليلية', area: 'الحراش، الجزائر',     distanceKm: 3.4, etaMin: 25, rating: 4.7, deliveryFee: 180, open24h: true,  openNow: true },
  { id: 'ph03', name: 'صيدلية السلام',        area: 'باب الوادي، الجزائر', distanceKm: 2.1, etaMin: 20, rating: 4.6, deliveryFee: 150, open24h: false, openNow: true },
  { id: 'ph04', name: 'صيدلية الأمل',         area: 'بئر مراد رايس',       distanceKm: 4.0, etaMin: 28, rating: 4.5, deliveryFee: 200, open24h: true,  openNow: true },
  { id: 'ph05', name: 'صيدلية الحياة',        area: 'القبة، الجزائر',      distanceKm: 5.2, etaMin: 35, rating: 4.4, deliveryFee: 220, open24h: false, openNow: false },
]

export const medCategories: MedCategoryMeta[] = [
  { key: 'pain',      labelKey: 'meds.catPain',      icon: 'pill' },
  { key: 'cold',      labelKey: 'meds.catCold',      icon: 'bottle-tonic' },
  { key: 'digestive', labelKey: 'meds.catDigestive', icon: 'stomach' },
  { key: 'firstaid',  labelKey: 'meds.catFirstAid',  icon: 'medical-bag' },
  { key: 'baby',      labelKey: 'meds.catBaby',      icon: 'baby-bottle-outline' },
  { key: 'vitamins',  labelKey: 'meds.catVitamins',  icon: 'leaf' },
]

// Over-the-counter catalog (no prescription needed). Prices in DZD.
export const commonMeds: Med[] = [
  { id: 'm01', nameKey: 'med.m01', detailKey: 'med.m01.d', category: 'pain',      price: 120,  icon: 'pill',               rx: false },
  { id: 'm02', nameKey: 'med.m02', detailKey: 'med.m02.d', category: 'pain',      price: 180,  icon: 'pill',               rx: false },
  { id: 'm03', nameKey: 'med.m03', detailKey: 'med.m03.d', category: 'cold',      price: 350,  icon: 'bottle-tonic',       rx: false },
  { id: 'm04', nameKey: 'med.m04', detailKey: 'med.m04.d', category: 'cold',      price: 300,  icon: 'spray',              rx: false },
  { id: 'm05', nameKey: 'med.m05', detailKey: 'med.m05.d', category: 'digestive', price: 250,  icon: 'stomach',            rx: false },
  { id: 'm06', nameKey: 'med.m06', detailKey: 'med.m06.d', category: 'digestive', price: 120,  icon: 'cup-water',          rx: false },
  { id: 'm07', nameKey: 'med.m07', detailKey: 'med.m07.d', category: 'firstaid',  price: 150,  icon: 'bandage',            rx: false },
  { id: 'm08', nameKey: 'med.m08', detailKey: 'med.m08.d', category: 'firstaid',  price: 1200, icon: 'thermometer',        rx: false },
  { id: 'm09', nameKey: 'med.m09', detailKey: 'med.m09.d', category: 'firstaid',  price: 200,  icon: 'bottle-tonic-plus',  rx: false },
  { id: 'm10', nameKey: 'med.m10', detailKey: 'med.m10.d', category: 'firstaid',  price: 400,  icon: 'face-mask',          rx: false },
  { id: 'm11', nameKey: 'med.m11', detailKey: 'med.m11.d', category: 'baby',      price: 750,  icon: 'baby-bottle-outline', rx: false },
  { id: 'm12', nameKey: 'med.m12', detailKey: 'med.m12.d', category: 'vitamins',  price: 450,  icon: 'leaf',               rx: false },
  { id: 'm13', nameKey: 'med.m13', detailKey: 'med.m13.d', category: 'vitamins',  price: 500,  icon: 'leaf',               rx: false },
]

// The delivery rider assigned after an order is placed.
export const mockCourier = {
  name:       'كريم بلعيد',
  vehicleKey: 'courier.moto' as const,
  plate:      '00123-114-16',
  rating:     4.9,
  etaMin:     18,
}

// Flat platform fee added on top of the pharmacy delivery fee (mock).
export const SERVICE_FEE = 50

// Parcel sizes for the الطرود vertical. basePrice already includes the courier ride;
// SERVICE_FEE is added on top at checkout.
export interface ParcelType {
  id:        string
  labelKey:  TranslationKey
  hintKey:   TranslationKey
  icon:      string
  basePrice: number
}

export const parcelTypes: ParcelType[] = [
  { id: 'doc',     labelKey: 'parcel.doc',     hintKey: 'parcel.docHint',     icon: 'file-document-outline',  basePrice: 250 },
  { id: 'small',   labelKey: 'parcel.small',   hintKey: 'parcel.smallHint',   icon: 'package-variant-closed', basePrice: 350 },
  { id: 'medium',  labelKey: 'parcel.medium',  hintKey: 'parcel.mediumHint',  icon: 'package-variant',        basePrice: 550 },
  { id: 'large',   labelKey: 'parcel.large',   hintKey: 'parcel.largeHint',   icon: 'cube-outline',           basePrice: 800 },
  { id: 'fragile', labelKey: 'parcel.fragile', hintKey: 'parcel.fragileHint', icon: 'glass-fragile',          basePrice: 700 },
]
