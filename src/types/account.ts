import type { UserRole } from '@/constants/roles'

export interface AccountPreferences {
  languageCode: string | null
  timeZone: string | null
  emailNotifications: boolean
  processingNotifications: boolean
}

export interface AccountProfileResponse {
  id: number
  fullName: string
  email: string
  avatarUrl: string | null
  role: UserRole
  emailVerifiedAt: string | null
  preferences: AccountPreferences
  deletionRequestedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateAccountRequest {
  fullName?: string
  avatarUrl?: string | null
  clearAvatar?: boolean
  languageCode?: string
  timeZone?: string
  emailNotifications?: boolean
  processingNotifications?: boolean
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface LoginSessionResponse {
  id: string
  deviceName: string | null
  userAgent: string | null
  ipAddress: string | null
  createdAt: string
  lastUsedAt: string
  expiresAt: string
  current: boolean
}

export type AccountDeletionStatus = 'SCHEDULED' | 'CANCELLED' | 'PURGED'

export interface AccountDeletionResponse {
  status: AccountDeletionStatus
  requestedAt: string
  scheduledAt: string
  cancelledAt: string | null
}

export interface RequestAccountDeletionRequest {
  confirmation: 'DELETE'
  currentPassword: string
}

export interface AccountExportResponse {
  generatedAt: string
  account: AccountProfileResponse
  cvs: unknown[]
  profiles: unknown[]
  jobDescriptions: unknown[]
  templates: unknown[]
  interviews: unknown[]
}
