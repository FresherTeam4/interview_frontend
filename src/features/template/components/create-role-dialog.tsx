import { useState } from 'react'
import { FileUp, FileText, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { createFileJd, createTextJd, getJobDescription } from '@/api/jd'
import { getInterviewTemplate, updateInterviewTemplate } from '@/api/template'
import { getErrorMessage } from '@/api/api-error'

interface CreateRoleDialogProps {
  trigger?: React.ReactNode
  onSuccess?: (templateId: number) => void
}

export default function CreateRoleDialog({ trigger, onSuccess }: CreateRoleDialogProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'file' | 'text'>('file')
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdTemplateId, setCreatedTemplateId] = useState<number | null>(null)

  function resetState() {
    setTitle('')
    setText('')
    setFile(null)
    setIsSubmitting(false)
    setStatusMessage('')
    setErrorMessage(null)
    setCreatedTemplateId(null)
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && isSubmitting) return
    setOpen(newOpen)
    if (!newOpen) {
      setTimeout(resetState, 300)
    }
  }

  async function handleAnalyze() {
    if (mode === 'text' && !title.trim()) {
      toast.error('Vui lòng nhập tiêu đề vị trí khi dán văn bản JD.')
      return
    }

    if (mode === 'file' && !file) {
      toast.error('Vui lòng chọn file PDF mô tả công việc (JD).')
      return
    }

    if (mode === 'text' && !text.trim()) {
      toast.error('Vui lòng nhập nội dung mô tả công việc (JD).')
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setStatusMessage('Đang tải lên tài liệu JD…')

    try {
      const userEnteredTitle = title.trim()
      let jd
      if (mode === 'file' && file) {
        const finalTitle = userEnteredTitle || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        jd = await createFileJd(finalTitle, file)
      } else {
        jd = await createTextJd({ title: userEnteredTitle, text: text.trim() })
      }

      setStatusMessage('AI đang trích xuất và phân tích tiêu chí công việc…')

      // Poll JD status until READY or FAILED
      let attempts = 0
      const maxAttempts = 30
      const pollTimer = setInterval(async () => {
        attempts++
        try {
          const updated = await getJobDescription(jd.id)

          if (updated.status === 'EXTRACTING') {
            setStatusMessage('AI đang đọc và trích xuất nội dung JD…')
          } else if (updated.status === 'ANALYZING') {
            setStatusMessage('AI đang phân tích các kỹ năng trọng tâm và thiết lập khung phỏng vấn…')
          }

          if (updated.status === 'READY' && updated.templateId) {
            clearInterval(pollTimer)

            // If user entered a custom title, keep user's title on the template instead of AI jobTitle
            if (userEnteredTitle) {
              try {
                const currentTemplate = await getInterviewTemplate(updated.templateId)
                if (currentTemplate && currentTemplate.title !== userEnteredTitle) {
                  await updateInterviewTemplate(updated.templateId, {
                    expectedVersion: currentTemplate.version,
                    title: userEnteredTitle,
                    jobTitle: currentTemplate.jobTitle,
                    targetSeniority: currentTemplate.targetSeniority,
                    content: currentTemplate.content,
                  })
                }
              } catch (renameErr) {
                console.warn('Could not set custom title on template:', renameErr)
              }
            }

            setIsSubmitting(false)
            setCreatedTemplateId(updated.templateId)
            toast.success('Đã tạo vị trí phỏng vấn thành công!')
            void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
            void queryClient.invalidateQueries({ queryKey: ['job-descriptions'] })
            onSuccess?.(updated.templateId)
          } else if (updated.status === 'FAILED') {
            clearInterval(pollTimer)
            setIsSubmitting(false)
            setErrorMessage(updated.statusMessage || 'Quá trình trích xuất JD gặp sự cố.')
          } else if (attempts >= maxAttempts) {
            clearInterval(pollTimer)
            setIsSubmitting(false)
            setErrorMessage('Thời gian xử lý quá lâu. Vui lòng thử lại.')
          }
        } catch (err) {
          clearInterval(pollTimer)
          setIsSubmitting(false)
          setErrorMessage(getErrorMessage(err))
        }
      }, 1800)
    } catch (err) {
      setIsSubmitting(false)
      setErrorMessage(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Sparkles className="size-4" />
            Tạo vị trí mới từ JD
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Tạo vị trí phỏng vấn mới</DialogTitle>
          <DialogDescription>
            Tải lên bản mô tả công việc (JD) dạng PDF hoặc dán văn bản để AI tự động thiết lập khung tiêu chí phỏng vấn.
          </DialogDescription>
        </DialogHeader>

        {createdTemplateId ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="size-14 rounded-full bg-success/15 text-success flex items-center justify-center">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Đã tạo vị trí phỏng vấn thành công!</h3>
              <p className="text-sm text-muted-foreground">
                Khung tiêu chí và danh sách kỹ năng đã được lưu vào danh mục <strong>Vị trí của tôi</strong>.
              </p>
            </div>
            <Button className="w-full mt-2" onClick={() => handleOpenChange(false)}>
              Hoàn tất & Đóng
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <label htmlFor="roleTitle" className="block text-xs font-semibold mb-1.5 text-foreground">
                Tiêu đề vị trí {mode === 'text' ? <span className="text-destructive">*</span> : <span className="text-muted-foreground font-normal text-[11px]">(tự động trích xuất nếu để trống)</span>}
              </label>
              <Input
                id="roleTitle"
                placeholder={mode === 'file' ? 'Để trống để AI tự trích xuất, hoặc nhập tên gợi nhớ...' : 'Ví dụ: Backend Golang Engineer, React Frontend...'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Mode switch */}
            <div className="flex items-center gap-4 text-xs pt-1">
              <button
                type="button"
                onClick={() => setMode('file')}
                className={`font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                  mode === 'file'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileUp className="size-3.5" />
                Tải file PDF
              </button>
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                  mode === 'text'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="size-3.5" />
                Dán văn bản JD
              </button>
            </div>

            {mode === 'file' ? (
              <div className="border border-dashed border-input rounded-lg p-6 text-center space-y-2 hover:border-primary/60 transition-colors bg-muted/10">
                <FileText className="size-8 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {file ? file.name : 'Kéo thả hoặc bấm để chọn file PDF của JD'}
                  </p>
                  <p className="text-xs text-muted-foreground">Định dạng PDF, tối đa 10MB</p>
                </div>
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const selected = e.target.files?.[0]
                    if (selected) {
                      setFile(selected)
                      if (!title) {
                        setTitle(selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '))
                      }
                    }
                  }}
                  className="max-w-xs mx-auto text-xs"
                  disabled={isSubmitting}
                />
              </div>
            ) : (
              <div>
                <Textarea
                  placeholder="Dán nội dung tuyển dụng: Mô tả công việc, Yêu cầu kỹ năng, Trách nhiệm..."
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isSubmitting}
                  className="text-xs"
                />
              </div>
            )}

            {/* Progress Status */}
            {isSubmitting && (
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-xs font-medium">
                <Spinner className="size-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => handleOpenChange(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={() => void handleAnalyze()}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="size-4" />
                    Đang thiết lập...
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Bắt đầu trích xuất JD
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
