import { type TranslationKey } from '../i18n/translations'

export type AppNotification = {
  id: string
  type: 'ride_completed' | 'promo' | 'sos_resolved'
  titleKey: TranslationKey
  bodyKey: TranslationKey
  time: string
  read: boolean
}

export const mockNotifications: AppNotification[] = []

export const mockNotificationsFilled: AppNotification[] = [
  { id: 'n1', type: 'ride_completed', titleKey: 'notif.n1.title', bodyKey: 'notif.n1.body', time: '2026-06-15T14:49:00', read: false },
  { id: 'n2', type: 'promo',          titleKey: 'notif.n2.title', bodyKey: 'notif.n2.body', time: '2026-06-14T10:00:00', read: true  },
  { id: 'n3', type: 'sos_resolved',   titleKey: 'notif.n3.title', bodyKey: 'notif.n3.body', time: '2026-06-13T18:00:00', read: true  },
]
