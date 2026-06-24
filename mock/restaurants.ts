// WinRak food vertical — Restaurant types and helpers.
// All `icon` fields are valid MaterialCommunityIcons.

import { type TranslationKey } from '../i18n/translations'

export type Cuisine = 'fastfood' | 'pizza' | 'grill' | 'traditional' | 'seafood' | 'sweets'

export interface MenuItem {
  id:    string
  name:  string   // plain text (Arabic/French), not a translation key
  price: number
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

export const mockRestaurants: Restaurant[] = []

// Reception auto-replies (keys, resolved via t() at render time) — mock only.
export const receptionReplies: TranslationKey[] = [
  'rest.reply1',
  'rest.reply2',
  'rest.reply3',
  'rest.reply4',
]

// Key for the greeting message; vars { name, reception } are resolved by the caller.
export const receptionGreetingKey: TranslationKey = 'rest.greeting'
