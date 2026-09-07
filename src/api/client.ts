import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { normalizeError } from '@/api/api-error'
import { tokenStorage } from '@/api/token-storage'
import type { AuthTokens } from '@/types/auth'

declare module 'axios' {
  interface AxiosRequestConfig {
     _retry?: boolean
    skipAuth?: boolean
  }
}

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) {
  throw new Error(
    'VITE_API_URL trong .env chưa được cấu hình.',
  )
}

// instance dùng để gọi APIs (cho phép thời gian chờ đủ dài khi gọi AI mô hình lớn)
export const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 60_000,
  // kèm cookie
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// instance riêng để gọi refresh token
const refreshClient = axios.create({
  baseURL,
  timeout: 30_000,
  withCredentials: true
})

// run trước khi gửi request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.skipAuth) {
    const token = tokenStorage.getAccessToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// lỡ nhiều request cùng lúc nhận 401, chỉ gọi refresh một lần
let refreshPromise: Promise<AuthTokens> | null = null

function refreshTokens(): Promise<AuthTokens> {
  refreshPromise ??= refreshClient
    .post<AuthTokens>('/auth/refresh')
    .then((res) => {
      tokenStorage.set(res.data)
      return res.data
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

// xử lý lỗi
export const AUTH_EXPIRED_EVENT = 'auth:expired'

function handleAuthExpired() {
  tokenStorage.clear()
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!(error instanceof AxiosError)) return Promise.reject(normalizeError(error))

    const config = error.config
    if (error.response?.status !== 401) return Promise.reject(normalizeError(error))

    if (!config || config._retry || config.skipAuth || !tokenStorage.getAccessToken()) {
      handleAuthExpired()
      return Promise.reject(normalizeError(error))
    }

    config._retry = true
    try {
      await refreshTokens()
      return await api.request(config)
    } catch (refreshError) {
      handleAuthExpired()
      return await Promise.reject(normalizeError(refreshError))
    }
  },
)
