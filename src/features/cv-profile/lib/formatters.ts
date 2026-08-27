export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toLocaleString('vi-VN', {
    maximumFractionDigits: 1,
  })} MB`
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(date)
}

export function formatYearRange(
  startYear: number | null,
  endYear: number | null,
): string | null {
  if (startYear === null && endYear === null) return null
  if (startYear !== null && endYear !== null) return `${startYear} – ${endYear}`
  return `${startYear ?? endYear}`
}

/** Tách `techStack` dạng chuỗi thành các chip để hiển thị; khi gửi lên vẫn ghép lại thành chuỗi. */
export function splitTechStack(techStack: string | null): string[] {
  if (!techStack) return []
  return techStack
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}
