import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import ModeToggle from '@/components/mode-toggle'
import { useAuth } from '@/hooks/use-auth'
import { NAV_ITEMS } from '@/constants/nav'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

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
    <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur-xs z-30">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link to={ROUTES.home} className="font-semibold">
          MockInterview
        </Link>

        {isAuthenticated ? (
          <ul className="flex items-center gap-1 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-1.5 rounded-md px-2 py-1.5 transition-colors',
                      isActive
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  <item.icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">{user?.email}</span>
              <Button
                variant="ghost"
                size="sm"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
              >
                {loggingOut ? <Spinner className="size-4" /> : <LogOut className="size-4" />}
                <span className="hidden sm:inline">Đăng xuất</span>
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
