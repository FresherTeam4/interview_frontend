import type { CvStatus } from '@/types/cv-profile'

export const cvStatusLabels: Record<CvStatus, string> = {
  UPLOADED: 'Đang chờ xử lý',
  PARSING: 'AI đang bóc tách',
  PARSED: 'Bóc tách thành công',
  FAILED: 'Bóc tách thất bại',
}

export const cvStatusDescriptions: Record<CvStatus, string> = {
  UPLOADED: 'CV đã lên máy chủ và đang chờ đến lượt xử lý.',
  PARSING: 'AI đang đọc nội dung CV và tạo hồ sơ ứng viên.',
  PARSED: 'Hồ sơ đã sẵn sàng để bạn kiểm tra và xác nhận.',
  FAILED: 'Lượt bóc tách gần nhất chưa thành công.',
}

export function isCvProcessing(status: CvStatus): boolean {
  return status === 'UPLOADED' || status === 'PARSING'
}

export function canDeleteCv(status: CvStatus): boolean {
  return status !== 'PARSING'
}

export function canRetryCvParse(status: CvStatus): boolean {
  return status === 'FAILED'
}
