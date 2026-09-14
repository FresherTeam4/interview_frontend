import type { AuthTokens } from '@/types/auth'
import { STORAGE_KEYS } from '@/constants/storage-keys'

export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.accessToken),

  getUserId: (): number | null => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.accessToken)
      if (!token) return null
      const parts = token.split('.')
      if (parts.length < 2) return null
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      )
      const payload = JSON.parse(jsonPayload)
      return typeof payload.userId === 'number' ? payload.userId : null
    } catch {
      return null
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
