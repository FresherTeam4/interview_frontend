import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import { BotMessageSquare, LogOut } from 'lucide-react'
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
    <header className="shrink-0 border-b border-border/80 bg-background/85 backdrop-blur-md sticky top-0 z-30">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link to={ROUTES.home} className="flex items-center gap-2 font-semibold text-base tracking-tight hover:opacity-90 transition-opacity">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/20">
            <BotMessageSquare className="size-4" />
          </div>
          <span className="font-bold">Mock<span className="text-primary font-black">AI</span></span>
        </Link>

        {isAuthenticated ? (
          <ul className="flex items-center gap-1.5 text-sm">
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

        <div className="ml-auto flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-full border border-border/50">
                <div className="size-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                  {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
                <span className="max-w-[150px] truncate font-medium text-foreground">{user?.fullName || user?.email}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={loggingOut}
                onClick={() => void handleLogout()}
                className="text-muted-foreground hover:text-destructive"
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
