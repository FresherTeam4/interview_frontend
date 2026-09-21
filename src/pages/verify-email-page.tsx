import { Link, useSearchParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { confirmEmailVerification } from '@/api/auth'
import { getErrorMessage } from '@/api/api-error'
import { ROUTES } from '@/constants/routes'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const {
    isLoading: loading,
    isSuccess: success,
    error,
  } = useQuery({
    queryKey: ['verifyEmail', token],
    queryFn: async () => {
      if (!token) {
        throw new Error('Mã token xác thực email không hợp lệ hoặc bị thiếu.')
      }
      return confirmEmailVerification({ token })
    },
    retry: false,
    staleTime: Infinity,
  })

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center justify-center gap-2">
            <MailCheck className="size-5 text-primary" />
            Xác thực địa chỉ Email
          </CardTitle>
          <CardDescription className="text-xs">
            Xác nhận quyền sở hữu email để hoàn tất kích hoạt tài khoản.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">Đang xác thực thông tin tài khoản...</p>
            </div>
          ) : success ? (
            <div className="space-y-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Xác thực thành công!</h4>
                <p className="text-xs text-muted-foreground">
                  Email của bạn đã được xác nhận. Bạn có thể đăng nhập và sử dụng đầy đủ các tính năng của hệ thống.
                </p>
              </div>
              <Button asChild size="sm" className="w-full text-xs mt-2 font-semibold">
                <Link to={ROUTES.login}>Đăng nhập ngay</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-destructive">Xác thực thất bại</h4>
                <p className="text-xs text-muted-foreground">
                  {error ? getErrorMessage(error) : 'Đường dẫn xác thực đã hết hạn hoặc không tồn tại.'}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full text-xs mt-2">
                <Link to={ROUTES.login}>Quay lại đăng nhập</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
