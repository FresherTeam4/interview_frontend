import { useState } from 'react'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SkillEditor from '@/features/session/components/wizard/skill-editor'
import { updateInterviewTemplate, confirmInterviewTemplate } from '@/api/template'
import type { InterviewTemplate, KeySkill } from '@/types/template'

interface StepTemplateReviewProps {
  template: InterviewTemplate
  onTemplateUpdated: (template: InterviewTemplate) => void
  onNext: () => void
  onBack: () => void
}

export default function StepTemplateReview({
  template,
  onTemplateUpdated,
  onNext,
  onBack,
}: StepTemplateReviewProps) {
  const [title, setTitle] = useState(template.title)
  const [jobTitle, setJobTitle] = useState(template.jobTitle || template.title)
  const [seniority, setSeniority] = useState(template.targetSeniority || 'JUNIOR')
  const [summary, setSummary] = useState(template.content?.summary || '')
  const [skills, setSkills] = useState<KeySkill[]>(template.content?.keySkills || [])
  const [isSaving, setIsSaving] = useState(false)

  async function handleProceed() {
    setIsSaving(true)
    const updatedContent = {
      sufficientJobContext: true,
      jobTitle,
      targetSeniority: seniority,
      summary,
      domain: template.content?.domain || 'Công nghệ thông tin',
      keySkills: skills,
    }

    const updatedTemplate: InterviewTemplate = {
      ...template,
      title,
      jobTitle,
      targetSeniority: seniority,
      content: updatedContent,
    }

    // Nếu là template từ backend thực tế (id > 0) và chưa confirm
    if (template.id > 0 && !template.confirmed) {
      try {
        const res = await updateInterviewTemplate(template.id, {
          expectedVersion: template.version,
          title,
          jobTitle,
          targetSeniority: seniority,
          content: updatedContent,
        })
        if (!res.confirmed) {
          await confirmInterviewTemplate(template.id, res.version)
        }
        updatedTemplate.version = res.version
        updatedTemplate.confirmed = true
      } catch {
        if (!template.confirmed) {
          try {
            await confirmInterviewTemplate(template.id, template.version)
            updatedTemplate.confirmed = true
          } catch {
            // Đã confirm trước đó
          }
        }
      }
    }

    onTemplateUpdated(updatedTemplate)
    setIsSaving(false)
    onNext()
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Xem lại tiêu chí phỏng vấn</CardTitle>
              <CardDescription className="text-xs">
                Kiểm tra các thông tin trọng tâm mà AI sẽ sử dụng để hỏi và chấm điểm cho bạn.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-success font-medium bg-success/10 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="size-3.5" />
              Sẵn sàng
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Tên mẫu phỏng vấn
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Vị trí công việc
              </label>
              <Input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Cấp bậc mục tiêu
              </label>
              <select
                value={seniority}
                onChange={(e) => setSeniority(e.target.value)}
                className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 font-medium"
              >
                <option value="INTERN">INTERN (Thực tập sinh)</option>
                <option value="FRESHER">FRESHER (Mới tốt nghiệp)</option>
                <option value="JUNIOR">JUNIOR (1-2 năm kinh nghiệm)</option>
                <option value="MIDDLE">MIDDLE (2-4 năm kinh nghiệm)</option>
                <option value="SENIOR">SENIOR (5+ năm kinh nghiệm)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-foreground">
                Lĩnh vực / Chuyên môn
              </label>
              <Input
                disabled
                value={template.content?.domain || 'Phát triển phần mềm'}
                className="text-xs bg-muted/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 text-foreground">
              Mô tả tóm tắt bối cảnh
            </label>
            <Textarea
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="text-xs"
              placeholder="Tóm tắt ngắn gọn yêu cầu công việc..."
            />
          </div>

          <div className="pt-2 border-t border-border/70">
            <SkillEditor skills={skills} onChange={setSkills} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="gap-2">
          <ArrowLeft className="size-4" />
          Quay lại chọn mẫu
        </Button>
        <Button
          type="button"
          disabled={isSaving || skills.length === 0}
          onClick={() => void handleProceed()}
          className="gap-2"
        >
          {isSaving ? 'Đang lưu…' : 'Tiếp tục chọn hồ sơ'}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
