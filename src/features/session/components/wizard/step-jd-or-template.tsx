import { useState } from 'react'
import { FileUp, FileText, Search, AlertCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import { createFileJd, createTextJd, getJobDescription } from '@/api/jd'
import { getInterviewTemplate } from '@/api/template'
import { getErrorMessage } from '@/api/api-error'
import type { InterviewTemplate } from '@/types/template'

interface StepJdOrTemplateProps {
  selectedTemplate: InterviewTemplate | null
  onTemplateSelected: (template: InterviewTemplate) => void
  onNext: () => void
}

export default function StepJdOrTemplate({
  selectedTemplate,
  onTemplateSelected,
  onNext,
}: StepJdOrTemplateProps) {
  const [customMode, setCustomMode] = useState<'file' | 'text'>('file')
  const [jdTitle, setJdTitle] = useState(selectedTemplate?.title || '')
  const [jdText, setJdText] = useState('')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState<string>('')
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  async function handleAnalyzeCustomJd() {
    if (!jdTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề vị trí tuyển dụng.')
      return
    }

    if (customMode === 'file' && !jdFile) {
      toast.error('Vui lòng chọn file PDF mô tả công việc.')
      return
    }

    if (customMode === 'text' && !jdText.trim()) {
      toast.error('Vui lòng dán nội dung mô tả công việc (JD).')
      return
    }

    setIsProcessing(true)
    setAnalysisError(null)
    setAnalysisStatus('Đang tải lên tài liệu JD…')

    try {
      let jd
      if (customMode === 'file' && jdFile) {
        jd = await createFileJd(jdTitle.trim(), jdFile)
      } else {
        jd = await createTextJd({ title: jdTitle.trim(), text: jdText.trim() })
      }

      setAnalysisStatus('AI đang trích xuất và phân tích các kỹ năng trọng tâm…')

      // Poll JD status
      let attempts = 0
      const maxAttempts = 30
      const pollInterval = setInterval(async () => {
        attempts++
        try {
          const updated = await getJobDescription(jd.id)

          if (updated.status === 'EXTRACTING') {
            setAnalysisStatus('AI đang đọc và trích xuất nội dung JD…')
          } else if (updated.status === 'ANALYZING') {
            setAnalysisStatus('AI đang phân tích các kỹ năng trọng tâm và thiết lập khung phỏng vấn…')
          }

          if (updated.status === 'READY' && updated.templateId) {
            clearInterval(pollInterval)
            setAnalysisStatus('Hoàn tất! Đang tải mẫu phỏng vấn…')

            const resolvedTitle = updated.templateTitle || jdTitle.trim() || 'Vị trí tuyển dụng'
            try {
              const tmpl = await getInterviewTemplate(updated.templateId)
              onTemplateSelected({
                ...tmpl,
                title: tmpl.title || resolvedTitle,
                jobTitle: tmpl.jobTitle || resolvedTitle,
              })
              toast.success('Đã phân tích JD thành công!')
              setIsProcessing(false)
              onNext()
            } catch {
              // Fallback template from JD if template API fails
              const fallbackTemplate: InterviewTemplate = {
                id: updated.templateId,
                title: resolvedTitle,
                jobTitle: resolvedTitle,
                targetSeniority: 'JUNIOR',
                confirmed: true,
                published: false,
                version: 1,
                createdAt: updated.uploadedAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                content: {
                  sufficientJobContext: true,
                  jobTitle: resolvedTitle,
                  summary: updated.rawText?.slice(0, 200) || `Mẫu phỏng vấn tạo từ ${resolvedTitle}`,
                  keySkills: [
                    { name: 'Kỹ năng chuyên môn chính', level: 'MUST_HAVE', description: 'Được trích xuất từ JD' },
                    { name: 'Khả năng giải quyết vấn đề', level: 'MUST_HAVE', description: 'Tư duy logic và xử lý tình huống' },
                  ],
                },
              }
              onTemplateSelected(fallbackTemplate)
              setIsProcessing(false)
              onNext()
            }
          } else if (updated.status === 'FAILED') {
            clearInterval(pollInterval)
            setAnalysisError(updated.statusMessage || 'Quá trình phân tích JD gặp sự cố.')
            setIsProcessing(false)
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval)
            setAnalysisError('Thời gian xử lý quá lâu. Vui lòng thử lại.')
            setIsProcessing(false)
          }
        } catch (err) {
          clearInterval(pollInterval)
          setAnalysisError(getErrorMessage(err))
          setIsProcessing(false)
        }
      }, 1800)
    } catch (err) {
      setAnalysisError(getErrorMessage(err))
      setIsProcessing(false)
    }
  }

  return (
    <Card className="border-border/80">
      <CardContent className="pt-5 space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Mô tả công việc (JD)
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="jdTitle" className="block text-xs font-semibold mb-1.5 text-foreground">
              Tiêu đề vị trí tuyển dụng <span className="text-destructive">*</span>
            </label>
            <Input
              id="jdTitle"
              placeholder="Ví dụ: Backend Golang Engineer, React Frontend..."
              value={jdTitle}
              onChange={(e) => setJdTitle(e.target.value)}
              disabled={isProcessing}
            />
          </div>

          {/* Mode switch */}
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => setCustomMode('file')}
              className={`font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                customMode === 'file'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileUp className="size-3.5" />
              Tải file PDF
            </button>
            <button
              type="button"
              onClick={() => setCustomMode('text')}
              className={`font-semibold pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                customMode === 'text'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="size-3.5" />
              Dán văn bản JD
            </button>
          </div>

          {customMode === 'file' ? (
            <div className="border border-dashed border-input rounded-lg p-6 text-center space-y-2 hover:border-primary/60 transition-colors bg-muted/10">
              <FileText className="size-8 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {jdFile ? jdFile.name : 'Kéo thả hoặc bấm để chọn file PDF của JD'}
                </p>
                <p className="text-xs text-muted-foreground">Định dạng PDF, tối đa 10MB</p>
              </div>
              <Input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setJdFile(file)
                }}
                className="max-w-xs mx-auto text-xs"
                disabled={isProcessing}
              />
            </div>
          ) : (
            <div>
              <Textarea
                placeholder="Dán toàn bộ nội dung tuyển dụng (Mô tả công việc, Yêu cầu kỹ năng, Kinh nghiệm...)"
                rows={7}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                disabled={isProcessing}
                className="text-xs"
              />
            </div>
          )}

          {/* Status or Error display */}
          {isProcessing && (
            <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-xs font-medium">
              <Spinner className="size-4" />
              <span>{analysisStatus}</span>
            </div>
          )}

          {analysisError && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs">
              <AlertCircle className="size-4 shrink-0" />
              <span>{analysisError}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              disabled={isProcessing}
              onClick={() => void handleAnalyzeCustomJd()}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <Spinner className="size-4" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Phân tích JD và tiếp tục
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
