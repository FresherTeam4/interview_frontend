import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { KeyRound, CheckCircle2, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { resetPassword } from '@/api/auth'
import { getErrorMessage } from '@/api/api-error'
import { ROUTES } from '@/constants/routes'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      toast.error('Mã token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }

    setIsSubmitting(true)
    try {
      await resetPassword({ token, newPassword })
      setIsSuccess(true)
      toast.success('Đặt lại mật khẩu thành công')
      setTimeout(() => {
        void navigate(ROUTES.login)
      }, 2000)
    } catch (err) {
      toast.error('Đặt lại mật khẩu thất bại: ' + getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold">Đặt lại mật khẩu</CardTitle>
          <CardDescription className="text-xs">
            Thiết lập mật khẩu mới cho tài khoản của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <div className="space-y-4 py-4 text-center">
              <p className="text-xs text-destructive">
                Đường dẫn đặt lại mật khẩu không hợp lệ hoặc thiếu mã token. Vui lòng thử yêu cầu lại.
              </p>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link to={ROUTES.forgotPassword}>Yêu cầu lại</Link>
              </Button>
            </div>
          ) : isSuccess ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Mật khẩu đã được cập nhật!</h4>
                <p className="text-xs text-muted-foreground">
                  Hệ thống đang chuyển hướng bạn về trang đăng nhập...
                </p>
              </div>
              <Button asChild size="sm" className="w-full text-xs mt-2">
                <Link to={ROUTES.login}>Đăng nhập ngay</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-xs">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Tối thiểu 8 ký tự..."
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới..."
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 text-xs"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="w-full gap-1.5 text-xs font-semibold"
              >
                <KeyRound className="size-3.5" />
                {isSubmitting ? 'Đang cập nhật...' : 'Xác nhận đổi mật khẩu'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
