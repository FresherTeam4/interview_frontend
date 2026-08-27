import { api } from '@/api/client'
import type { CvDocument, CvFileUrl } from '@/types/cv-profile'

export async function getCvs(): Promise<CvDocument[]> {
  const response = await api.get<CvDocument[]>('/cvs')
  return response.data
}

export async function uploadCv(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<CvDocument> {
  const response = await api.postForm<CvDocument>(
    '/cvs',
    { file },
    {
      onUploadProgress: (event) => {
        if (event.total) {
          onProgress?.(Math.round((event.loaded * 100) / event.total))
        }
      },
    },
  )

  return response.data
}

export async function getCv(cvId: number): Promise<CvDocument> {
  const response = await api.get<CvDocument>(`/cvs/${cvId}`)
  return response.data
}

export async function getCvFileUrl(cvId: number): Promise<CvFileUrl> {
  const response = await api.get<CvFileUrl>(`/cvs/${cvId}/file`)
  return response.data
}

export async function retryCvParse(cvId: number): Promise<CvDocument> {
  const response = await api.post<CvDocument>(`/cvs/${cvId}/parse`)
  return response.data
}

export async function deleteCv(cvId: number): Promise<void> {
  await api.delete(`/cvs/${cvId}`)
}
