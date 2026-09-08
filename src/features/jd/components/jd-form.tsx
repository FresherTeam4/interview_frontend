import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Copy, Info, Save, ShieldCheck } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import JdStatusBadge from '@/features/jd/components/jd-status-badge'
import { getErrorMessage } from '@/api/api-error'
import { useConfirmJd, useUpdateJd } from '@/hooks/use-job-descriptions'
import { JD_STATUS, JD_TITLE_MAX_LENGTH } from '@/constants/jd'
import { ROUTES } from '@/constants/routes'
import type { JobDescription } from '@/types/jd'

interface JdFormProps {
  jd: JobDescription
}

export default function JdForm({ jd }: JdFormProps) {
  const navigate = useNavigate()
  const isReady = jd.status === JD_STATUS.READY
  const [title, setTitle] = useState(jd.title)
  const [confirmedText, setConfirmedText] = useState(jd.confirmedText ?? jd.rawText ?? '')

  const updateJd = useUpdateJd(jd.id)
  const confirmJd = useConfirmJd(jd.id)

  const isBusy = updateJd.isPending || confirmJd.isPending
  const isDirty = title !== jd.title || confirmedText !== (jd.confirmedText ?? jd.rawText ?? '')

  async function handleSave() {
    try {
      await updateJd.mutateAsync({ title: title.trim(), confirmedText: confirmedText.trim() || null })
      toast.success('Đã lưu thay đổi.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleConfirm() {
    // Lưu trước nếu có thay đổi chưa lưu
    if (isDirty) {
      try {
        await updateJd.mutateAsync({ title: title.trim(), confirmedText: confirmedText.trim() || null })
      } catch (error) {
        toast.error(getErrorMessage(error))
        return
      }
    }
    try {
      await confirmJd.mutateAsync()
      toast.success('Đã xác nhận JD. Giờ có thể dùng cho phỏng vấn.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  function handleClone() {
    navigate(ROUTES.jdCreate, {
      state: {
        title: `${jd.title} (Bản sao)`,
        text: jd.confirmedText ?? jd.rawText ?? '',
      },
    })
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Thông tin JD</CardTitle>
        </div>
        <JdStatusBadge status={jd.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {isReady ? (
          <Alert>
            <Info className="size-4" />
            <AlertTitle>JD đã được xác nhận (READY)</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
              <span>
                JD đã chốt để đảm bảo tính toàn vẹn dữ liệu cho các phiên phỏng vấn. Nếu muốn sửa, bạn có thể tạo một bản sao mới.
              </span>
              <Button size="sm" variant="outline" onClick={handleClone}>
                <Copy className="size-3.5" />
                Tạo bản sao để sửa
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="jd-title">Tiêu đề</Label>
          <Input
            id="jd-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={JD_TITLE_MAX_LENGTH}
            disabled={isReady || isBusy}
            placeholder="Ví dụ: Frontend Developer - React"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="jd-text">Nội dung JD</Label>
          <Textarea
            id="jd-text"
            value={confirmedText}
            onChange={(e) => setConfirmedText(e.target.value)}
            disabled={isReady || isBusy}
            rows={16}
            className="font-mono text-sm"
            placeholder="Dán nội dung mô tả công việc vào đây..."
          />
        </div>

        {!isReady ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => void handleSave()}
              disabled={!isDirty || isBusy}
            >
              <Save className="size-4" />
              Lưu nháp
            </Button>
            <Button
              onClick={() => void handleConfirm()}
              disabled={isBusy || !title.trim()}
            >
              <ShieldCheck className="size-4" />
              {confirmJd.isPending ? 'Đang xác nhận...' : 'Xác nhận JD'}
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
