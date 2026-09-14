import { api } from '@/api/client'
import type {
  AdminOverviewResponse,
  AdminPageResponse,
  AdminSessionDetail,
  AdminSessionsQueryParams,
  AdminSessionSummary,
  AdminUserDetail,
  AdminUsersQueryParams,
  AdminUserSummary,
  UpdateUserStatusRequest,
} from '@/types/admin'
import type { InterviewTemplate } from '@/types/template'

export async function getAdminOverview(days: number = 7): Promise<AdminOverviewResponse> {
  const res = await api.get<AdminOverviewResponse>('/admin/overview', {
    params: { days },
  })
  return res.data
}

export async function getAdminUsers(
  params?: AdminUsersQueryParams,
): Promise<AdminPageResponse<AdminUserSummary>> {
  const res = await api.get<AdminPageResponse<AdminUserSummary>>('/admin/users', {
    params,
  })
  return res.data
}

export async function getAdminUserDetail(userId: number): Promise<AdminUserDetail> {
  const res = await api.get<AdminUserDetail>(`/admin/users/${userId}`)
  return res.data
}

export async function updateUserStatus(
  userId: number,
  enabled: boolean,
): Promise<AdminUserDetail> {
  const payload: UpdateUserStatusRequest = { enabled }
  const res = await api.patch<AdminUserDetail>(`/admin/users/${userId}/status`, payload)
  return res.data
}

export async function getAdminSessions(
  params?: AdminSessionsQueryParams,
): Promise<AdminPageResponse<AdminSessionSummary>> {
  const res = await api.get<AdminPageResponse<AdminSessionSummary>>(
    '/admin/interview-sessions',
    { params },
  )
  return res.data
}

export async function getAdminSessionDetail(
  sessionId: number,
): Promise<AdminSessionDetail> {
  const res = await api.get<AdminSessionDetail>(`/admin/interview-sessions/${sessionId}`)
  return res.data
}

export async function retryAdminPreparation(
  sessionId: number,
): Promise<AdminSessionDetail> {
  const res = await api.post<AdminSessionDetail>(
    `/admin/interview-sessions/${sessionId}/preparation/retry`,
  )
  return res.data
}

export async function retryAdminScoring(
  sessionId: number,
): Promise<AdminSessionDetail> {
  const res = await api.post<AdminSessionDetail>(
    `/admin/interview-sessions/${sessionId}/scoring/retry`,
  )
  return res.data
}

export async function publishTemplate(
  templateId: number,
  expectedVersion: number,
): Promise<InterviewTemplate> {
  const res = await api.post<InterviewTemplate>(
    `/interview-templates/${templateId}/publish`,
    { expectedVersion },
  )
  return res.data
}

export async function unpublishTemplate(
  templateId: number,
  expectedVersion: number,
): Promise<InterviewTemplate> {
  const res = await api.post<InterviewTemplate>(
    `/interview-templates/${templateId}/unpublish`,
    { expectedVersion },
  )
  return res.data
}
