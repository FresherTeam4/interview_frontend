export type UserNotificationType =
  | 'CV_READY'
  | 'CV_FAILED'
  | 'JOB_DESCRIPTION_READY'
  | 'JOB_DESCRIPTION_FAILED'
  | 'INTERVIEW_REPORT_READY'
  | 'INTERVIEW_REPORT_FAILED'

export interface UserNotification {
  id: number
  type: UserNotificationType
  title: string
  message: string
  resourceType: string | null
  resourceId: number | null
  readAt: string | null
  createdAt: string
}

export interface NotificationPageResponse {
  content: UserNotification[]
  page: number
  size: number
  totalElements: number
}

export interface UnreadNotificationCountResponse {
  unreadCount: number
}
