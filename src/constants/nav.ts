import { LayoutDashboard, MessageSquareText, UserRoundPen, type LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Chỉ active khi khớp tuyệt đối — cần cho route index "/". */
  end?: boolean
}

/** 3 luồng chức năng trọng tâm của hệ thống */
export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: ROUTES.profile, label: 'Hồ sơ ứng viên', icon: UserRoundPen },
  { to: ROUTES.sessionList, label: 'Luyện phỏng vấn', icon: MessageSquareText },
]

