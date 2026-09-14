import type { SessionMode, SessionStatus } from '@/types/session'
import type { UserRole } from '@/constants/roles'

export type InterviewSessionStatus = SessionStatus
export type InterviewSessionMode = SessionMode
export type InterviewEndReason = 'TIME_EXCEEDED' | 'USER_SUBMITTED' | 'ABANDONED' | 'MANUAL_STOP' | string

export interface AdminUserStats {
  total: number
  enabled: number
  newInPeriod: number
}

export interface AdminSessionStats {
  totalInPeriod: number
  completed: number
  inProgress: number
  preparationFailed: number
  scoringFailed: number
  completionRate: number
}

export interface AdminTemplateStats {
  published: number
}

export interface AdminOverviewResponse {
  generatedAt: string
  periodDays: number
  users: AdminUserStats
  sessions: AdminSessionStats
  templates: AdminTemplateStats
}

export interface AdminUserSummary {
  id: number
  fullName: string
  email: string
  role: UserRole
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminUserDetail extends AdminUserSummary {
  activeCvCount: number
  activeJdCount: number
  totalSessionCount: number
  completedSessionCount: number
}

export interface UpdateUserStatusRequest {
  enabled: boolean
}

export interface AdminUserReference {
  id: number
  fullName: string
  email: string
}

export interface AdminSessionSummary {
  id: number
  status: InterviewSessionStatus
  mode: InterviewSessionMode
  owner: AdminUserReference
  templateTitle: string | null
  profileHeadline: string | null
  durationMinutes: number
  remainingSeconds: number
  startedAt: string | null
  endedAt: string | null
  deadlineAt: string | null
  endReason: InterviewEndReason | null
  overallScore: number | null
  preparationErrorCode: string | null
  scoringErrorCode: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminSessionTransition {
  id: number
  fromStatus: InterviewSessionStatus | null
  toStatus: InterviewSessionStatus
  reason: string | null
  actor: 'USER' | 'SYSTEM' | 'ADMIN'
  createdAt: string
}

export interface AdminSessionDetail extends AdminSessionSummary {
  preparationErrorMessage: string | null
  scoringErrorMessage: string | null
  modelVersion: string | null
  promptVersion: string | null
  schemaVersion: string | null
  transitions: AdminSessionTransition[]
}

export interface AdminPageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
}

export interface AdminUsersQueryParams {
  keyword?: string
  role?: UserRole
  enabled?: boolean
  page?: number
  size?: number
}

export interface AdminSessionsQueryParams {
  keyword?: string
  status?: InterviewSessionStatus
  mode?: InterviewSessionMode
  from?: string
  to?: string
  page?: number
  size?: number
}
