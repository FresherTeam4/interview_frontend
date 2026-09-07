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
import SessionCreatePage from '@/pages/session-create-page'
import SessionDetailPage from '@/pages/session-detail-page'
import SessionListPage from '@/pages/session-list-page'
import { ROUTES } from '@/constants/routes'

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
        ],
      },
    ],
  },
  // App — các luồng tính năng tập trung
  {
    element: <RequireAuth />,
    children: [
      {
        path: ROUTES.home,
        element: <RootLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <DashboardPage /> },

          // CV được gộp hoàn toàn vào Hồ sơ ứng viên
          { path: 'cv', element: <Navigate to={ROUTES.profile} replace /> },
          { path: 'profiles', element: <Navigate to={ROUTES.profile} replace /> },
          { path: ROUTES.profile, element: <ProfilePage /> },
          { path: ROUTES.profileDetail, element: <ProfileDetailPage /> },

          // JD được gộp hoàn toàn vào luồng Tạo phỏng vấn
          { path: 'jd', element: <Navigate to={ROUTES.sessionCreate} replace /> },
          { path: 'jd/create', element: <Navigate to={ROUTES.sessionCreate} replace /> },
          { path: 'jd/:jobDescriptionId', element: <Navigate to={ROUTES.sessionCreate} replace /> },

          // Quản lý và Phòng phỏng vấn
          { path: ROUTES.sessionList, element: <SessionListPage /> },
          { path: ROUTES.sessionCreate, element: <SessionCreatePage /> },
          { path: ROUTES.sessionDetail, element: <SessionDetailPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])

