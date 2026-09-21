import { createBrowserRouter } from 'react-router'
import AuthLayout from '@/routes/auth-layout'
import GuestGuard from '@/routes/guest-guard'
import RequireAuth from '@/routes/require-auth'
import RootLayout from '@/routes/root-layout'
import RouteErrorBoundary from '@/routes/route-error-boundary'
import { Navigate } from 'react-router'
import DashboardPage from '@/pages/dashboard-page'
import LoginPage from '@/pages/login-page'
import NotFoundPage from '@/pages/not-found-page'
import ProfileDetailPage from '@/pages/profile-detail-page'
import ProfilePage from '@/pages/profile-page'
import RegisterPage from '@/pages/register-page'
import ForgotPasswordPage from '@/pages/forgot-password-page'
import ResetPasswordPage from '@/pages/reset-password-page'
import VerifyEmailPage from '@/pages/verify-email-page'
import SettingsPage from '@/pages/settings-page'
import RolesPage from '@/pages/roles-page'
import SessionCreatePage from '@/pages/session-create-page'
import SessionDetailPage from '@/pages/session-detail-page'
import SessionListPage from '@/pages/session-list-page'
import AdminGuard from '@/routes/admin-guard'
import AdminLayout from '@/routes/admin-layout'
import AdminOverviewPage from '@/pages/admin/admin-overview-page'
import AdminUsersPage from '@/pages/admin/admin-users-page'
import AdminSessionsPage from '@/pages/admin/admin-sessions-page'
import AdminTemplatesPage from '@/pages/admin/admin-templates-page'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/use-auth'

function HomeRedirect() {
  const { user } = useAuth()
  if (user?.role === 'ADMIN') {
    return <Navigate to={ROUTES.adminOverview} replace />
  }
  return <Navigate to={ROUTES.dashboard} replace />
}

export const router = createBrowserRouter([
  // Auth — layout riêng, không header/footer
  {
    element: <GuestGuard />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: ROUTES.login, element: <LoginPage /> },
          { path: ROUTES.register, element: <RegisterPage /> },
          { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
          { path: ROUTES.resetPassword, element: <ResetPasswordPage /> },
          { path: ROUTES.verifyEmail, element: <VerifyEmailPage /> },
        ],
      },
    ],
  },
  // App — các luồng tính năng tập trung
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <RootLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <HomeRedirect /> },
          { path: 'dashboard', element: <DashboardPage /> },


          // CV được gộp hoàn toàn vào Hồ sơ ứng viên
          { path: 'cv', element: <Navigate to={ROUTES.profile} replace /> },
          { path: 'profiles', element: <Navigate to={ROUTES.profile} replace /> },
          { path: ROUTES.profile, element: <ProfilePage /> },
          { path: ROUTES.profileDetail, element: <ProfileDetailPage /> },

          // Vị trí phỏng vấn (Interview Roles / Templates)
          { path: ROUTES.roles, element: <RolesPage /> },
          { path: 'jd', element: <Navigate to={ROUTES.roles} replace /> },
          { path: 'jd/create', element: <Navigate to={ROUTES.roles} replace /> },
          { path: 'templates', element: <Navigate to={ROUTES.roles} replace /> },

          // Quản lý và Phòng phỏng vấn
          { path: ROUTES.sessionList, element: <SessionListPage /> },
          { path: ROUTES.sessionCreate, element: <SessionCreatePage /> },
          { path: ROUTES.sessionDetail, element: <SessionDetailPage /> },

          // Cài đặt tài khoản
          { path: ROUTES.settings, element: <SettingsPage /> },

          // Phân hệ Quản trị hệ thống (Admin Portal)
          {
            element: <AdminGuard />,
            children: [
              {
                path: 'admin',
                element: <AdminLayout />,
                children: [
                  { index: true, element: <Navigate to={ROUTES.adminOverview} replace /> },
                  { path: 'overview', element: <AdminOverviewPage /> },
                  { path: 'users', element: <AdminUsersPage /> },
                  { path: 'sessions', element: <AdminSessionsPage /> },
                  { path: 'templates', element: <AdminTemplatesPage /> },
                ],

              },
            ],
          },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
