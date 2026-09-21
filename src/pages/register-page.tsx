import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { SignupForm } from '@/features/auth/components/signup-form'
import type { SignupFieldErrors } from '@/features/auth/components/signup-form'
import { useAuth } from '@/hooks/use-auth'
import { isApiError } from '@/api/api-error'
import { ROUTES } from '@/constants/routes'
import { signupSchema } from '@/lib/validation'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, loginWithGoogle } = useAuth()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<SignupFieldErrors>({})

  function handleFieldChange(field: keyof SignupFieldErrors) {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)
    const rawData = {
      fullName: ((formData.get('fullName') as string) ?? '').trim(),
      email: ((formData.get('email') as string) ?? '').trim(),
      password: (formData.get('password') as string) ?? '',
      confirmPassword: (formData.get('confirmPassword') as string) ?? '',
    }

    const result = signupSchema.safeParse(rawData)
    if (!result.success) {
      const errors: SignupFieldErrors = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof SignupFieldErrors
        if (field && !errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setIsLoading(true)

    try {
      await register({
        fullName: result.data.fullName,
        email: result.data.email,
        password: result.data.password,
      })
      toast.success('Tạo tài khoản thành công!')
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
      toast.success('Đăng ký Google thành công!')
      navigate(ROUTES.home, { replace: true })
    } catch (err) {
      if (isApiError(err)) setError(err.message)
      else setError('Đã có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleGoogleError() {
    setError('Không thể đăng ký với Google. Vui lòng thử lại.')
  }

  return (
    <SignupForm
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
