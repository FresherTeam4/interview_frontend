import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import {
  BotMessageSquare,
  LifeBuoy,
  LogOut,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import ModeToggle from '@/components/mode-toggle'
import NotificationBell from '@/components/layout/notification-bell'
import CreateSupportTicketDialog from '@/features/support/components/create-support-ticket-dialog'
import { useAuth } from '@/hooks/use-auth'
import { NAV_ITEMS } from '@/constants/nav'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)

  const isAdminUser = user?.role === 'ADMIN'
  const isAdminSection = location.pathname.startsWith('/admin')

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      toast.success('Đã đăng xuất')
      void navigate(ROUTES.login, { replace: true })
    } catch {
      toast.error('Đăng xuất thất bại')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="shrink-0 border-b border-border/80 bg-background/85 backdrop-blur-md sticky top-0 z-30">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-4 sm:gap-6 px-4">
        <Link
          to={isAdminUser && isAdminSection ? ROUTES.adminOverview : ROUTES.home}
          className="flex items-center gap-2 font-semibold text-base tracking-tight hover:opacity-90 transition-opacity"
        >
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20">
            <BotMessageSquare className="size-4" />
          </div>
          <span className="font-bold">
            Mock<span className="text-primary font-black">AI</span>
          </span>
          {isAdminUser && isAdminSection && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              ADMIN
            </span>
          )}
        </Link>

        {isAuthenticated && !isAdminSection ? (
          <ul className="hidden md:flex items-center gap-1.5 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-secondary text-secondary-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    )
                  }
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />

              {/* Support Dialog (chỉ hiển thị cho người dùng, ẩn với admin) */}
              {!isAdminUser && (
                <CreateSupportTicketDialog
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-muted-foreground hover:text-foreground"
                      title="Gửi yêu cầu hỗ trợ"
                    >
                      <LifeBuoy className="size-4" />
                    </Button>
                  }
                />
              )}

              {/* Settings Link */}
              <NavLink
                to={ROUTES.settings}
                className={({ isActive }) =>
                  cn(
                    'flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground',
                    isActive && 'bg-secondary text-secondary-foreground font-semibold',
                  )
                }
                title="Cài đặt tài khoản"
              >
                <Settings className="size-4" />
              </NavLink>

              <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border/50">
                <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <span className="max-w-[130px] truncate font-medium text-foreground">{user?.fullName || user?.email}</span>
                {isAdminUser && (
                  <Link
                    to={ROUTES.adminOverview}
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25 transition-colors"
                    title="Quay lại phân hệ Quản trị"
                  >
                    ADMIN
                  </Link>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
                className="text-muted-foreground hover:text-destructive size-8 sm:w-auto sm:px-2.5 sm:gap-1.5"
                title="Đăng xuất"
              >
                {loggingOut ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
                <span className="hidden sm:inline text-xs">Đăng xuất</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={ROUTES.login}>Đăng nhập</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={ROUTES.register}>Đăng ký</Link>
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
      </nav>
    </header>
  )
}
