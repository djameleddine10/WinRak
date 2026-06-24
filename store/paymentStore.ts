import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { type TranslationKey } from '../i18n/translations'
import { supabase } from '../lib/supabase'

export type PayMethodType = 'wallet' | 'baridimob' | 'cash'

export interface SavedMethod {
  id:        string
  type:      PayMethodType
  last4:     string | null   // null for wallet & cash
  isDefault: boolean
}

export interface LocalTx {
  id:       string
  type:     'debit' | 'credit'
  labelKey: TranslationKey
  vars?:    Record<string, string>
  amount:   number
  date:     string
  method:   PayMethodType
}

interface PaymentStore {
  balance:      number
  points:       number
  methods:      SavedMethod[]
  selectedId:   string
  transactions: LocalTx[]

  loadWallet:   (userId: string) => Promise<void>
  selectMethod: (id: string) => void
  setDefault:   (id: string) => void
  addCard:      (last4: string) => void
  removeCard:   (id: string) => void
  topUp:        (amount: number) => void
  /** Deducts from the wallet only when the selected method is `wallet`.
   *  Returns false if the wallet balance is insufficient (caller should block). */
  charge:       (amount: number, labelKey: TranslationKey, vars?: Record<string, string>) => boolean
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

const seededMethods: SavedMethod[] = [
  { id: 'pm-wallet',    type: 'wallet',    last4: null,   isDefault: false },
  { id: 'pm-baridimob', type: 'baridimob', last4: '5678', isDefault: true  },
  { id: 'pm-cash',      type: 'cash',      last4: null,   isDefault: false },
]

export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      balance:      0,
      points:       0,
      methods:      seededMethods,
      selectedId:   'pm-baridimob',
      transactions: [],

      loadWallet: async (userId: string) => {
        try {
          const [walletRes, txRes] = await Promise.all([
            supabase.rpc('get_passenger_wallet',      { p_user_id: userId }),
            supabase.rpc('get_passenger_transactions', { p_user_id: userId }),
          ])
          if (!walletRes.error && walletRes.data) {
            const w = Array.isArray(walletRes.data) ? walletRes.data[0] : walletRes.data
            if (w) set({ balance: w.balance ?? 0, points: w.points ?? 0 })
          }
          if (!txRes.error && txRes.data) {
            const rows = (txRes.data as any[]).map((r) => ({
              id:       r.id,
              type:     r.type as 'debit' | 'credit',
              labelKey: r.label_key as TranslationKey,
              vars:     r.vars ?? undefined,
              amount:   r.amount,
              date:     r.created_at,
              method:   r.method as any,
            }))
            set({ transactions: rows })
          }
        } catch (e) {
          console.warn('[Wallet] loadWallet failed', e)
        }
      },

      selectMethod: (id) => set({ selectedId: id }),

      setDefault: (id) => set((s) => ({
        methods: s.methods.map((m) => ({ ...m, isDefault: m.id === id })),
      })),

      addCard: (last4) => set((s) => {
        const card: SavedMethod = { id: newId(), type: 'baridimob', last4, isDefault: false }
        // Insert before cash to keep cash last.
        const cashIdx = s.methods.findIndex((m) => m.type === 'cash')
        const methods = [...s.methods]
        if (cashIdx >= 0) methods.splice(cashIdx, 0, card)
        else methods.push(card)
        return { methods, selectedId: card.id }
      }),

      removeCard: (id) => set((s) => {
        const target = s.methods.find((m) => m.id === id)
        // Built-in methods (wallet / cash) cannot be removed.
        if (!target || target.type === 'wallet' || target.type === 'cash') return s
        const methods = s.methods.filter((m) => m.id !== id)
        let selectedId = s.selectedId
        if (selectedId === id) selectedId = methods.find((m) => m.isDefault)?.id ?? methods[0].id
        // If we removed the default, promote the first BaridiMob or fall back to wallet.
        if (target.isDefault) {
          const promote = methods.find((m) => m.type === 'baridimob') ?? methods[0]
          return { methods: methods.map((m) => ({ ...m, isDefault: m.id === promote.id })), selectedId }
        }
        return { methods, selectedId }
      }),

      topUp: (amount) => {
        set((s) => ({
          balance: s.balance + amount,
          transactions: [
            { id: newId(), type: 'credit', labelKey: 'wallet.tx.topup', amount, date: new Date().toISOString(), method: 'wallet' },
            ...s.transactions,
          ],
        }))
        // Sync to Supabase (fire-and-forget)
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) supabase.rpc('wallet_topup', { p_user_id: data.user.id, p_amount: amount }).then(null, console.warn)
        })
      },

      charge: (amount, labelKey, vars) => {
        const s = get()
        const method = s.methods.find((m) => m.id === s.selectedId) ?? s.methods[0]
        if (method.type === 'wallet' && s.balance < amount) return false
        set({
          balance: method.type === 'wallet' ? s.balance - amount : s.balance,
          transactions: [
            { id: newId(), type: 'debit', labelKey, vars, amount, date: new Date().toISOString(), method: method.type },
            ...s.transactions,
          ],
        })
        // Sync to Supabase (fire-and-forget)
        supabase.auth.getUser().then(({ data }) => {
          if (data.user) supabase.rpc('wallet_charge', {
            p_user_id:   data.user.id,
            p_amount:    amount,
            p_label_key: labelKey,
            p_vars:      vars ? vars : null,
            p_method:    method.type,
          }).then(null, console.warn)
        })
        return true
      },
    }),
    {
      name:    'winrak-payment',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (state: any, version: number) => {
        if (version < 3) {
          // Clear seeded mock balance and transactions; keep saved payment methods.
          return { ...state, balance: 0, points: 0, transactions: [] }
        }
        return state
      },
      partialize: (s) => ({
        balance:      s.balance,
        points:       s.points,
        methods:      s.methods,
        selectedId:   s.selectedId,
        transactions: s.transactions,
      }),
    },
  ),
)

// ─── Derived helpers (outside the store, no re-render triggers) ───────────────
export function methodIcon(type: PayMethodType): string {
  switch (type) {
    case 'wallet':    return 'wallet'
    case 'cash':      return 'cash'
    case 'baridimob': return 'bank-transfer'
    default:          return 'credit-card'
  }
}

// wallet & cash resolve via i18n; BaridiMob is a brand name (not translated).
export function methodLabelKey(type: PayMethodType): TranslationKey | null {
  if (type === 'wallet') return 'payment.wallet'
  if (type === 'cash')   return 'payment.cash'
  return null
}

export function methodBrand(type: PayMethodType): string {
  if (type === 'baridimob') return 'BaridiMob'
  return ''
}

export function selectedMethod(s: { methods: SavedMethod[]; selectedId: string }): SavedMethod {
  return s.methods.find((m) => m.id === s.selectedId) ?? s.methods[0]
}
