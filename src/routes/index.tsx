import { createBrowserRouter } from 'react-router'
import AuthLayout from '@/routes/auth-layout'
import AuthenticatedGuard from '@/routes/authenticated-guard'
import GuestGuard from '@/routes/guest-guard'
import RootLayout from '@/routes/root-layout'
import RouteErrorBoundary from '@/routes/route-error-boundary'
import AboutPage from '@/pages/about-page'
import HomePage from '@/pages/home-page'
import LoginPage from '@/pages/login-page'
import NotFoundPage from '@/pages/not-found-page'
import RegisterPage from '@/pages/register-page'
import { ROUTES } from '@/constants/routes'

export const router = createBrowserRouter([
  // Các route xác thực dùng layout riêng, không có header/footer.
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
  // Các route trong ứng dụng dùng chung RootLayout.
  {
    path: ROUTES.home,
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: <AboutPage /> },
      {
        element: <AuthenticatedGuard />,
        children: [
          {
            path: 'cvs',
            lazy: async () => ({
              Component: (await import('@/pages/cv-list-page')).default,
            }),
          },
          {
            path: 'profiles',
            lazy: async () => ({
              Component: (await import('@/pages/profile-list-page')).default,
            }),
          },
          {
            path: 'profiles/:profileId',
            lazy: async () => ({
              Component: (await import('@/pages/profile-detail-page')).default,
            }),
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
