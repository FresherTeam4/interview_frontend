import { createBrowserRouter } from 'react-router'
import AuthLayout from '@/routes/auth-layout'
import GuestGuard from '@/routes/guest-guard'
import RequireAuth from '@/routes/require-auth'
import RootLayout from '@/routes/root-layout'
import RouteErrorBoundary from '@/routes/route-error-boundary'
import CvPage from '@/pages/cv-page'
import DashboardPage from '@/pages/dashboard-page'
import LoginPage from '@/pages/login-page'
import NotFoundPage from '@/pages/not-found-page'
import ProfileDetailPage from '@/pages/profile-detail-page'
import ProfilePage from '@/pages/profile-page'
import RegisterPage from '@/pages/register-page'
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
  // App — mọi trang đều yêu cầu đăng nhập; thêm chức năng mới = thêm 1 child ở đây
  {
    element: <RequireAuth />,
    children: [
      {
        path: ROUTES.home,
        element: <RootLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: ROUTES.cv, element: <CvPage /> },
          { path: ROUTES.profile, element: <ProfilePage /> },
          { path: ROUTES.profileDetail, element: <ProfileDetailPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
