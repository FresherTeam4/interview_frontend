import type { JobDescriptionSourceType, JobDescriptionStatus } from '@/types/jd'

export const JD_STATUS = {
  DRAFT: 'DRAFT',
  READY: 'READY',
} as const

export const JD_STATUS_LABEL: Record<JobDescriptionStatus, string> = {
  DRAFT: 'Bản nháp',
  UPLOADED: 'Đã tải lên',
  EXTRACTING: 'Đang trích xuất',
  ANALYZING: 'Đang phân tích AI',
  READY: 'Đã sẵn sàng',
  FAILED: 'Thất bại',
}

export const JD_SOURCE_TYPE_LABEL: Record<JobDescriptionSourceType, string> = {
  TEXT: 'Nhập text',
  FILE: 'Tải file',
}

export const JD_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const JD_ACCEPTED_MIMES = ['application/pdf', 'text/plain']
export const JD_ACCEPTED_EXTENSIONS = '.pdf,.txt'
export const JD_TITLE_MAX_LENGTH = 200
export const JD_MAX_PAGE_SIZE = 50
