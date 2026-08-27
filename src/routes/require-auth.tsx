import { Navigate, Outlet } from 'react-router'
import { Spinner } from '@/components/ui/spinner'
import ForbiddenPage from '@/pages/forbidden-page'
import { useAuth } from '@/hooks/use-auth'
import { ROUTES } from '@/constants/routes'
import type { UserRole } from '@/constants/roles'

interface RequireAuthProps {
  /** Bỏ trống = chỉ cần đăng nhập. Truyền vào để chặn thêm theo vai trò. */
  role?: UserRole
}

export default function RequireAuth({ role }: RequireAuthProps) {
  const { user, isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />
  }

  if (role && user?.role !== role) {
    return <ForbiddenPage />
  }

  return <Outlet />
}
