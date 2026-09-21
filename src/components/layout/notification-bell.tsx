import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Bell,
  CheckCheck,
  FileText,
  Briefcase,
  Award,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/use-notifications'
import { formatDate } from '@/lib/format'
import { ROUTES, sessionDetailPath, profileDetailPath } from '@/constants/routes'
import type { UserNotification } from '@/types/notification'

function getNotificationIcon(type: string) {
  switch (type) {
    case 'CV_READY':
      return <FileText className="size-4 text-emerald-500" />
    case 'CV_FAILED':
      return <AlertCircle className="size-4 text-rose-500" />
    case 'JOB_DESCRIPTION_READY':
      return <Briefcase className="size-4 text-blue-500" />
    case 'JOB_DESCRIPTION_FAILED':
      return <AlertCircle className="size-4 text-rose-500" />
    case 'INTERVIEW_REPORT_READY':
      return <Award className="size-4 text-amber-500" />
    case 'INTERVIEW_REPORT_FAILED':
      return <AlertCircle className="size-4 text-rose-500" />
    default:
      return <Bell className="size-4 text-muted-foreground" />
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const countQuery = useUnreadNotificationCount()
  const notificationsQuery = useNotifications(false, 0, 15)
  const markReadMutation = useMarkNotificationRead()
  const markAllReadMutation = useMarkAllNotificationsRead()

  const unreadCount = countQuery.data?.unreadCount ?? 0
  const notifications = notificationsQuery.data?.content ?? []

  const handleNotificationClick = async (notif: UserNotification) => {
    if (!notif.readAt) {
      await markReadMutation.mutateAsync(notif.id)
    }
    setOpen(false)

    // Route target
    if (notif.type === 'INTERVIEW_REPORT_READY' && notif.resourceId) {
      void navigate(sessionDetailPath(notif.resourceId))
    } else if (notif.type === 'CV_READY' && notif.resourceId) {
      void navigate(profileDetailPath(notif.resourceId))
    } else if (notif.type === 'JOB_DESCRIPTION_READY') {
      void navigate(ROUTES.roles)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllReadMutation.mutateAsync()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-8 text-muted-foreground hover:text-foreground"
          aria-label="Thông báo"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg sm:w-96">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Thông báo</h4>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] font-medium">
                {unreadCount} mới
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="size-3.5" />
              Đọc tất cả
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[380px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Bell className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">Bạn chưa có thông báo nào</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {notifications.map((notif) => {
                const isUnread = !notif.readAt
                return (
                  <button
                    key={notif.id}
                    type="button"
                    onClick={() => void handleNotificationClick(notif)}
                    className={`flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50 ${
                      isUnread ? 'bg-primary/5 font-medium' : 'opacity-80'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0 rounded-full bg-background p-1.5 shadow-xs border">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {notif.title}
                        </p>
                        {isUnread && (
                          <span className="size-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 pt-0.5">
                        <Clock className="size-2.5" />
                        {formatDate(notif.createdAt)}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
