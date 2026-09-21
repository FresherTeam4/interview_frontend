import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import LoginForm, { type LoginFieldErrors } from '@/features/auth/components/login-form'
import { useAuth } from '@/hooks/use-auth'
import { getCurrentUser } from '@/api/auth'
import { isApiError } from '@/api/api-error'

import { ROUTES } from '@/constants/routes'
import { loginSchema } from '@/lib/validation'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})

  function handleFieldChange(field: string) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const rawData = {
      email: ((formData.get('email') as string) ?? '').trim(),
      password: (formData.get('password') as string) ?? '',
    }

    const result = loginSchema.safeParse(rawData)
    if (!result.success) {
      const errors: LoginFieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string
        if (field && !errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsLoading(true)

    try {
      await login(result.data)
      const currentUser = await getCurrentUser()
      toast.success('Đăng nhập thành công!')
      if (currentUser?.role === 'ADMIN') {
        navigate(ROUTES.adminOverview, { replace: true })
      } else {
        navigate(ROUTES.home, { replace: true })
      }
    } catch (err) {
      if (isApiError(err)) setError(err.message)
      else setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleLogin(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) {
      setError('Đăng nhập Google thất bại: Không nhận được thông tin xác thực.')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await loginWithGoogle(credentialResponse.credential)
      const currentUser = await getCurrentUser()
      toast.success('Đăng nhập Google thành công!')
      if (currentUser?.role === 'ADMIN') {
        navigate(ROUTES.adminOverview, { replace: true })
      } else {
        navigate(ROUTES.home, { replace: true })
      }
    } catch (err) {
      if (isApiError(err)) setError(err.message)
      else setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }


  function handleGoogleError() {
    setError('Không thể đăng nhập với Google. Vui lòng thử lại.')
  }

  return (
    <LoginForm
      onSubmitForm={handleSubmit}
      isLoading={isLoading}
      error={error}
      fieldErrors={fieldErrors}
      onFieldChange={handleFieldChange}
      onGoogleLogin={handleGoogleLogin}
      onGoogleError={handleGoogleError}
    />
  )
}
