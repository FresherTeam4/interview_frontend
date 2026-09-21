import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAccountProfile,
  updateAccountProfile,
  changePassword,
  getLoginSessions,
  revokeLoginSession,
  getAccountDeletionStatus,
  requestAccountDeletion,
  cancelAccountDeletion,
} from '@/api/account'
import { QUERY_KEYS } from '@/constants/query-keys'
import type {
  UpdateAccountRequest,
  ChangePasswordRequest,
  RequestAccountDeletionRequest,
} from '@/types/account'

export function useAccountProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.userAccount,
    queryFn: getAccountProfile,
    staleTime: 60_000,
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateAccountRequest) => updateAccountProfile(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAccount })
    },
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => changePassword(data),
  })
}

export function useLoginSessions() {
  return useQuery({
    queryKey: QUERY_KEYS.userSessions,
    queryFn: getLoginSessions,
    staleTime: 30_000,
  })
}

export function useRevokeLoginSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => revokeLoginSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userSessions })
    },
  })
}

export function useAccountDeletionStatus() {
  return useQuery({
    queryKey: QUERY_KEYS.userDeletionRequest,
    queryFn: getAccountDeletionStatus,
    staleTime: 60_000,
  })
}

export function useRequestAccountDeletion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RequestAccountDeletionRequest) => requestAccountDeletion(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userDeletionRequest })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAccount })
    },
  })
}

export function useCancelAccountDeletion() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cancelAccountDeletion(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userDeletionRequest })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userAccount })
    },
  })
}
