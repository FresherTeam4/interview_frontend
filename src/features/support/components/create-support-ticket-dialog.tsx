import { useState } from 'react'
import { LifeBuoy, Send } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createSupportTicket } from '@/api/support'
import { getErrorMessage } from '@/api/api-error'
import type { SupportTicketType } from '@/types/support'

interface CreateSupportTicketDialogProps {
  trigger?: React.ReactNode
  sessionId?: number
  turnId?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const TICKET_TYPES: Array<{ value: SupportTicketType; label: string }> = [
  { value: 'GENERAL', label: 'Thắc mắc chung' },
  { value: 'TECHNICAL', label: 'Sự cố kỹ thuật / Hệ thống' },
  { value: 'INTERVIEW', label: 'Vấn đề trong phiên phỏng vấn' },
  { value: 'VOICE', label: 'Sự cố âm thanh / Giọng nói AI' },
  { value: 'REPORT', label: 'Phản ánh kết quả báo cáo & điểm số' },
  { value: 'ACCOUNT', label: 'Tài khoản & Dữ liệu' },
]

export default function CreateSupportTicketDialog({
  trigger,
  sessionId,
  turnId,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateSupportTicketDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen

  const [type, setType] = useState<SupportTicketType>(sessionId ? 'INTERVIEW' : 'GENERAL')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !description.trim()) {
      toast.error('Vui lòng điền tiêu đề và mô tả chi tiết')
      return
    }

    setIsSubmitting(true)
    try {
      const ticket = await createSupportTicket({
        type,
        subject: subject.trim(),
        description: description.trim(),
        sessionId,
        turnId,
      })
      toast.success(`Yêu cầu hỗ trợ đã gửi thành công (Mã tra cứu: ${ticket.referenceCode})`)
      setSubject('')
      setDescription('')
      setOpen(false)
    } catch (err) {
      toast.error('Gửi yêu cầu hỗ trợ thất bại: ' + getErrorMessage(err))
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
            <LifeBuoy className="size-3.5" />
            Hỗ trợ
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="size-5 text-primary" />
            Gửi yêu cầu hỗ trợ
          </DialogTitle>
          <DialogDescription className="text-xs">
            Đội ngũ hỗ trợ kỹ thuật sẽ kiểm tra và phản hồi trong thời gian sớm nhất.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-type" className="text-xs">Phân loại vấn đề</Label>
            <Select value={type} onValueChange={(v) => setType(v as SupportTicketType)}>
              <SelectTrigger id="ticket-type" className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TICKET_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-subject" className="text-xs">Tiêu đề</Label>
            <Input
              id="ticket-subject"
              placeholder="Tóm tắt ngắn gọn vấn đề bạn gặp phải..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="text-xs"
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-desc" className="text-xs">Mô tả chi tiết</Label>
            <Textarea
              id="ticket-desc"
              placeholder="Mô tả cụ thể các bước dẫn tới sự cố, thông báo lỗi nếu có..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[100px]"
              maxLength={5000}
              required
            />
          </div>

          {sessionId && (
            <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border">
              Đính kèm ngữ cảnh: Phiên phỏng vấn <strong>#{sessionId}</strong>
              {turnId ? ` · Lượt #${turnId}` : ''}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="gap-1.5 text-xs font-semibold"
            >
              <Send className="size-3.5" />
              {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
