import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/api-error'
import {
  adminPublishTemplate,
  adminUnpublishTemplate,
  bulkRetryAdminPreparation,
  bulkRetryAdminScoring,
  forceCloseAdminSession,
  getAdminOverview,
  getAdminSessionDetail,
  getAdminSessionDiagnostics,
  getAdminSessions,
  getAdminStaleSessions,
  getAdminTemplateDetail,
  getAdminTemplates,
  getAdminUserDetail,
  getAdminUsers,
  publishTemplate,
  retryAdminPreparation,
  retryAdminScoring,
  reviewAdminTemplate,
  terminateAdminSession,
  unpublishTemplate,
  updateAdminTemplateMetadata,
  updateUserStatus,
} from '@/api/admin'
import { QUERY_KEYS } from '@/constants/query-keys'
import type {
  AdminBulkSessionRequest,
  AdminSessionActionRequest,
  AdminSessionsQueryParams,
  AdminStaleSessionsQueryParams,
  AdminTemplateMetadataRequest,
  AdminTemplateReviewRequest,
  AdminTemplatesQueryParams,
  AdminUsersQueryParams,
} from '@/types/admin'


export function useAdminOverview(days: number = 7) {
  return useQuery({
    queryKey: QUERY_KEYS.adminOverview(days),
    queryFn: () => getAdminOverview(days),
    staleTime: 30_000,
  })
}

export function useAdminUsers(params: AdminUsersQueryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.adminUsers(params),
    queryFn: () => getAdminUsers(params),
    staleTime: 15_000,
  })
}

export function useAdminUserDetail(userId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.adminUserDetail(userId ?? 0),
    queryFn: () => (userId ? getAdminUserDetail(userId) : Promise.reject('No userId')),
    enabled: Boolean(userId),
    staleTime: 15_000,
  })
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, enabled }: { userId: number; enabled: boolean }) =>
      updateUserStatus(userId, enabled),
    onSuccess: (updatedUser) => {
      toast.success(
        updatedUser.enabled
          ? `Đã mở khóa tài khoản: ${updatedUser.fullName || updatedUser.email}`
          : `Đã khóa tài khoản: ${updatedUser.fullName || updatedUser.email}`,
      )
      void queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Cập nhật trạng thái thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminSessions(params: AdminSessionsQueryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.adminSessions(params),
    queryFn: () => getAdminSessions(params),
    staleTime: 15_000,
  })
}

export function useAdminSessionDetail(sessionId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.adminSessionDetail(sessionId ?? 0),
    queryFn: () =>
      sessionId ? getAdminSessionDetail(sessionId) : Promise.reject('No sessionId'),
    enabled: Boolean(sessionId),
    staleTime: 10_000,
  })
}

export function useAdminRetryPreparation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: number) => retryAdminPreparation(sessionId),
    onSuccess: (_, sessionId) => {
      toast.success('Đã gửi yêu cầu thử lại chuẩn bị phiên phỏng vấn (Preparation)')
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminSessionDetail(sessionId),
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Thử lại chuẩn bị thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminRetryScoring() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: number) => retryAdminScoring(sessionId),
    onSuccess: (_, sessionId) => {
      toast.success('Đã gửi yêu cầu thử lại chấm điểm phiên phỏng vấn (Scoring)')
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminSessionDetail(sessionId),
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Thử lại chấm điểm thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminPublishTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      expectedVersion,
    }: {
      templateId: number
      expectedVersion: number
    }) => publishTemplate(templateId, expectedVersion),
    onSuccess: (template) => {
      toast.success(`Đã công khai mẫu phỏng vấn: ${template.title}`)
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Công khai mẫu thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminUnpublishTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      expectedVersion,
    }: {
      templateId: number
      expectedVersion: number
    }) => unpublishTemplate(templateId, expectedVersion),
    onSuccess: (template) => {
      toast.success(`Đã hủy công khai mẫu phỏng vấn: ${template.title}`)
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Hủy công khai mẫu thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminStaleSessions(params: AdminStaleSessionsQueryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.adminStaleSessions(params),
    queryFn: () => getAdminStaleSessions(params),
    staleTime: 10_000,
  })
}

export function useAdminSessionDiagnostics(sessionId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.adminSessionDiagnostics(sessionId ?? 0),
    queryFn: () =>
      sessionId ? getAdminSessionDiagnostics(sessionId) : Promise.reject('No sessionId'),
    enabled: Boolean(sessionId),
    staleTime: 5_000,
  })
}

export function useAdminForceCloseSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      request,
    }: {
      sessionId: number
      request?: AdminSessionActionRequest
    }) => forceCloseAdminSession(sessionId, request),
    onSuccess: (_, { sessionId }) => {
      toast.success(`Đã buộc kết thúc phiên #${sessionId} và chuyển sang chấm điểm`)
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminSessionDetail(sessionId),
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Buộc kết thúc phiên thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminTerminateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      request,
    }: {
      sessionId: number
      request?: AdminSessionActionRequest
    }) => terminateAdminSession(sessionId, request),
    onSuccess: (_, { sessionId }) => {
      toast.success(`Đã hủy/dừng khẩn cấp phiên #${sessionId}`)
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminSessionDetail(sessionId),
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Hủy phiên thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminBulkRetryPreparation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: AdminBulkSessionRequest) => bulkRetryAdminPreparation(request),
    onSuccess: (res) => {
      toast.success(
        `Thử lại Prep thành công: ${res.succeededCount}/${res.totalRequested} phiên`,
      )
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Thao tác hàng loạt thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminBulkRetryScoring() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: AdminBulkSessionRequest) => bulkRetryAdminScoring(request),
    onSuccess: (res) => {
      toast.success(
        `Thử lại Scoring thành công: ${res.succeededCount}/${res.totalRequested} phiên`,
      )
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Thao tác hàng loạt thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminTemplates(params?: AdminTemplatesQueryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.adminTemplates(params),
    queryFn: () => getAdminTemplates(params),
    staleTime: 15_000,
  })
}

export function useAdminTemplateDetail(templateId: number | null) {
  return useQuery({
    queryKey: QUERY_KEYS.adminTemplateDetail(templateId ?? 0),
    queryFn: () =>
      templateId ? getAdminTemplateDetail(templateId) : Promise.reject('No templateId'),
    enabled: Boolean(templateId),
    staleTime: 15_000,
  })
}

export function useAdminReviewTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      request,
    }: {
      templateId: number
      request: AdminTemplateReviewRequest
    }) => reviewAdminTemplate(templateId, request),
    onSuccess: (res, { request }) => {
      const actionText =
        request.action === 'APPROVE'
          ? 'Đã duyệt'
          : request.action === 'REJECT'
            ? 'Đã từ chối'
            : 'Đã ẩn'
      toast.success(`${actionText} mẫu: ${res.template.title}`)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] })
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Duyệt mẫu thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useUpdateAdminTemplateMetadata() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      request,
    }: {
      templateId: number
      request: AdminTemplateMetadataRequest
    }) => updateAdminTemplateMetadata(templateId, request),
    onSuccess: (res) => {
      toast.success(`Đã cập nhật cấu hình mẫu: ${res.template.title}`)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] })
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
    },
    onError: (error) => {
      toast.error('Cập nhật mẫu thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminPublishTemplateExtended() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      expectedVersion,
    }: {
      templateId: number
      expectedVersion: number
    }) => adminPublishTemplate(templateId, expectedVersion),
    onSuccess: (res) => {
      toast.success(`Đã công khai mẫu: ${res.template.title}`)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] })
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Công khai mẫu thất bại: ' + getErrorMessage(error))
    },
  })
}

export function useAdminUnpublishTemplateExtended() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      templateId,
      expectedVersion,
    }: {
      templateId: number
      expectedVersion: number
    }) => adminUnpublishTemplate(templateId, expectedVersion),
    onSuccess: (res) => {
      toast.success(`Đã hủy công khai mẫu: ${res.template.title}`)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'templates'] })
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
    onError: (error) => {
      toast.error('Hủy công khai mẫu thất bại: ' + getErrorMessage(error))
    },
  })
}

