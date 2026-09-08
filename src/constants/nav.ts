import { Briefcase, LayoutDashboard, MessageSquareText, UserRoundPen, type LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Chỉ active khi khớp tuyệt đối — cần cho route index "/". */
  end?: boolean
}

/** Các luồng chức năng trọng tâm của hệ thống */
export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: ROUTES.profile, label: 'Hồ sơ ứng viên', icon: UserRoundPen },
  { to: ROUTES.roles, label: 'Vị trí phỏng vấn', icon: Briefcase },
  { to: ROUTES.sessionList, label: 'Phiên phỏng vấn', icon: MessageSquareText },
]

