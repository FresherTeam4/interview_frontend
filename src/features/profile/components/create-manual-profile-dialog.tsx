import { useState } from 'react'
import { Plus, UserPlus, Sparkles } from 'lucide-react'
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
import { useCreateManualProfile } from '@/hooks/use-candidate-profile'
import { getErrorMessage } from '@/api/api-error'

interface CreateManualProfileDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export default function CreateManualProfileDialog({
  trigger,
  onSuccess,
}: CreateManualProfileDialogProps) {
  const [open, setOpen] = useState(false)
  const createMutation = useCreateManualProfile()

  const [name, setName] = useState('')
  const [headline, setHeadline] = useState('')
  const [targetPosition, setTargetPosition] = useState('')
  const [yearsExperience, setYearsExperience] = useState<number | ''>('')
  const [skillsText, setSkillsText] = useState('')
  const [summary, setSummary] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !headline.trim()) {
      toast.error('Vui lòng nhập tên ứng viên và tiêu đề hồ sơ')
      return
    }

    const skills = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((skillName) => ({ name: skillName }))

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        headline: headline.trim(),
        targetPosition: targetPosition.trim() || null,
        yearsExperience: typeof yearsExperience === 'number' ? yearsExperience : null,
        skills,
        summary: summary.trim() || null,
        educations: [],
        projects: [],
      })
      toast.success('Đã tạo hồ sơ ứng viên thành công!')
      setOpen(false)
      setName('')
      setHeadline('')
      setTargetPosition('')
      setYearsExperience('')
      setSkillsText('')
      setSummary('')
      onSuccess?.()
    } catch (err) {
      toast.error('Tạo hồ sơ thất bại: ' + getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <UserPlus className="size-3.5" />
            Tạo hồ sơ thủ công
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            Tạo hồ sơ ứng viên
          </DialogTitle>
          <DialogDescription className="text-xs">
            Nhập thông tin năng lực và kinh nghiệm trực tiếp mà không cần tải tệp CV.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="manual-name" className="text-xs">
              Họ và tên ứng viên <span className="text-destructive">*</span>
            </Label>
            <Input
              id="manual-name"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-headline" className="text-xs">
              Tiêu đề hồ sơ <span className="text-destructive">*</span>
            </Label>
            <Input
              id="manual-headline"
              placeholder="Ví dụ: Backend Developer (Java / Spring Boot)"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="manual-target" className="text-xs">
                Vị trí mục tiêu
              </Label>
              <Input
                id="manual-target"
                placeholder="Ví dụ: Fullstack Engineer"
                value={targetPosition}
                onChange={(e) => setTargetPosition(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="manual-exp" className="text-xs">Số năm kinh nghiệm</Label>
              <Input
                id="manual-exp"
                type="number"
                min={0}
                max={50}
                placeholder="Ví dụ: 2"
                value={yearsExperience}
                onChange={(e) =>
                  setYearsExperience(
                    e.target.value === '' ? '' : Number(e.target.value),
                  )
                }
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-skills" className="text-xs">
              Kỹ năng chính (phân cách bằng dấu phẩy)
            </Label>
            <Input
              id="manual-skills"
              placeholder="Java, Spring Boot, MySQL, Docker, React"
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manual-summary" className="text-xs">Tóm tắt bản thân / Mục tiêu</Label>
            <Textarea
              id="manual-summary"
              placeholder="Mô tả ngắn gọn về kinh nghiệm, thế mạnh và định hướng nghề nghiệp..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="text-xs min-h-[70px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
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
              disabled={createMutation.isPending}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="size-3.5" />
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo hồ sơ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
