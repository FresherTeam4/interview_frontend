export const CV_STATUS = {
  UPLOADED: 'UPLOADED',
  PARSING: 'PARSING',
  PARSED: 'PARSED',
  FAILED: 'FAILED',
} as const

export type CvDocumentStatus = (typeof CV_STATUS)[keyof typeof CV_STATUS]

export const CV_STATUS_LABEL: Record<CvDocumentStatus, string> = {
  UPLOADED: 'Chờ trích xuất',
  PARSING: 'Đang trích xuất',
  PARSED: 'Đã trích xuất',
  FAILED: 'Trích xuất lỗi',
}

/** UPLOADED = đang xếp hàng, PARSING = đang chạy — cả hai đều cần poll lại. */
export const CV_IN_PROGRESS_STATUSES: CvDocumentStatus[] = [CV_STATUS.UPLOADED, CV_STATUS.PARSING]

// Ba hằng dưới đây khớp app.cv.* của backend để chặn sớm ở client, thay vì đợi 4xx.
export const CV_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
export const CV_MAX_PAGES = 10
export const CV_MAX_PER_USER = 10

export const CV_ACCEPTED_MIME = 'application/pdf'
