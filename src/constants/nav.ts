import {
  Activity,
  BarChart3,
  Briefcase,
  FileCheck2,
  LayoutDashboard,
  MessageSquareText,
  UserRoundPen,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Chỉ active khi khớp tuyệt đối — cần cho route index "/". */
  end?: boolean
}

/** Các luồng chức năng trọng tâm của hệ thống cho ứng viên */
export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: ROUTES.profile, label: 'Hồ sơ ứng viên', icon: UserRoundPen },
  { to: ROUTES.roles, label: 'Vị trí phỏng vấn', icon: Briefcase },
  { to: ROUTES.sessionList, label: 'Phiên phỏng vấn', icon: MessageSquareText },
]

/** Các phân hệ quản trị dành riêng cho tài khoản ADMIN */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { to: ROUTES.adminOverview, label: 'Tổng quan', icon: BarChart3 },
  { to: ROUTES.adminUsers, label: 'Người dùng', icon: Users },
  { to: ROUTES.adminSessions, label: 'Phiên phỏng vấn', icon: Activity },
  { to: ROUTES.adminTemplates, label: 'Kiểm duyệt Template', icon: FileCheck2 },
]


