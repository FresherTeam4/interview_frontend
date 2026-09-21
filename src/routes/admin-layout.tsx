import { NavLink, Outlet } from 'react-router'
import { ChevronRight, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ADMIN_NAV_ITEMS } from '@/constants/nav'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

export default function AdminLayout() {
  return (
    <div className="flex flex-col gap-6 w-full pb-16">
      {/* Admin Navigation & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/80">
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 border border-border/70 rounded-xl overflow-x-auto no-scrollbar w-fit max-w-full">
          {ADMIN_NAV_ITEMS.map((item) => (
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

        <Button
          variant="outline"
          size="sm"
          asChild
          className="gap-1.5 text-xs self-start sm:self-auto text-muted-foreground hover:text-foreground hover:bg-muted/80 border-border/80 shadow-xs"
        >
          <NavLink to={ROUTES.dashboard}>
            <LayoutDashboard className="size-3.5 text-primary" />
            <span>Về trang người dùng</span>
            <ChevronRight className="size-3" />
          </NavLink>
        </Button>
      </div>

      {/* Main Admin Page Content */}
      <div className="w-full">
        <Outlet />
      </div>
    </div>
  )
}
