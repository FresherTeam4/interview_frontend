import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ModeToggle from '@/components/mode-toggle'
import { useAuth } from '@/hooks/use-auth'
import { ROUTES } from '@/constants/routes'

const navItems = [
  { to: ROUTES.home, label: 'Trang chủ', end: true },
  { to: ROUTES.about, label: 'Giới thiệu', end: false },
]

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
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
    <header className="border-b">
      <nav className="mx-auto max-w-7xl flex items-center gap-6 px-4 h-14">
        <Link to={ROUTES.home} className="font-semibold">
          MockInterview
        </Link>
        <ul className="flex items-center gap-4 text-sm">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span className="ml-1.5 hidden sm:inline">Đăng xuất</span>
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
