import { api } from '@/api/client'
import type { CvDocument, CvFileUrl } from '@/types/cv'

// Chỉ upload cần nới timeout (file 5 MB qua đường lên chậm). Trích xuất chạy nền ở backend nên
// mọi request khác trả về ngay, dùng timeout 15s mặc định của client là đủ.
const UPLOAD_TIMEOUT_MS = 60_000

export async function getCvDocuments(): Promise<CvDocument[]> {
  const res = await api.get<CvDocument[]>('/cvs')
  return res.data
}

export async function getCvDocument(cvId: number): Promise<CvDocument> {
  const res = await api.get<CvDocument>(`/cvs/${cvId}`)
  return res.data
}

/**
 * Tải CV lên. Backend trả 202 khi đã xếp hàng trích xuất, hoặc 200 kèm CV cũ khi đúng bộ byte đó
 * đã trích xuất trước đó — đọc `status` trong body là biết còn phải poll hay không.
 */
export async function uploadCv(file: File): Promise<CvDocument> {
  const formData = new FormData()
  formData.append('file', file)

  // Bắt buộc ghi đè Content-Type: nếu vẫn là application/json thì axios sẽ JSON hoá FormData
  // và mất file. Khi đặt 'multipart/form-data', axios xoá header để browser tự thêm boundary.
  const res = await api.post<CvDocument>('/cvs', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  })
  return res.data
}

/** Chỉ dùng được cho CV đang FAILED; PARSING/PARSED trả 409. */
export async function retryParseCv(cvId: number): Promise<CvDocument> {
  const res = await api.post<CvDocument>(`/cvs/${cvId}/parse`)
  return res.data
}

export async function getCvFileUrl(cvId: number): Promise<CvFileUrl> {
  const res = await api.get<CvFileUrl>(`/cvs/${cvId}/file`)
  return res.data
}

/** Xóa mềm; CV đang PARSING trả 409. */
export async function deleteCv(cvId: number): Promise<void> {
  await api.delete(`/cvs/${cvId}`)
}
