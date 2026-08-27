import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import { AUTH_EXPIRED_EVENT } from '@/api/client'
import { ROUTES } from '@/constants/routes'

export default function RootLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    function redirectToLogin() {
      if (location.pathname !== ROUTES.login) {
        navigate(ROUTES.login, { replace: true })
      }
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, redirectToLogin)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, redirectToLogin)
  }, [location.pathname, navigate])

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-background">
      <Header />
      <div id="main-scroll-container" className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col justify-between">
        <main className="mx-auto w-full max-w-7xl px-4 py-8 flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
