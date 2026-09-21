import { api } from '@/api/client'
import type {
  AccountProfileResponse,
  UpdateAccountRequest,
  ChangePasswordRequest,
  LoginSessionResponse,
  AccountDeletionResponse,
  RequestAccountDeletionRequest,
  AccountExportResponse,
} from '@/types/account'

export async function getAccountProfile(): Promise<AccountProfileResponse> {
  const res = await api.get<AccountProfileResponse>('/users/me')
  return res.data
}

export async function updateAccountProfile(data: UpdateAccountRequest): Promise<AccountProfileResponse> {
  const res = await api.patch<AccountProfileResponse>('/users/me', data)
  return res.data
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await api.put<void>('/users/me/password', data)
}

export async function getLoginSessions(): Promise<LoginSessionResponse[]> {
  const res = await api.get<LoginSessionResponse[]>('/users/me/sessions')
  return res.data
}

export async function revokeLoginSession(sessionId: string): Promise<void> {
  await api.delete<void>(`/users/me/sessions/${sessionId}`)
}

export async function exportAccountData(): Promise<AccountExportResponse> {
  const res = await api.get<AccountExportResponse>('/users/me/export')
  return res.data
}

export async function getAccountDeletionStatus(): Promise<AccountDeletionResponse | null> {
  try {
    const res = await api.get<AccountDeletionResponse>('/users/me/deletion-request')
    return res.data
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 404) {
      return null
    }
    throw err
  }
}

export async function requestAccountDeletion(
  data: RequestAccountDeletionRequest,
): Promise<AccountDeletionResponse> {
  const res = await api.post<AccountDeletionResponse>('/users/me/deletion-request', data)
  return res.data
}

export async function cancelAccountDeletion(): Promise<void> {
  await api.delete<void>('/users/me/deletion-request')
}
