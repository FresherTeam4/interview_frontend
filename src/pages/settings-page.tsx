import { useState } from 'react'
import {
  User,
  Shield,
  Laptop,
  Trash2,
  Download,
  KeyRound,
  Bell,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import PageHeader from '@/components/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  useAccountProfile,
  useUpdateAccount,
  useChangePassword,
  useLoginSessions,
  useRevokeLoginSession,
  useAccountDeletionStatus,
  useRequestAccountDeletion,
  useCancelAccountDeletion,
} from '@/hooks/use-account'
import { exportAccountData } from '@/api/account'
import { getErrorMessage } from '@/api/api-error'
import { formatDateTime } from '@/lib/format'
import type { AccountProfileResponse } from '@/types/account'

function ProfilePreferencesForm({ profile }: { profile: AccountProfileResponse }) {
  const updateMutation = useUpdateAccount()
  const [fullName, setFullName] = useState(profile.fullName ?? '')
  const [emailNotifications, setEmailNotifications] = useState(
    profile.preferences?.emailNotifications ?? true,
  )
  const [processingNotifications, setProcessingNotifications] = useState(
    profile.preferences?.processingNotifications ?? true,
  )

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateMutation.mutateAsync({
        fullName: fullName.trim(),
        emailNotifications,
        processingNotifications,
      })
      toast.success('Đã cập nhật thông tin tài khoản')
    } catch (err) {
      toast.error('Cập nhật thất bại: ' + getErrorMessage(err))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
        <CardDescription className="text-xs">
          Cập nhật họ tên và tùy chọn nhận thông báo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="account-name" className="text-xs">Họ và tên</Label>
              <Input
                id="account-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="account-email" className="text-xs">Email</Label>
              <Input
                id="account-email"
                value={profile.email ?? ''}
                disabled
                className="text-xs bg-muted/40 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <h4 className="text-xs font-semibold flex items-center gap-1.5">
              <Bell className="size-3.5 text-primary" />
              Tùy chọn thông báo
            </h4>

            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <Label htmlFor="notif-email" className="text-xs cursor-pointer">
                  Thông báo qua Email
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Nhận email khi báo cáo phỏng vấn đã chấm điểm xong.
                </p>
              </div>
              <Switch
                id="notif-email"
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <Label htmlFor="notif-inapp" className="text-xs cursor-pointer">
                  Thông báo xử lý tài liệu & tiến trình AI
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Nhận thông báo khi CV hoặc đề phỏng vấn được khởi tạo xong.
                </p>
              </div>
              <Switch
                id="notif-inapp"
                checked={processingNotifications}
                onCheckedChange={setProcessingNotifications}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending}
              className="gap-1.5 text-xs"
            >
              <Check className="size-3.5" />
              {updateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const accountQuery = useAccountProfile()
  const changePasswordMutation = useChangePassword()
  const sessionsQuery = useLoginSessions()
  const revokeSessionMutation = useRevokeLoginSession()
  const deletionStatusQuery = useAccountDeletionStatus()
  const requestDeletionMutation = useRequestAccountDeletion()
  const cancelDeletionMutation = useCancelAccountDeletion()

  const profile = accountQuery.data
  const deletion = deletionStatusQuery.data

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Deletion form state
  const [deletionPassword, setDeletionPassword] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới và xác nhận mật khẩu không khớp')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự')
      return
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      })
      toast.success('Đổi mật khẩu thành công')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error('Đổi mật khẩu thất bại: ' + getErrorMessage(err))
    }
  }

  const handleRevokeSession = async (id: string) => {
    try {
      await revokeSessionMutation.mutateAsync(id)
      toast.success('Đã đăng xuất phiên đăng nhập này')
    } catch (err) {
      toast.error('Không thể thu hồi phiên: ' + getErrorMessage(err))
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const data = await exportAccountData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mockai-user-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Đã tải xuống toàn bộ dữ liệu tài khoản')
    } catch (err) {
      toast.error('Xuất dữ liệu thất bại: ' + getErrorMessage(err))
    } finally {
      setIsExporting(false)
    }
  }

  const handleRequestDeletion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletionPassword) {
      toast.error('Vui lòng nhập mật khẩu xác nhận')
      return
    }
    const confirmed = window.confirm(
      'Bạn có chắc chắn muốn lên lịch xóa tài khoản không? Mọi dữ liệu sẽ bị xóa sau 30 ngày.',
    )
    if (!confirmed) return

    try {
      const res = await requestDeletionMutation.mutateAsync({
        confirmation: 'DELETE',
        currentPassword: deletionPassword,
      })
      toast.warning(
        `Đã lên lịch xóa tài khoản vào ngày ${formatDateTime(res.scheduledAt)}. Bạn có thể hủy yêu cầu này bất kỳ lúc nào trước thời hạn.`,
      )
      setDeletionPassword('')
    } catch (err) {
      toast.error('Yêu cầu xóa tài khoản thất bại: ' + getErrorMessage(err))
    }
  }

  const handleCancelDeletion = async () => {
    try {
      await cancelDeletionMutation.mutateAsync()
      toast.success('Đã hủy lịch xóa tài khoản thành công')
    } catch (err) {
      toast.error('Hủy yêu cầu thất bại: ' + getErrorMessage(err))
    }
  }

  const isPendingDeletion = deletion?.status === 'SCHEDULED'

  return (
    <div className="flex flex-col gap-6 pb-12 max-w-4xl mx-auto">
      <PageHeader
        title="Cài đặt tài khoản"
        description="Quản lý hồ sơ cá nhân, bảo mật, thông báo và dữ liệu tài khoản của bạn."
      />

      {isPendingDeletion && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AlertTriangle className="size-4 text-rose-500" />
              Tài khoản đang trong quá trình chờ xóa
            </div>
            <p className="text-xs">
              Tài khoản được lên lịch xóa vĩnh viễn vào:{' '}
              <strong>{formatDateTime(deletion.scheduledAt)}</strong>.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs bg-background"
            onClick={() => void handleCancelDeletion()}
            disabled={cancelDeletionMutation.isPending}
          >
            <RotateCcw className="size-3.5" />
            Hủy xóa tài khoản
          </Button>
        </div>
      )}

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-10">
          <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
            <User className="size-3.5" />
            <span>Hồ sơ</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm">
            <Shield className="size-3.5" />
            <span>Bảo mật</span>
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-1.5 text-xs sm:text-sm">
            <Laptop className="size-3.5" />
            <span>Phiên đăng nhập</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5 text-xs sm:text-sm">
            <Trash2 className="size-3.5" />
            <span>Dữ liệu</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile & Preferences */}
        <TabsContent value="profile" className="pt-6 space-y-4">
          {profile ? (
            <ProfilePreferencesForm key={profile.id} profile={profile} />
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Đang tải dữ liệu hồ sơ...
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Security / Change Password */}
        <TabsContent value="security" className="pt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Đổi mật khẩu</CardTitle>
              <CardDescription className="text-xs">
                Mật khẩu nên có ít nhất 8 ký tự, kết hợp chữ cái và số để đảm bảo an toàn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="current-pass" className="text-xs">Mật khẩu hiện tại</Label>
                  <Input
                    id="current-pass"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-pass" className="text-xs">Mật khẩu mới</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pass" className="text-xs">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirm-pass"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={changePasswordMutation.isPending}
                    className="gap-1.5 text-xs font-semibold"
                  >
                    <KeyRound className="size-3.5" />
                    {changePasswordMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Active Sessions */}
        <TabsContent value="sessions" className="pt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Phiên đăng nhập đang hoạt động</CardTitle>
              <CardDescription className="text-xs">
                Danh sách các trình duyệt và thiết bị đang đăng nhập vào tài khoản của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y border rounded-lg">
                {(sessionsQuery.data ?? []).map((sess) => (
                  <div key={sess.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Laptop className="size-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-foreground truncate">
                            {sess.deviceName || sess.userAgent || 'Trình duyệt Web'}
                          </p>
                          {sess.current && (
                            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              Thiết bị hiện tại
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          IP: {sess.ipAddress || 'Không rõ'} · Hoạt động gần nhất:{' '}
                          {formatDateTime(sess.lastUsedAt)}
                        </p>
                      </div>
                    </div>

                    {!sess.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => void handleRevokeSession(sess.id)}
                        disabled={revokeSessionMutation.isPending}
                      >
                        Đăng xuất
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Data & Account Deletion */}
        <TabsContent value="data" className="pt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Xuất dữ liệu tài khoản</CardTitle>
              <CardDescription className="text-xs">
                Tải xuống bản sao toàn bộ hồ sơ, phiên phỏng vấn, tiêu chí đánh giá và báo cáo của bạn dưới định dạng JSON.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => void handleExportData()}
                disabled={isExporting}
              >
                <Download className="size-3.5" />
                {isExporting ? 'Đang xuất dữ liệu...' : 'Tải xuống tệp dữ liệu JSON'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <Trash2 className="size-4" />
                Yêu cầu xóa tài khoản
              </CardTitle>
              <CardDescription className="text-xs">
                Sau khi xác nhận, tài khoản của bạn sẽ được lên lịch xóa trong vòng 30 ngày. Trong thời gian này, bạn vẫn có thể hủy yêu cầu bất kỳ lúc nào.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestDeletion} className="space-y-3 max-w-md">
                <div className="space-y-1.5">
                  <Label htmlFor="del-pass" className="text-xs">Nhập mật khẩu xác nhận</Label>
                  <Input
                    id="del-pass"
                    type="password"
                    placeholder="Mật khẩu của bạn..."
                    value={deletionPassword}
                    onChange={(e) => setDeletionPassword(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  variant="destructive"
                  size="sm"
                  disabled={requestDeletionMutation.isPending}
                  className="gap-1.5 text-xs font-semibold mt-2"
                >
                  <Trash2 className="size-3.5" />
                  {requestDeletionMutation.isPending ? 'Đang gửi yêu cầu...' : 'Lên lịch xóa tài khoản'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
