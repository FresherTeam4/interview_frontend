export type JobDescriptionSourceType = 'TEXT' | 'FILE'
export type JobDescriptionStatus = 'DRAFT' | 'READY'

/** `GET /api/job-descriptions/{id}`, `PUT`, `POST .../confirm`. */
export interface JobDescription {
  id: number
  title: string
  sourceType: JobDescriptionSourceType
  status: JobDescriptionStatus
  originalFilename: string | null
  rawText: string | null
  confirmedText: string | null
  confirmedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Một dòng trong `GET /api/job-descriptions` (phân trang). */
export interface JobDescriptionSummary {
  id: number
  title: string
  sourceType: JobDescriptionSourceType
  status: JobDescriptionStatus
  originalFilename: string | null
  confirmedAt: string | null
  createdAt: string
  updatedAt: string
}

/** `GET /api/job-descriptions/{id}/file` — presigned URL, sống vài phút. */
export interface JobDescriptionFileUrl {
  url: string
  expiresAt: string
}

/** Body của `POST /api/job-descriptions/text`. */
export interface CreateTextJdRequest {
  title: string
  text: string | null
}

/** Body của `PUT /api/job-descriptions/{id}`. */
export interface UpdateJdRequest {
  title: string
  confirmedText: string | null
}

/** Wrapper phân trang generic — khớp `PageResponse<T>` của backend. */
export interface PageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
