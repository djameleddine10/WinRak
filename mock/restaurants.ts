// Mock data for the WinRak food vertical (المطاعم). Restaurants register to appear in
// the app; a customer opens one and orders by talking to its reception (la réception).
// All `icon` fields are valid MaterialCommunityIcons.

import { type TranslationKey } from '../i18n/translations'

export type Cuisine = 'fastfood' | 'pizza' | 'grill' | 'traditional' | 'seafood' | 'sweets'

export interface MenuItem {
  id:      string
  nameKey: TranslationKey
  price:   number
}

export interface Restaurant {
  id:              string
  name:            string
  cuisine:         Cuisine
  cuisineLabelKey: TranslationKey
  area:            string
  rating:          number
  etaMin:          number
  deliveryFee:     number
  isOpen:          boolean
  phone:           string
  reception:       string   // the réception host the customer chats with
  icon:            string
  menu:            MenuItem[]
}

export const cuisines: { key: Cuisine; labelKey: TranslationKey; icon: string }[] = [
  { key: 'fastfood',    labelKey: 'rest.catFastfood',    icon: 'hamburger' },
  { key: 'pizza',       labelKey: 'rest.catPizza',       icon: 'pizza' },
  { key: 'grill',       labelKey: 'rest.catGrill',       icon: 'grill' },
  { key: 'traditional', labelKey: 'rest.catTraditional', icon: 'pot-steam' },
  { key: 'seafood',     labelKey: 'rest.catSeafood',     icon: 'fish' },
  { key: 'sweets',      labelKey: 'rest.catSweets',      icon: 'cupcake' },
]

export const cuisineMeta = (c: Cuisine) => cuisines.find((x) => x.key === c) ?? cuisines[0]

export const mockRestaurants: Restaurant[] = [
  {
    id: 'r01', name: 'مطعم البركة', cuisine: 'traditional', cuisineLabelKey: 'rest.catTraditional',
    area: 'الجزائر الوسطى', rating: 4.8, etaMin: 30, deliveryFee: 150, isOpen: true,
    phone: '+213 555 11 22 33', reception: 'سمير', icon: 'pot-steam',
    menu: [
      { id: 'r01m1', nameKey: 'rest.r01m1', price: 800 },
      { id: 'r01m2', nameKey: 'rest.r01m2', price: 650 },
      { id: 'r01m3', nameKey: 'rest.r01m3', price: 200 },
      { id: 'r01m4', nameKey: 'rest.r01m4', price: 300 },
    ],
  },
  {
    id: 'r02', name: 'بيتزا روما', cuisine: 'pizza', cuisineLabelKey: 'rest.catPizza',
    area: 'حيدرة', rating: 4.7, etaMin: 25, deliveryFee: 180, isOpen: true,
    phone: '+213 555 44 55 66', reception: 'نبيل', icon: 'pizza',
    menu: [
      { id: 'r02m1', nameKey: 'rest.r02m1', price: 700 },
      { id: 'r02m2', nameKey: 'rest.r02m2', price: 950 },
      { id: 'r02m3', nameKey: 'rest.r02m3', price: 600 },
    ],
  },
  {
    id: 'r03', name: 'سناك الأصيل', cuisine: 'fastfood', cuisineLabelKey: 'rest.catFastfood',
    area: 'باب الزوار', rating: 4.5, etaMin: 20, deliveryFee: 120, isOpen: true,
    phone: '+213 555 77 88 99', reception: 'ياسين', icon: 'hamburger',
    menu: [
      { id: 'r03m1', nameKey: 'rest.r03m1', price: 450 },
      { id: 'r03m2', nameKey: 'rest.r03m2', price: 350 },
      { id: 'r03m3', nameKey: 'rest.r03m3', price: 600 },
    ],
  },
  {
    id: 'r04', name: 'مشاوي الفردوس', cuisine: 'grill', cuisineLabelKey: 'rest.catGrill',
    area: 'القبة', rating: 4.9, etaMin: 35, deliveryFee: 200, isOpen: true,
    phone: '+213 555 10 20 30', reception: 'كمال', icon: 'grill',
    menu: [
      { id: 'r04m1', nameKey: 'rest.r04m1', price: 1200 },
      { id: 'r04m2', nameKey: 'rest.r04m2', price: 900 },
      { id: 'r04m3', nameKey: 'rest.r04m3', price: 800 },
    ],
  },
  {
    id: 'r05', name: 'حلويات اللوز', cuisine: 'sweets', cuisineLabelKey: 'rest.catSweets',
    area: 'بئر مراد رايس', rating: 4.6, etaMin: 25, deliveryFee: 100, isOpen: false,
    phone: '+213 555 40 50 60', reception: 'أمين', icon: 'cupcake',
    menu: [
      { id: 'r05m1', nameKey: 'rest.r05m1', price: 600 },
      { id: 'r05m2', nameKey: 'rest.r05m2', price: 1400 },
      { id: 'r05m3', nameKey: 'rest.r05m3', price: 500 },
    ],
  },
]

// Reception auto-replies (keys, resolved via t() at render time) — mock only.
export const receptionReplies: TranslationKey[] = [
  'rest.reply1',
  'rest.reply2',
  'rest.reply3',
  'rest.reply4',
]

// Key for the greeting message; vars { name, reception } are resolved by the caller.
export const receptionGreetingKey: TranslationKey = 'rest.greeting'
