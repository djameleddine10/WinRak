import { create } from 'zustand'
import {
  mockRestaurants, cuisineMeta, receptionReplies, receptionGreetingKey,
  type Restaurant, type Cuisine,
} from '../mock/restaurants'
import { type TranslationKey } from '../i18n/translations'

export type RegStatus = 'idle' | 'pending' | 'approved'

export interface ChatMessage {
  id:   string
  from: 'me' | 'reception'
  text: string                          // plain text for user messages
  key?: TranslationKey                  // i18n key for reception messages
  vars?: Record<string, string>         // interpolation vars for reception messages
  time: string
}

interface RegForm {
  name:      string
  cuisine:   Cuisine | ''
  area:      string
  phone:     string
  reception: string
  logoUri:   string | null
}

const emptyForm: RegForm = { name: '', cuisine: '', area: '', phone: '', reception: '', logoUri: null }

interface RestaurantStore {
  registered: Restaurant[]                    // restaurants the user signed up this session
  regStatus:  RegStatus
  form:       RegForm
  chats:      Record<string, ChatMessage[]>   // keyed by restaurant id

  updateForm:          (field: keyof RegForm, value: string) => void
  setLogo:             (uri: string) => void
  submitRegistration:  () => void
  approveRegistration: () => void
  resetForm:           () => void
  ensureChat:          (r: Restaurant) => void
  sendMessage:         (restaurantId: string, text: string) => void
}

function now() {
  const d = new Date()
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

export const useRestaurantStore = create<RestaurantStore>((set, get) => ({
  registered: [],
  regStatus:  'idle',
  form:       { ...emptyForm },
  chats:      {},

  updateForm: (field, value) => set((s) => ({ form: { ...s.form, [field]: value } })),
  setLogo:    (uri) => set((s) => ({ form: { ...s.form, logoUri: uri } })),

  submitRegistration: () => set({ regStatus: 'pending' }),

  // Mock approval (skips the real review): turns the form into a live restaurant that
  // shows up in the app, then clears the form.
  approveRegistration: () => {
    const f = get().form
    const cuisine = (f.cuisine || 'fastfood') as Cuisine
    const meta = cuisineMeta(cuisine)
    const restaurant: Restaurant = {
      id:              `usr-${id()}`,
      name:            f.name || 'مطعمي',
      cuisine,
      cuisineLabelKey: meta.labelKey,
      area:            f.area || 'الجزائر',
      rating:          5.0,
      etaMin:          30,
      deliveryFee:     150,
      isOpen:          true,
      phone:           f.phone || '+213 5XX XX XX XX',
      reception:       f.reception || 'الاستقبال',
      icon:            meta.icon,
      menu:            [],
    }
    set((s) => ({ registered: [restaurant, ...s.registered], regStatus: 'approved', form: { ...emptyForm } }))
  },

  resetForm: () => set({ form: { ...emptyForm }, regStatus: 'idle' }),

  ensureChat: (r) => set((s) => {
    if (s.chats[r.id]?.length) return s
    return {
      chats: {
        ...s.chats,
        [r.id]: [{
          id:   id(),
          from: 'reception',
          text: '',
          key:  receptionGreetingKey,
          vars: { name: r.name, reception: r.reception },
          time: now(),
        }],
      },
    }
  }),

  sendMessage: (restaurantId, text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    set((s) => ({
      chats: {
        ...s.chats,
        [restaurantId]: [...(s.chats[restaurantId] ?? []), { id: id(), from: 'me', text: trimmed, time: now() }],
      },
    }))
    // Reception replies shortly after (mock).
    setTimeout(() => {
      set((s) => {
        const thread = s.chats[restaurantId] ?? []
        const replyCount = thread.filter((m) => m.from === 'reception').length
        const replyKey = receptionReplies[(replyCount - 1 + receptionReplies.length) % receptionReplies.length]
        return {
          chats: {
            ...s.chats,
            [restaurantId]: [...thread, { id: id(), from: 'reception', text: '', key: replyKey, time: now() }],
          },
        }
      })
    }, 1100)
  },
}))

// Visible list = user-registered restaurants first, then the seeded ones.
export function allRestaurants(registered: Restaurant[]) {
  return [...registered, ...mockRestaurants]
}
