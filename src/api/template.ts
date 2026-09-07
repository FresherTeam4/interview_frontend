import { api } from '@/api/client'
import type {
  InterviewTemplate,
  InterviewTemplateSummary,
  UpdateInterviewTemplateRequest,
  InterviewSessionOptions,
} from '@/types/template'
import type { PageResponse } from '@/types/jd'

export async function getInterviewTemplates(
  scope: 'mine' | 'public' = 'mine',
  page = 0,
  size = 20,
): Promise<PageResponse<InterviewTemplateSummary>> {
  const res = await api.get<PageResponse<InterviewTemplateSummary>>('/interview-templates', {
    params: { scope, page, size },
  })
  return res.data
}

export async function getInterviewTemplate(id: number): Promise<InterviewTemplate> {
  const res = await api.get<InterviewTemplate>(`/interview-templates/${id}`)
  return res.data
}

export async function updateInterviewTemplate(
  id: number,
  data: UpdateInterviewTemplateRequest,
): Promise<InterviewTemplate> {
  const res = await api.put<InterviewTemplate>(`/interview-templates/${id}`, data)
  return res.data
}

export async function confirmInterviewTemplate(
  id: number,
  expectedVersion: number,
): Promise<InterviewTemplate> {
  const res = await api.post<InterviewTemplate>(`/interview-templates/${id}/confirm`, {
    expectedVersion,
  })
  return res.data
}

export async function getInterviewSessionOptions(): Promise<InterviewSessionOptions> {
  const res = await api.get<InterviewSessionOptions>('/interview-session-options')
  return res.data
}
