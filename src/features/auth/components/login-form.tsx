import { useState, type ComponentProps } from 'react'
import { Link } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { ROUTES } from '@/constants/routes'

export type LoginFieldErrors = Record<string, string>

export interface LoginFormProps extends ComponentProps<typeof Card> {
  onSubmitForm?: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading?: boolean
  error?: string | null
  fieldErrors?: LoginFieldErrors
  onFieldChange?: (field: string) => void
  onGoogleLogin?: (credentialResponse: { credential?: string }) => void
  onGoogleError?: () => void
}

export function LoginForm({
  onSubmitForm,
  isLoading,
  error,
  fieldErrors = {},
  onFieldChange,
  onGoogleLogin,
  onGoogleError,
  ...props
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Đăng nhập</CardTitle>
        <CardDescription>
          Nhập email và mật khẩu để truy cập tài khoản
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmitForm}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <FieldGroup>
            <Field data-invalid={!!fieldErrors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="m@example.com"
                autoComplete="email"
                required
                disabled={isLoading}
                aria-invalid={!!fieldErrors.email}
                onChange={() => onFieldChange?.('email')}
              />
              <FieldError>{fieldErrors.email}</FieldError>
            </Field>
            <Field data-invalid={!!fieldErrors.password}>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
                <Link
                  to={ROUTES.forgotPassword}
                  className="ml-auto inline-block text-sm text-primary underline-offset-4 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <InputGroup>
                <InputGroupInput
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors.password}
                  onChange={() => onFieldChange?.('password')}
                />
                <InputGroupButton
                  type="button"
                  variant="ghost"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroup>
              <FieldError>{fieldErrors.password}</FieldError>
            </Field>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="size-4" /> : 'Đăng nhập'}
            </Button>
            <div className="relative my-2 text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
              <span className="relative z-10 bg-card px-2 text-muted-foreground text-xs uppercase">
                Hoặc
              </span>
            </div>
            {onGoogleLogin && (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={onGoogleLogin}
                  onError={onGoogleError}
                  text="signin_with"
                  shape="rectangular"
                />
              </div>
            )}
            <p className="text-center text-sm text-muted-foreground">
              Chưa có tài khoản?{' '}
              <Link
                to={ROUTES.register}
                className="underline underline-offset-4 hover:text-primary"
              >
                Đăng ký
              </Link>
            </p>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

export default LoginForm
