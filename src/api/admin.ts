import { api } from '@/api/client'
import type {
  AdminBulkSessionRequest,
  AdminBulkSessionResponse,
  AdminOverviewResponse,
  AdminPageResponse,
  AdminSessionActionRequest,
  AdminSessionDetail,
  AdminSessionDiagnosticsResponse,
  AdminSessionsQueryParams,
  AdminSessionSummary,
  AdminStaleSessionsQueryParams,
  AdminTemplateDetailResponse,
  AdminTemplateMetadataRequest,
  AdminTemplateReviewRequest,
  AdminTemplatesQueryParams,
  AdminTemplateSummaryResponse,
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

export async function getAdminStaleSessions(
  params: AdminStaleSessionsQueryParams,
): Promise<AdminPageResponse<AdminSessionSummary>> {
  const res = await api.get<AdminPageResponse<AdminSessionSummary>>(
    '/admin/interview-sessions/stale',
    { params },
  )
  return res.data
}

export async function getAdminSessionDiagnostics(
  sessionId: number,
): Promise<AdminSessionDiagnosticsResponse> {
  const res = await api.get<AdminSessionDiagnosticsResponse>(
    `/admin/interview-sessions/${sessionId}/diagnostics`,
  )
  return res.data
}

export async function forceCloseAdminSession(
  sessionId: number,
  request?: AdminSessionActionRequest,
): Promise<AdminSessionDetail> {
  const res = await api.post<AdminSessionDetail>(
    `/admin/interview-sessions/${sessionId}/force-close`,
    request,
  )
  return res.data
}

export async function terminateAdminSession(
  sessionId: number,
  request?: AdminSessionActionRequest,
): Promise<AdminSessionDetail> {
  const res = await api.post<AdminSessionDetail>(
    `/admin/interview-sessions/${sessionId}/terminate`,
    request,
  )
  return res.data
}

export async function bulkRetryAdminPreparation(
  request: AdminBulkSessionRequest,
): Promise<AdminBulkSessionResponse> {
  const res = await api.post<AdminBulkSessionResponse>(
    '/admin/interview-sessions/bulk/preparation/retry',
    request,
  )
  return res.data
}

export async function bulkRetryAdminScoring(
  request: AdminBulkSessionRequest,
): Promise<AdminBulkSessionResponse> {
  const res = await api.post<AdminBulkSessionResponse>(
    '/admin/interview-sessions/bulk/scoring/retry',
    request,
  )
  return res.data
}

export async function getAdminTemplates(
  params?: AdminTemplatesQueryParams,
): Promise<AdminPageResponse<AdminTemplateSummaryResponse>> {
  const res = await api.get<AdminPageResponse<AdminTemplateSummaryResponse>>(
    '/admin/templates',
    { params },
  )
  return res.data
}

export async function getAdminTemplateDetail(
  templateId: number,
): Promise<AdminTemplateDetailResponse> {
  const res = await api.get<AdminTemplateDetailResponse>(
    `/admin/templates/${templateId}`,
  )
  return res.data
}

export async function reviewAdminTemplate(
  templateId: number,
  request: AdminTemplateReviewRequest,
): Promise<AdminTemplateDetailResponse> {
  const res = await api.post<AdminTemplateDetailResponse>(
    `/admin/templates/${templateId}/review`,
    request,
  )
  return res.data
}

export async function updateAdminTemplateMetadata(
  templateId: number,
  request: AdminTemplateMetadataRequest,
): Promise<AdminTemplateDetailResponse> {
  const res = await api.patch<AdminTemplateDetailResponse>(
    `/admin/templates/${templateId}/metadata`,
    request,
  )
  return res.data
}

export async function adminPublishTemplate(
  templateId: number,
  expectedVersion: number,
): Promise<AdminTemplateDetailResponse> {
  const res = await api.post<AdminTemplateDetailResponse>(
    `/admin/templates/${templateId}/publish`,
    { expectedVersion },
  )
  return res.data
}

export async function adminUnpublishTemplate(
  templateId: number,
  expectedVersion: number,
): Promise<AdminTemplateDetailResponse> {
  const res = await api.post<AdminTemplateDetailResponse>(
    `/admin/templates/${templateId}/unpublish`,
    { expectedVersion },
  )
  return res.data
}

