import { NavLink, Outlet } from 'react-router'
import { Activity, BarChart3, ChevronRight, LayoutDashboard, Shield, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

export default function AdminLayout() {
  const adminNavItems = [
    {
      to: ROUTES.adminOverview,
      label: 'Tổng quan hệ thống',
      icon: BarChart3,
    },
    {
      to: ROUTES.adminUsers,
      label: 'Quản lý người dùng',
      icon: Users,
    },
    {
      to: ROUTES.adminSessions,
      label: 'Vận hành phiên phỏng vấn',
      icon: Activity,
    },
  ]

  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Admin Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/80">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-xs">
            <Shield className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Phân hệ Quản trị hệ thống
              </h1>
              <Badge variant="outline" className="text-[10px] font-mono font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                ADMIN
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Theo dõi vận hành, kiểm soát tài khoản người dùng và cứu hộ sự cố AI phỏng vấn
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs self-start sm:self-auto text-muted-foreground hover:text-foreground">
          <NavLink to={ROUTES.dashboard}>
            <LayoutDashboard className="size-3.5" />
            <span>Về trang người dùng</span>
            <ChevronRight className="size-3" />
          </NavLink>
        </Button>
      </div>

      {/* Admin Navigation Pills */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/40 border border-border/70 rounded-xl overflow-x-auto no-scrollbar w-fit max-w-full">
        {adminNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0',
                isActive
                  ? 'bg-card text-foreground shadow-xs font-semibold border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/50',
              )
            }
          >
            <item.icon className="size-3.5 text-amber-500/90" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      {/* Main Admin Page Content */}
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  )
}
