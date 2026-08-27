import { useState } from 'react'
import { BriefcaseBusiness, Loader2, LogOut } from 'lucide-react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import ModeToggle from '@/components/mode-toggle'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'

const publicNavItems = [
  { to: ROUTES.home, label: 'Trang chủ', end: true },
  { to: ROUTES.about, label: 'Giới thiệu', end: false },
]

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await logout()
      toast.success('Đã đăng xuất')
      navigate(ROUTES.login, { replace: true })
    } catch {
      toast.error('Đăng xuất thất bại')
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-6">
        <Link to={ROUTES.home} className="flex shrink-0 items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BriefcaseBusiness className="size-4" />
          </span>
          <span className="hidden sm:inline">MockInterview</span>
        </Link>

        <ul className="flex min-w-0 items-center gap-1 text-sm">
          {publicNavItems.map((item) => (
            <li key={item.to} className="hidden md:block">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'inline-flex h-9 items-center rounded-md px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    isActive && 'bg-muted font-medium text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
          {isAuthenticated && (
            <li>
              <NavLink
                to={ROUTES.cvs}
                className={({ isActive }) =>
                  cn(
                    'inline-flex h-9 items-center rounded-md px-3 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                    (isActive || location.pathname.startsWith(ROUTES.profiles)) &&
                      'bg-muted font-medium text-foreground',
                  )
                }
              >
                CV &amp; Hồ sơ
              </NavLink>
            </li>
          )}
        </ul>

        <div className="ml-auto flex items-center gap-1.5">
          {isAuthenticated ? (
            <>
              <span className="hidden max-w-52 truncate text-sm text-muted-foreground lg:inline">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Đăng xuất"
              >
                {loggingOut ? <Loader2 className="animate-spin" /> : <LogOut />}
                <span className="hidden xl:inline">Đăng xuất</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to={ROUTES.login}>Đăng nhập</Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:inline-flex">
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
