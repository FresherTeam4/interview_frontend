import { api } from '@/api/client'
import type {
  CreateTextJdRequest,
  JobDescription,
  JobDescriptionFileUrl,
  JobDescriptionSummary,
  PageResponse,
  UpdateJdRequest,
} from '@/types/jd'

const UPLOAD_TIMEOUT_MS = 60_000

export async function createTextJd(data: CreateTextJdRequest): Promise<JobDescription> {
  const res = await api.post<JobDescription>('/job-descriptions', {
    title: data.title,
    text: data.text,
  })
  return {
    ...res.data,
    title: res.data.title || res.data.templateTitle || data.title,
  }
}

export async function createFileJd(title: string, file: File): Promise<JobDescription> {
  const formData = new FormData()
  formData.append('file', file)
  if (title) {
    formData.append('title', title)
  }

  const res = await api.post<JobDescription>('/job-descriptions', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: UPLOAD_TIMEOUT_MS,
  })
  return {
    ...res.data,
    title: res.data.title || res.data.templateTitle || title,
  }
}

export async function getJobDescriptions(
  page = 0,
  size = 10,
): Promise<PageResponse<JobDescriptionSummary>> {
  const res = await api.get<PageResponse<JobDescriptionSummary>>('/job-descriptions', {
    params: { page, size },
  })
  return res.data
}

export async function getJobDescription(id: number): Promise<JobDescription> {
  const res = await api.get<JobDescription>(`/job-descriptions/${id}`)
  return {
    ...res.data,
    title: res.data.title || res.data.templateTitle || res.data.originalFilename || 'Mô tả công việc',
  }
}

export async function updateJobDescription(
  id: number,
  data: UpdateJdRequest,
): Promise<JobDescription> {
  const res = await api.put<JobDescription>(`/job-descriptions/${id}`, data)
  return res.data
}

export async function confirmJobDescription(id: number): Promise<JobDescription> {
  const res = await api.post<JobDescription>(`/job-descriptions/${id}/confirm`)
  return res.data
}

export async function deleteJobDescription(id: number): Promise<void> {
  await api.delete(`/job-descriptions/${id}`)
}

export async function getJdFileUrl(id: number): Promise<JobDescriptionFileUrl> {
  const res = await api.get<JobDescriptionFileUrl>(`/job-descriptions/${id}/file`)
  return res.data
}
