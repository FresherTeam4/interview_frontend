import { useState } from 'react'
import {
  BadgeCheck,
  CheckCircle2,
  Globe,
  Lock,
  Play,
  TriangleAlert,
  Archive,
  Briefcase,
  Pencil,
  Check,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { MarkdownPreview } from '@/components/markdown-preview'
import SkillEditor from '@/features/session/components/wizard/skill-editor'
import {
  useInterviewTemplate,
  useConfirmInterviewTemplate,
  usePublishInterviewTemplate,
  useUnpublishInterviewTemplate,
  useArchiveInterviewTemplate,
  useUpdateInterviewTemplate,
} from '@/hooks/use-interview-templates'
import { useAuth } from '@/hooks/use-auth'
import { ROLES } from '@/constants/roles'
import { getErrorMessage } from '@/api/api-error'
import type { InterviewTemplate, KeySkill } from '@/types/template'

interface RoleDetailDialogProps {
  templateId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartPractice?: (template: InterviewTemplate) => void
}

export default function RoleDetailDialog({
  templateId,
  open,
  onOpenChange,
  onStartPractice,
}: RoleDetailDialogProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === ROLES.ADMIN

  const templateQuery = useInterviewTemplate(open ? templateId : null)
  const confirmMutation = useConfirmInterviewTemplate()
  const publishMutation = usePublishInterviewTemplate()
  const unpublishMutation = useUnpublishInterviewTemplate()
  const archiveMutation = useArchiveInterviewTemplate()
  const updateMutation = useUpdateInterviewTemplate()

  const [isBusy, setIsBusy] = useState(false)
  const [isEditingCriteria, setIsEditingCriteria] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editJobTitle, setEditJobTitle] = useState('')
  const [editSeniority, setEditSeniority] = useState('JUNIOR')
  const [editSummary, setEditSummary] = useState('')
  const [editSkills, setEditSkills] = useState<KeySkill[]>([])

  const template = templateQuery.data

  function handleStartEdit() {
    if (!template) return
    setEditTitle(template.title || '')
    setEditJobTitle(template.jobTitle || '')
    setEditSeniority(template.targetSeniority || 'JUNIOR')
    setEditSummary(template.content?.summary || '')
    setEditSkills(template.content?.keySkills || [])
    setIsEditingCriteria(true)
  }

  function handleCancelEdit() {
    setIsEditingCriteria(false)
  }

  async function handleSaveCriteria() {
    if (!template) return
    if (!editTitle.trim()) {
      toast.error('Tiêu đề vị trí không được để trống.')
      return
    }
    if (editSkills.length === 0) {
      toast.error('Vui lòng giữ ít nhất 1 kỹ năng trọng tâm.')
      return
    }

    setIsBusy(true)
    try {
      await updateMutation.mutateAsync({
        id: template.id,
        data: {
          expectedVersion: template.version,
          title: editTitle.trim(),
          jobTitle: editJobTitle.trim() || template.jobTitle,
          targetSeniority: editSeniority,
          content: {
            ...template.content,
            sufficientJobContext: template.content?.sufficientJobContext ?? true,
            jobTitle: editJobTitle.trim() || template.jobTitle,
            targetSeniority: editSeniority,
            summary: editSummary.trim(),
            keySkills: editSkills,
          },
        },
      })
      toast.success('Đã cập nhật khung tiêu chí vị trí phỏng vấn.')
      setIsEditingCriteria(false)
    } catch (err) {
      toast.error('Cập nhật thất bại: ' + getErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleConfirm() {
    if (!template) return
    setIsBusy(true)
    try {
      await confirmMutation.mutateAsync({
        id: template.id,
        expectedVersion: template.version,
      })
      toast.success('Đã xác nhận khung tiêu chí vị trí phỏng vấn.')
    } catch (err) {
      toast.error('Xác nhận thất bại: ' + getErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleTogglePublish() {
    if (!template) return
    setIsBusy(true)
    try {
      if (template.published) {
        await unpublishMutation.mutateAsync({
          id: template.id,
          expectedVersion: template.version,
        })
        toast.success('Đã chuyển vị trí về trạng thái riêng tư.')
      } else {
        await publishMutation.mutateAsync({
          id: template.id,
          expectedVersion: template.version,
        })
        toast.success('Đã công khai vị trí phỏng vấn cho cộng đồng.')
      }
    } catch (err) {
      toast.error('Thao tác công khai thất bại: ' + getErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleArchive() {
    if (!template) return
    setIsBusy(true)
    try {
      await archiveMutation.mutateAsync({
        id: template.id,
        expectedVersion: template.version,
      })
      toast.success('Đã lưu trữ vị trí phỏng vấn.')
      onOpenChange(false)
    } catch (err) {
      toast.error('Lưu trữ thất bại: ' + getErrorMessage(err))
    } finally {
      setIsBusy(false)
    }
  }

  function handlePractice() {
    if (!template) return
    onOpenChange(false)
    onStartPractice?.(template)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isBusy) return
        if (!nextOpen) setIsEditingCriteria(false)
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-[660px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/60">
          {/* Top badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {template?.published ? (
              <Badge variant="secondary" className="gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200">
                <Globe className="size-3" />
                Công khai
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Lock className="size-3" />
                Riêng tư
              </Badge>
            )}
            {template?.targetSeniority && (
              <Badge variant="outline" className="font-semibold text-xs">
                {template.targetSeniority}
              </Badge>
            )}
            {template?.confirmed ? (
              <Badge variant="outline" className="gap-1 text-success border-success/30">
                <BadgeCheck className="size-3.5" />
                Đã duyệt tiêu chí
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50/50 dark:bg-amber-950/30">
                <TriangleAlert className="size-3.5" />
                Chờ duyệt tiêu chí
              </Badge>
            )}
          </div>

          {/* Title & Description */}
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-xl font-bold">
              {template?.title || 'Chi tiết vị trí phỏng vấn'}
            </DialogTitle>
            {template && !template.confirmed && !isEditingCriteria && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-xs gap-1.5 shrink-0"
                onClick={handleStartEdit}
              >
                <Pencil className="size-3.5" />
                Chỉnh sửa
              </Button>
            )}
          </div>

          <DialogDescription className="text-xs mt-1 text-muted-foreground flex items-center gap-1.5">
            <Briefcase className="size-3 shrink-0" />
            {template?.jobTitle ? `Chức danh JD: ${template.jobTitle}` : 'Khung tiêu chí và kỹ năng phỏng vấn do AI trích xuất từ JD.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {templateQuery.isPending ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ) : template ? (
            isEditingCriteria ? (
              /* Edit Criteria Form */
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <SlidersHorizontal className="size-4" />
                    Chỉnh sửa khung tiêu chí & yêu cầu
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Điều chỉnh kỹ năng hoặc bối cảnh trước khi xác nhận
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-foreground">
                      Tiêu đề nhận diện <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-xs h-9"
                      placeholder="Nhập tiêu đề nhận diện..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-foreground">
                      Chức danh công việc
                    </label>
                    <Input
                      value={editJobTitle}
                      onChange={(e) => setEditJobTitle(e.target.value)}
                      className="text-xs h-9"
                      placeholder="Chức danh trích xuất từ JD..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Cấp bậc mục tiêu
                  </label>
                  <select
                    value={editSeniority}
                    onChange={(e) => setEditSeniority(e.target.value)}
                    className="w-full text-xs h-9 rounded-md border border-input bg-background px-3 font-medium"
                  >
                    <option value="INTERN">INTERN (Thực tập sinh)</option>
                    <option value="FRESHER">FRESHER (Mới tốt nghiệp)</option>
                    <option value="JUNIOR">JUNIOR (1-2 năm kinh nghiệm)</option>
                    <option value="MIDDLE">MIDDLE (2-4 năm kinh nghiệm)</option>
                    <option value="SENIOR">SENIOR (5+ năm kinh nghiệm)</option>
                    <option value="LEAD">LEAD (Trưởng nhóm / Quản lý)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-foreground">
                    Tóm tắt bối cảnh vị trí (Markdown)
                  </label>
                  <Textarea
                    rows={5}
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="text-xs leading-relaxed"
                    placeholder="Nhập hoặc chỉnh sửa tóm tắt bối cảnh vị trí..."
                  />
                </div>

                <div className="pt-2 border-t border-border/70">
                  <SkillEditor skills={editSkills} onChange={setEditSkills} />
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
                {/* Draft Alert Banner */}
                {!template.confirmed && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-amber-300/80 bg-amber-50/80 dark:bg-amber-950/30 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200">
                    <div className="flex items-center gap-2">
                      <TriangleAlert className="size-4 shrink-0 text-amber-600" />
                      <span>Bản nháp: Bạn có thể tinh chỉnh tiêu chí & kỹ năng hoặc xác nhận để phỏng vấn.</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 bg-background text-foreground hover:bg-muted"
                        disabled={isBusy}
                        onClick={handleStartEdit}
                      >
                        <Pencil className="size-3.5" />
                        Chỉnh sửa tiêu chí
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1.5 h-8"
                        disabled={isBusy}
                        onClick={() => void handleConfirm()}
                      >
                        {isBusy ? <Spinner className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                        Xác nhận ngay
                      </Button>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {template.content?.summary && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center justify-between">
                      <span>Tóm tắt bối cảnh vị trí</span>
                      <span className="text-[11px] font-normal text-muted-foreground/80 lowercase">
                        Trích xuất tự động từ JD
                      </span>
                    </h4>
                    <MarkdownPreview content={template.content.summary} />
                  </div>
                )}

                {/* Key skills list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Khung kỹ năng đánh giá ({template.content?.keySkills?.length ?? 0})
                    </h4>
                    {!template.confirmed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={handleStartEdit}
                      >
                        <Pencil className="size-3" />
                        Chỉnh sửa kỹ năng
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-2.5">
                    {template.content?.keySkills?.map((skill, index) => {
                      const isMustHave = skill.level === 'MUST_HAVE'
                      return (
                        <div
                          key={index}
                          className="flex flex-col gap-1 p-3 rounded-lg border border-border/80 bg-card hover:bg-muted/10 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {skill.name}
                            </span>
                            <Badge
                              variant={isMustHave ? 'default' : 'secondary'}
                              className={`text-[10px] uppercase font-bold tracking-wide ${
                                isMustHave
                                  ? 'bg-primary/90 text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isMustHave ? 'Bắt buộc' : 'Ưu tiên'}
                            </Badge>
                          </div>
                          {skill.description && (
                            <p className="text-xs text-muted-foreground leading-normal">
                              {skill.description}
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              Không tìm thấy thông tin vị trí phỏng vấn này.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border/60 bg-muted/10 flex flex-wrap items-center justify-between gap-2">
          {isEditingCriteria ? (
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={handleCancelEdit}
              >
                <X className="size-3.5 mr-1" />
                Hủy
              </Button>
              <Button
                size="sm"
                className="gap-1.5 font-semibold"
                disabled={isBusy}
                onClick={() => void handleSaveCriteria()}
              >
                {isBusy ? <Spinner className="size-3.5" /> : <Check className="size-3.5" />}
                Lưu thay đổi
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {isAdmin && template && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs"
                    disabled={isBusy}
                    onClick={() => void handleTogglePublish()}
                  >
                    <Globe className="size-3.5" />
                    {template.published ? 'Gỡ công khai' : 'Công khai vị trí'}
                  </Button>
                )}
                {template && !template.archivedAt && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                    disabled={isBusy}
                    onClick={() => void handleArchive()}
                  >
                    <Archive className="size-3.5" />
                    Lưu trữ
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Đóng
                </Button>
                {template && (
                  <Button
                    size="sm"
                    className="gap-2 bg-primary font-semibold"
                    onClick={handlePractice}
                  >
                    <Play className="size-3.5 fill-current" />
                    Bắt đầu phỏng vấn
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
