import { useState } from 'react'
import { Award, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getErrorMessage } from '@/api/api-error'
import { useCompleteSession } from '@/hooks/use-interview-session'
import type { InterviewSession } from '@/types/session'

interface SessionCompleteDialogProps {
  session: InterviewSession
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SessionCompleteDialog({
  session,
  open,
  onOpenChange,
}: SessionCompleteDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const completeSession = useCompleteSession(session.id)

  const turnCount = session.turns?.length || 1

  async function handleConfirm() {
    setIsSubmitting(true)
    try {
      await completeSession.mutateAsync({ expectedVersion: session.version })
      toast.success('Đã gửi yêu cầu chấm điểm buổi phỏng vấn.')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Award className="size-5" />
            </div>
            <div>
              <DialogTitle>Hoàn tất phỏng vấn & Chấm điểm</DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                Phiên #{session.id} • {session.jobDescription.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2 text-sm">
          <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 text-xs">
            <span className="text-muted-foreground">Hình thức phỏng vấn:</span>
            <span className="font-semibold text-foreground">
              {session.mode === 'TEXT' ? 'Văn bản (Chat)' : 'Giọng nói (Voice)'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3 text-xs">
            <span className="text-muted-foreground">Số lượt đối thoại đã thực hiện:</span>
            <span className="font-semibold text-foreground">
              {turnCount} lượt trao đổi trực tiếp
            </span>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
            <CheckCircle2 className="size-4 shrink-0 text-primary mt-0.5" />
            <span>
              AI sẽ phân tích đối thoại và xuất báo cáo đánh giá chi tiết kèm gợi ý cải thiện.
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Tiếp tục trao đổi
          </Button>
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Award className="size-4" />
                Xác nhận kết thúc & Chấm điểm
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
