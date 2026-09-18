import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { LoginForm } from '@/features/auth/components/login-form'
import type { LoginFieldErrors } from '@/features/auth/components/login-form'
import { useAuth } from '@/hooks/use-auth'
import { isApiError } from '@/api/api-error'
import { ROUTES } from '@/constants/routes'
import { loginSchema } from '@/lib/validation'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({})

  function handleFieldChange(field: keyof LoginFieldErrors) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
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
        const field = issue.path[0] as keyof LoginFieldErrors
        if (field && !errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsLoading(true)

    try {
      await login(result.data)
      toast.success('Đăng nhập thành công!')
      navigate(ROUTES.home, { replace: true })
    } catch (err) {
      if (isApiError(err)) {
        setError(err.message)
      } else {
        setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleLogin(idToken: string) {
    setError('')
    setIsLoading(true)

    try {
      await loginWithGoogle(idToken)
      toast.success('Đăng nhập Google thành công!')
      navigate(ROUTES.home, { replace: true })
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
