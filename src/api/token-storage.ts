import { jwtDecode } from 'jwt-decode'
import type { AuthTokens } from '@/types/auth'
import { STORAGE_KEYS } from '@/constants/storage-keys'

interface TokenPayload {
  userId?: number
  sub?: string
  exp?: number
  role?: string
}

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.accessToken),

  getUserId: (): number | null => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.accessToken)
      if (!token) return null
      const payload = jwtDecode<TokenPayload>(token)
      return typeof payload.userId === 'number' ? payload.userId : null
    } catch {
      return null
    }
  },

  isTokenExpired: (): boolean => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.accessToken)
      if (!token) return true
      const payload = jwtDecode<TokenPayload>(token)
      if (!payload.exp) return false
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  },

  set({ accessToken }: AuthTokens) {
    localStorage.setItem(STORAGE_KEYS.accessToken, accessToken)
  },

  clear() {
    localStorage.removeItem(STORAGE_KEYS.accessToken)
    localStorage.removeItem(STORAGE_KEYS.user)
  },
}
