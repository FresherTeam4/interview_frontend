import type { UserRole } from '@/constants/roles'
import type { CurrentUser } from '@/types/api'

export interface AuthContextValue {
  user: CurrentUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (data: LoginRequest) => Promise<AuthResponse>
  register: (data: RegisterRequest) => Promise<AuthResponse>
  loginWithGoogle: (idToken: string) => Promise<AuthResponse>
  logout: () => Promise<void>
}

export interface AuthTokens {
  accessToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  fullName: string
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  userId: number
  email: string
  role: UserRole
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface ConfirmAccountTokenRequest {
  token: string
}
