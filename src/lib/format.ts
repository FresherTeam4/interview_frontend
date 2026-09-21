import { format, formatDistanceToNow, isValid } from 'date-fns'
import { vi } from 'date-fns/locale'

function parseDateSafe(value: string | number | Date | null | undefined): Date | null {
  if (!value) return null
  const date = typeof value === 'object' && value instanceof Date ? value : new Date(value)
  return isValid(date) ? date : null
}

/**
 * Định dạng ngày giờ: "14:30 18/09/2026"
 */
export function formatDateTime(value: string | number | Date | null | undefined, pattern = 'HH:mm dd/MM/yyyy'): string {
  const date = parseDateSafe(value)
  if (!date) return '—'
  return format(date, pattern, { locale: vi })
}

/**
 * Định dạng ngày: "18/09/2026"
 */
export function formatDate(value: string | number | Date | null | undefined, pattern = 'dd/MM/yyyy'): string {
  const date = parseDateSafe(value)
  if (!date) return '—'
  return format(date, pattern, { locale: vi })
}

/**
 * Định dạng giờ: "14:30"
 */
export function formatTime(value: string | number | Date | null | undefined, pattern = 'HH:mm'): string {
  const date = parseDateSafe(value)
  if (!date) return '—'
  return format(date, pattern, { locale: vi })
}

/**
 * Định dạng thời gian tương đối: "5 phút trước", "khoảng 1 giờ trước"
 */
export function formatRelativeTime(value: string | number | Date | null | undefined): string {
  const date = parseDateSafe(value)
  if (!date) return '—'
  return formatDistanceToNow(date, { addSuffix: true, locale: vi })
}

/**
 * Định dạng thời lượng: mm:ss (ví dụ: "05:42")
 */
export function formatDurationSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00'
  const mins = Math.floor(totalSeconds / 60)
  const secs = Math.floor(totalSeconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * Định dạng kích thước file: B, KB, MB
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) return `${Math.round(kilobytes)} KB`
  return `${(kilobytes / 1024).toFixed(1).replace('.', ',')} MB`
}
