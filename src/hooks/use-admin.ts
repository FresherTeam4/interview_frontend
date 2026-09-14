import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/api-error'
import {
  getAdminOverview,
  getAdminSessionDetail,
  getAdminSessions,
  getAdminUserDetail,
  getAdminUsers,
  publishTemplate,
  retryAdminPreparation,
  retryAdminScoring,
  unpublishTemplate,
  updateUserStatus,
} from '@/api/admin'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { AdminSessionsQueryParams, AdminUsersQueryParams } from '@/types/admin'

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
