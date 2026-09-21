import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import CreateInterviewWizard from '@/features/session/components/wizard/create-interview-wizard'
import { sessionDetailPath } from '@/constants/routes'
import type { InterviewTemplate } from '@/types/template'

interface CreateInterviewDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: ReactNode
  initialTemplateId?: number
  initialTemplate?: InterviewTemplate
}

export default function CreateInterviewDialog({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
  initialTemplateId,
  initialTemplate,
}: CreateInterviewDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? controlledOnOpenChange : setUncontrolledOpen
  const navigate = useNavigate()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b shrink-0">
          <DialogTitle className="text-lg font-bold">Tạo phiên phỏng vấn mới</DialogTitle>
          <DialogDescription className="sr-only">
            Chọn vị trí phỏng vấn và cấu hình để bắt đầu luyện tập
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
          <CreateInterviewWizard
            initialTemplateId={initialTemplateId}
            initialTemplate={initialTemplate}
            onSuccess={(sessionId) => {
              setOpen?.(false)
              navigate(sessionDetailPath(sessionId))
            }}
            onCancel={() => setOpen?.(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
