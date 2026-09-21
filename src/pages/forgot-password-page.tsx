import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Mail, Send, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { forgotPassword } from '@/api/auth'
import { getErrorMessage } from '@/api/api-error'
import { ROUTES } from '@/constants/routes'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    try {
      await forgotPassword({ email: email.trim() })
      setIsSuccess(true)
      toast.success('Đã gửi liên kết khôi phục mật khẩu')
    } catch (err) {
      toast.error('Gửi yêu cầu thất bại: ' + getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl font-bold">Quên mật khẩu</CardTitle>
          <CardDescription className="text-xs">
            Nhập địa chỉ email tài khoản của bạn để nhận liên kết đặt lại mật khẩu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="space-y-4 py-4 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm">Kiểm tra hộp thư của bạn</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Chúng tôi đã gửi hướng dẫn và đường dẫn đặt lại mật khẩu tới <strong>{email}</strong>.
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full text-xs mt-2">
                <Link to={ROUTES.login}>Quay lại đăng nhập</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs">Email tài khoản</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                <Send className="size-3.5" />
                {isSubmitting ? 'Đang gửi...' : 'Gửi liên kết đặt lại mật khẩu'}
              </Button>

              <div className="text-center pt-2">
                <Link
                  to={ROUTES.login}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-3" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
