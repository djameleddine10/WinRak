import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { type TranslationKey } from '../i18n/translations'

// WinRak electronic payment (الدفع الإلكتروني). Mock-only: no real PSP integration.
// The wallet balance, saved BaridiMob accounts and the local transaction
// ledger are persisted so top-ups and charges survive app restarts.

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

const seededTx: LocalTx[] = [
  { id: 't1', type: 'debit',  labelKey: 'wallet.tx.ride',         vars: { id: 'WR-8820' }, amount: 850,  date: '2026-06-15T14:49:00', method: 'baridimob' },
  { id: 't2', type: 'credit', labelKey: 'wallet.tx.topup',                                 amount: 2000, date: '2026-06-14T10:00:00', method: 'baridimob' },
  { id: 't3', type: 'debit',  labelKey: 'wallet.tx.ride',         vars: { id: 'WR-8821' }, amount: 420,  date: '2026-06-14T10:25:00', method: 'cash'      },
  { id: 't4', type: 'credit', labelKey: 'wallet.tx.loyaltyBonus',                          amount: 200,  date: '2026-06-12T09:00:00', method: 'wallet'    },
  { id: 't5', type: 'debit',  labelKey: 'wallet.tx.ride',         vars: { id: 'WR-8817' }, amount: 1200, date: '2026-06-13T13:30:00', method: 'baridimob' },
]

export const usePaymentStore = create<PaymentStore>()(
  persist(
    (set, get) => ({
      balance:      2450,
      points:       840,
      methods:      seededMethods,
      selectedId:   'pm-baridimob',
      transactions: seededTx,

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

      topUp: (amount) => set((s) => ({
        balance: s.balance + amount,
        transactions: [
          { id: newId(), type: 'credit', labelKey: 'wallet.tx.topup', amount, date: new Date().toISOString(), method: 'wallet' },
          ...s.transactions,
        ],
      })),

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
        return true
      },
    }),
    {
      name:    'winrak-payment',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
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
