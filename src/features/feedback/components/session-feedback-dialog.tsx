import { useState, useEffect } from 'react'
import { Star, MessageSquareHeart, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getSessionFeedback, upsertSessionFeedback } from '@/api/feedback'
import { getErrorMessage } from '@/api/api-error'

interface SessionFeedbackDialogProps {
  sessionId: number
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function StarRating({
  value,
  onChange,
}: {
  value: number | null
  onChange: (val: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 text-muted-foreground/40 hover:text-amber-400 transition-colors focus:outline-hidden"
        >
          <Star
            className={`size-5 ${
              (value ?? 0) >= star
                ? 'fill-amber-400 text-amber-400'
                : 'hover:fill-amber-200'
            }`}
          />
        </button>
      ))}
      <span className="text-xs text-muted-foreground ml-2">
        {value ? `${value}/5 sao` : 'Chưa chọn'}
      </span>
    </div>
  )
}

export default function SessionFeedbackDialog({
  sessionId,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: SessionFeedbackDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [questionRating, setQuestionRating] = useState<number | null>(null)
  const [voiceRating, setVoiceRating] = useState<number | null>(null)
  const [reportRating, setReportRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasExistingFeedback, setHasExistingFeedback] = useState(false)

  useEffect(() => {
    if (open && sessionId) {
      void getSessionFeedback(sessionId).then((fb) => {
        if (fb) {
          setHasExistingFeedback(true)
          setQuestionRating(fb.questionRating)
          setVoiceRating(fb.voiceRating)
          setReportRating(fb.reportRating)
          setComment(fb.comment ?? '')
        }
      })
    }
  }, [open, sessionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      questionRating === null &&
      voiceRating === null &&
      reportRating === null &&
      !comment.trim()
    ) {
      toast.error('Vui lòng chọn ít nhất một đánh giá hoặc gửi nhận xét')
      return
    }

    setIsSubmitting(true)
    try {
      await upsertSessionFeedback(sessionId, {
        questionRating,
        voiceRating,
        reportRating,
        comment: comment.trim() || null,
      })
      toast.success(
        hasExistingFeedback
          ? 'Đã cập nhật đánh giá phiên phỏng vấn'
          : 'Cảm ơn bạn đã gửi đánh giá phiên phỏng vấn!',
      )
      setOpen(false)
    } catch (err) {
      toast.error('Gửi đánh giá thất bại: ' + getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      {!trigger && !isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <MessageSquareHeart className="size-3.5" />
            Đánh giá phiên
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquareHeart className="size-5 text-amber-500" />
            Đánh giá chất lượng phỏng vấn
          </DialogTitle>
          <DialogDescription className="text-xs">
            Ý kiến đóng góp của bạn giúp mô hình AI nâng cao chất lượng câu hỏi và phản hồi.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1">
            <Label className="text-xs font-medium">Chất lượng câu hỏi chuyên môn</Label>
            <StarRating value={questionRating} onChange={setQuestionRating} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Chất lượng giọng nói / âm thanh AI</Label>
            <StarRating value={voiceRating} onChange={setVoiceRating} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-medium">Chất lượng báo cáo đánh giá & gợi ý</Label>
            <StarRating value={reportRating} onChange={setReportRating} />
          </div>

          <div className="space-y-1.5 pt-1">
            <Label htmlFor="fb-comment" className="text-xs font-medium">
              Nhận xét hoặc góp ý bổ sung (tùy chọn)
            </Label>
            <Textarea
              id="fb-comment"
              placeholder="Bạn cảm thấy câu hỏi nào chưa thực tế, hoặc có lỗi phát âm nào cần cải thiện..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-xs min-h-[80px]"
              maxLength={2000}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Đóng
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 text-xs font-semibold"
            >
              <Check className="size-3.5" />
              {isSubmitting ? 'Đang lưu...' : hasExistingFeedback ? 'Cập nhật' : 'Gửi đánh giá'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
