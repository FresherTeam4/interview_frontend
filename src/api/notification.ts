import { api } from '@/api/client'
import type {
  NotificationPageResponse,
  UnreadNotificationCountResponse,
  UserNotification,
} from '@/types/notification'

export async function getNotifications(
  unreadOnly = false,
  page = 0,
  size = 20,
): Promise<NotificationPageResponse> {
  const res = await api.get<NotificationPageResponse>('/notifications', {
    params: { unreadOnly, page, size },
  })
  return res.data
}

export async function getUnreadNotificationCount(): Promise<UnreadNotificationCountResponse> {
  const res = await api.get<UnreadNotificationCountResponse>('/notifications/unread-count')
  return res.data
}

export async function markNotificationRead(id: number): Promise<UserNotification> {
  const res = await api.patch<UserNotification>(`/notifications/${id}/read`)
  return res.data
}

export async function markAllNotificationsRead(): Promise<UnreadNotificationCountResponse> {
  const res = await api.post<UnreadNotificationCountResponse>('/notifications/read-all')
  return res.data
}
