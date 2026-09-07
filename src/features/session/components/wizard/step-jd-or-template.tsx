import { useState, useEffect } from 'react'
import { FileUp, FileText, Briefcase, Search, AlertCircle, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent } from '@/components/ui/card'
import TemplateCardSelector from '@/features/session/components/wizard/template-card-selector'
import { PRESET_TEMPLATES } from '@/features/session/data/preset-templates'
import { createFileJd, createTextJd, getJobDescription } from '@/api/jd'
import { getInterviewTemplate, getInterviewTemplates } from '@/api/template'
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
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset')
  const [allTemplates, setAllTemplates] = useState<InterviewTemplate[]>(PRESET_TEMPLATES)

  // Custom JD state
  const [customMode, setCustomMode] = useState<'file' | 'text'>('file')
  const [jdTitle, setJdTitle] = useState('')
  const [jdText, setJdText] = useState('')
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [analysisStatus, setAnalysisStatus] = useState<string>('')
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Load backend published templates if available to merge with presets
  useEffect(() => {
    let active = true
    async function loadPublished() {
      try {
        const [publicRes, mineRes] = await Promise.allSettled([
          getInterviewTemplates('public', 0, 50),
          getInterviewTemplates('mine', 0, 50),
        ])

        const publicItems = publicRes.status === 'fulfilled' ? publicRes.value.items || [] : []
        const mineItems = mineRes.status === 'fulfilled' ? mineRes.value.items || [] : []
        const combined = [...mineItems, ...publicItems]

        if (active && combined.length > 0) {
          const uniqueIds = Array.from(new Set(combined.map((t) => t.id)))
          const fulls = await Promise.all(
            uniqueIds.slice(0, 10).map(async (id) => {
              try {
                return await getInterviewTemplate(id)
              } catch {
                return null
              }
            }),
          )
          const validFulls = fulls.filter((t): t is InterviewTemplate => t !== null)
          if (validFulls.length > 0) {
            setAllTemplates([...validFulls, ...PRESET_TEMPLATES])
          }
        }
      } catch {
        // Use default preset templates if backend doesn't have published templates
      }
    }
    void loadPublished()
    return () => {
      active = false
    }
  }, [])

  async function handleAnalyzeCustomJd() {
    if (!jdTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề cho mô tả công việc (JD).')
      return
    }

    if (customMode === 'file' && !jdFile) {
      toast.error('Vui lòng chọn file PDF mô tả công việc.')
      return
    }

    if (customMode === 'text' && !jdText.trim()) {
      toast.error('Vui lòng dán nội dung mô tả công việc.')
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

      setAnalysisStatus('AI đang bóc tách và phân tích các kỹ năng trọng tâm…')

      // Poll JD status
      let attempts = 0
      const maxAttempts = 30
      const pollInterval = setInterval(async () => {
        attempts++
        try {
          const updated = await getJobDescription(jd.id)

          if (updated.status === 'EXTRACTING') {
            setAnalysisStatus('AI đang đọc và bóc tách nội dung JD…')
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
              toast.success('Đã tạo mẫu phỏng vấn thành công từ JD!')
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
    <div className="space-y-6">
      {/* Tabs selection */}
      <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-xl border border-border/60 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('preset')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'preset'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Briefcase className="size-4 text-primary" />
          <span>Mẫu có sẵn (Nhanh)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('custom')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'custom'
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileUp className="size-4 text-primary" />
          <span>Tải lên / Dán JD mới</span>
        </button>
      </div>

      {activeTab === 'preset' ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold">Chọn mẫu vị trí bạn muốn luyện tập</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hệ thống đã xây dựng sẵn khung năng lực và tiêu chí đánh giá chuẩn hóa cho các vị trí công nghệ phổ biến.
            </p>
          </div>

          <TemplateCardSelector
            templates={allTemplates}
            selectedTemplateId={selectedTemplate?.id}
            onSelect={(t) => onTemplateSelected(t)}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              disabled={!selectedTemplate}
              onClick={onNext}
              className="gap-2"
            >
              Tiếp tục với mẫu này
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      ) : (
        <Card className="border-border/80">
          <CardContent className="pt-6 space-y-5">
            <div>
              <h3 className="text-base font-semibold">Tạo phỏng vấn từ Mô tả công việc (JD) riêng</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                AI sẽ quét JD để trích xuất các yêu cầu công nghệ bắt buộc và xác lập các trọng tâm phỏng vấn thích ứng tương ứng.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="jdTitle" className="block text-xs font-semibold mb-1.5 text-foreground">
                  Tiêu đề vị trí tuyển dụng <span className="text-destructive">*</span>
                </label>
                <Input
                  id="jdTitle"
                  placeholder="Ví dụ: Backend Golang Engineer - VNG"
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
                  className={`font-semibold pb-1 border-b-2 transition-colors ${
                    customMode === 'file'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tải file PDF
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMode('text')}
                  className={`font-semibold pb-1 border-b-2 transition-colors ${
                    customMode === 'text'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Dán văn bản JD
                </button>
              </div>

              {customMode === 'file' ? (
                <div className="border border-dashed border-input rounded-lg p-6 text-center space-y-2 hover:border-primary/60 transition-colors">
                  <FileText className="size-8 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {jdFile ? jdFile.name : 'Chọn file PDF của Mô tả công việc'}
                    </p>
                    <p className="text-xs text-muted-foreground">Tối đa 10MB</p>
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
                    placeholder="Dán toàn bộ nội dung tuyển dụng (Trách nhiệm, Yêu cầu kỹ năng, Quyền lợi...)"
                    rows={6}
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
                  {isProcessing ? <Spinner className="size-4" /> : <Search className="size-4" />}
                  Phân tích JD và tạo mẫu
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
