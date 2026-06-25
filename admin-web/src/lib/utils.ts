import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDZD(amount: number): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' DZD'
}

export function formatDate(date: string): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr })
}

export function formatDateShort(date: string): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

export function formatRelative(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })
}

export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
    case 'completed':
      return 'badge-success'
    case 'pending':
    case 'in_progress':
    case 'accepted':
      return 'badge-warning'
    case 'suspended':
    case 'cancelled':
      return 'badge-danger'
    case 'requested':
      return 'badge-primary'
    default:
      return 'badge-muted'
  }
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Actif',
    pending: 'En attente',
    suspended: 'Suspendu',
    completed: 'Terminée',
    cancelled: 'Annulée',
    in_progress: 'En cours',
    accepted: 'Acceptée',
    requested: 'Demandée',
    passenger: 'Passager',
    women: 'Femmes',
    delivery: 'Livraison',
    pharmacy: 'Pharmacie',
    food: 'Restaurant',
  }
  return labels[status] || status
}

export function getRideTypeColor(type: string): string {
  const colors: Record<string, string> = {
    passenger: 'badge-primary',
    women: 'badge-warning',
    delivery: 'badge-success',
    pharmacy: 'badge-danger',
    food: 'badge-muted',
  }
  return colors[type] || 'badge-muted'
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
