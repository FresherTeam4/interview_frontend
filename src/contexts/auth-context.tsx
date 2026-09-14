import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getCurrentUser, loginUser, loginWithGoogle, logoutUser, registerUser } from '@/api/auth'
import { AUTH_EXPIRED_EVENT } from '@/api/client'
import { tokenStorage } from '@/api/token-storage'
import { queryClient } from '@/contexts/query-client'
import { AuthContext } from '@/contexts/auth-context-def'
import type { AuthContextValue, AuthResponse, LoginRequest, RegisterRequest } from '@/types/auth'
import type { CurrentUser } from '@/types/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrateUser() {
      if (!tokenStorage.getAccessToken()) {
        if (!cancelled) setIsInitializing(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        if (!cancelled) setUser(currentUser)
      } catch {
        const hadAccessToken = Boolean(tokenStorage.getAccessToken())
        tokenStorage.clear()
        queryClient.clear()
        if (hadAccessToken) window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsInitializing(false)
      }
    }

    void hydrateUser()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handleExpired() {
      queryClient.clear()
      setUser(null)
      setIsInitializing(false)
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired)
  }, [])

  const completeLogin = useCallback(async (response: AuthResponse): Promise<AuthResponse> => {
    try {
      queryClient.clear()
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      return response
    } catch (error) {
      tokenStorage.clear()
      queryClient.clear()
      setUser(null)
      throw error
    }
  }, [])

  const login = useCallback(
    async (data: LoginRequest) => completeLogin(await loginUser(data)),
    [completeLogin],
  )

  const register = useCallback(
    async (data: RegisterRequest) => completeLogin(await registerUser(data)),
    [completeLogin],
  )

  const loginWithGoogleAccount = useCallback(
    async (idToken: string) => completeLogin(await loginWithGoogle(idToken)),
    [completeLogin],
  )

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      queryClient.clear()
      setUser(null)
      tokenStorage.clear()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      register,
      loginWithGoogle: loginWithGoogleAccount,
      logout,
    }),
    [user, isInitializing, login, register, loginWithGoogleAccount, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
