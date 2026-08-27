import type { CvDocumentStatus } from '@/constants/cv'

/**
 * Một dòng của `GET /api/cvs`, cũng là body của `POST /api/cvs` và đích poll
 * `GET /api/cvs/{cvId}`.
 *
 * Backend không trả `active` nữa: danh sách chỉ chứa CV chưa xóa, nên cột đó luôn `true`.
 */
export interface CvDocument {
  id: number
  originalFilename: string
  contentType: string
  fileSizeBytes: number
  status: CvDocumentStatus
  /** Chỉ có giá trị khi status = FAILED, và viết cho người dùng đọc. */
  statusMessage: string | null
  uploadedAt: string
  parsedAt: string | null
  /** null khi chưa bóc tách xong hoặc bóc tách thất bại. */
  profileId: number | null
  profileConfirmed: boolean
  profileHeadline: string | null
}

/** `GET /api/cvs/{cvId}/file` — link presigned, sống 5 phút. */
export interface CvFileUrl {
  url: string
  expiresAt: string
}
