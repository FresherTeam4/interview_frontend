import { FileText, LayoutDashboard, UserRoundPen, type LucideIcon } from 'lucide-react'
import { ROUTES } from '@/constants/routes'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Chỉ active khi khớp tuyệt đối — cần cho route index "/". */
  end?: boolean
}

/** Thêm chức năng mới = thêm một dòng ở đây, header và trang tổng quan tự cập nhật. */
export const NAV_ITEMS: NavItem[] = [
  { to: ROUTES.home, label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: ROUTES.cv, label: 'CV của tôi', icon: FileText },
  { to: ROUTES.profile, label: 'Hồ sơ', icon: UserRoundPen },
]
