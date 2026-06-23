import { type TranslationKey } from '../i18n/translations'

export interface Transaction {
  id:       string
  type:     'debit' | 'credit'
  labelKey: TranslationKey
  vars?:    Record<string, string>
  amount:   number
  date:     string
  method:   string
  icon:     string
}

export interface PaymentMethod {
  id:        string
  type:      string
  label:     string
  labelKey?: TranslationKey
  last4:     string | null
  isDefault: boolean
}

export const mockWallet: {
  balance:        number
  points:         number
  transactions:   Transaction[]
  paymentMethods: PaymentMethod[]
} = {
  balance: 2450,
  points:  840,
  transactions: [
    { id: 't1', type: 'debit',  labelKey: 'wallet.tx.ride',         vars: { id: 'WR-8820' }, amount: 850,  date: '2026-06-15T14:49:00', method: 'cib',      icon: 'car'    },
    { id: 't2', type: 'credit', labelKey: 'wallet.tx.topup',                                  amount: 2000, date: '2026-06-14T10:00:00', method: 'edahabia', icon: 'topup'  },
    { id: 't3', type: 'debit',  labelKey: 'wallet.tx.ride',         vars: { id: 'WR-8821' }, amount: 420,  date: '2026-06-14T10:25:00', method: 'cash',     icon: 'car'    },
    { id: 't4', type: 'credit', labelKey: 'wallet.tx.loyaltyBonus',                           amount: 200,  date: '2026-06-12T09:00:00', method: 'points',   icon: 'gift'   },
    { id: 't5', type: 'debit',  labelKey: 'wallet.tx.ride',         vars: { id: 'WR-8817' }, amount: 1200, date: '2026-06-13T13:30:00', method: 'edahabia', icon: 'car'    },
    { id: 't6', type: 'credit', labelKey: 'wallet.tx.refund',                                 amount: 420,  date: '2026-06-14T11:00:00', method: 'wallet',   icon: 'refund' },
  ],
  paymentMethods: [
    { id: 'pm1', type: 'cib',      label: 'CIB',      last4: '4521', isDefault: true  },
    { id: 'pm2', type: 'edahabia', label: 'Edahabia', last4: '8833', isDefault: false },
    { id: 'pm3', type: 'cash',     label: '',         labelKey: 'payment.cash', last4: null, isDefault: false },
  ],
}
