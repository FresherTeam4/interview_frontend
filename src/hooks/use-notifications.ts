import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/api/notification'
import { QUERY_KEYS } from '@/constants/query-keys'

export function useNotifications(unreadOnly = false, page = 0, size = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.notifications(unreadOnly, page, size),
    queryFn: () => getNotifications(unreadOnly, page, size),
    staleTime: 15_000,
  })
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: QUERY_KEYS.unreadNotificationCount,
    queryFn: getUnreadNotificationCount,
    refetchInterval: 30_000,
    staleTime: 15_000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
