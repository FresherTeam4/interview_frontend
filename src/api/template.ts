import { api } from '@/api/client'
import type {
  InterviewTemplate,
  InterviewTemplateSummary,
  UpdateInterviewTemplateRequest,
  InterviewSessionOptions,
  TemplatePageResponse,
} from '@/types/template'

export async function getInterviewTemplates(
  scope: 'mine' | 'public' = 'mine',
  page = 0,
  size = 20,
): Promise<TemplatePageResponse<InterviewTemplateSummary>> {
  const res = await api.get<TemplatePageResponse<InterviewTemplateSummary>>('/interview-templates', {
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

export async function publishInterviewTemplate(
  id: number,
  expectedVersion: number,
): Promise<InterviewTemplate> {
  const res = await api.post<InterviewTemplate>(`/interview-templates/${id}/publish`, {
    expectedVersion,
  })
  return res.data
}

export async function unpublishInterviewTemplate(
  id: number,
  expectedVersion: number,
): Promise<InterviewTemplate> {
  const res = await api.post<InterviewTemplate>(`/interview-templates/${id}/unpublish`, {
    expectedVersion,
  })
  return res.data
}

export async function archiveInterviewTemplate(
  id: number,
  expectedVersion: number,
): Promise<InterviewTemplate> {
  const res = await api.post<InterviewTemplate>(`/interview-templates/${id}/archive`, {
    expectedVersion,
  })
  return res.data
}

export async function getInterviewSessionOptions(): Promise<InterviewSessionOptions> {
  const res = await api.get<InterviewSessionOptions>('/interview-session-options')
  return res.data
}
