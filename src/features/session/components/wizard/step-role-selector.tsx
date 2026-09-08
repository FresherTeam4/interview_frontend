import { useState } from 'react'
import {
  BadgeCheck,
  Briefcase,
  Check,
  Globe,
  Lock,
  Plus,
  Search,
  Sparkles,
  TriangleAlert,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import CreateRoleDialog from '@/features/template/components/create-role-dialog'
import { useInterviewTemplates } from '@/hooks/use-interview-templates'
import { getInterviewTemplate } from '@/api/template'
import { getErrorMessage } from '@/api/api-error'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { InterviewTemplate, InterviewTemplateSummary } from '@/types/template'

interface StepRoleSelectorProps {
  selectedTemplate: InterviewTemplate | null
  onTemplateSelected: (template: InterviewTemplate) => void
  onNext: (template?: InterviewTemplate) => void
}

export default function StepRoleSelector({
  selectedTemplate,
  onTemplateSelected,
  onNext,
}: StepRoleSelectorProps) {
  const [activeTab, setActiveTab] = useState<'mine' | 'public'>('mine')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const mineQuery = useInterviewTemplates('mine', 0, 50)
  const publicQuery = useInterviewTemplates('public', 0, 50)

  const currentList = activeTab === 'mine' ? mineQuery.data?.content : publicQuery.data?.content
  const isPending = activeTab === 'mine' ? mineQuery.isPending : publicQuery.isPending

  const filteredList = (currentList || []).filter((role) => {
    if (role.archivedAt) return false
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      role.title?.toLowerCase().includes(q) ||
      role.jobTitle?.toLowerCase().includes(q) ||
      role.targetSeniority?.toLowerCase().includes(q)
    )
  })

  async function handleSelectRole(role: InterviewTemplateSummary) {
    setIsLoadingDetails(true)
    try {
      const fullTemplate = await getInterviewTemplate(role.id)
      onTemplateSelected(fullTemplate)
    } catch (err) {
      toast.error('Không thể tải chi tiết vị trí: ' + getErrorMessage(err))
    } finally {
      setIsLoadingDetails(false)
    }
  }

  async function handleRoleCreated(newTemplateId: number) {
    try {
      const fullTemplate = await getInterviewTemplate(newTemplateId)
      onTemplateSelected(fullTemplate)
      toast.success(`Đã chọn vị trí: ${fullTemplate.title}`)
      onNext(fullTemplate)
    } catch {
      // Ignored
    }
  }

  function renderList() {
    if (isPending) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      )
    }

    if (filteredList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl text-center space-y-3 bg-muted/10">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <Briefcase className="size-6" />
          </div>
          <div>
            <h4 className="font-semibold text-sm">
              {searchQuery ? 'Không tìm thấy vị trí phù hợp' : 'Chưa có vị trí phỏng vấn nào'}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {activeTab === 'mine'
                ? 'Tải lên mô tả công việc (JD) để AI trích xuất và tạo vị trí tuyển dụng cho bạn.'
                : 'Chưa có vị trí phỏng vấn nào được công khai trong hệ thống.'}
            </p>
          </div>
          {activeTab === 'mine' && (
            <CreateRoleDialog
              onSuccess={(id) => void handleRoleCreated(id)}
              trigger={
                <Button size="sm" className="gap-2">
                  <Plus className="size-4" />
                  Tạo vị trí mới từ JD
                </Button>
              }
            />
          )}
        </div>
      )
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2 max-h-[380px] overflow-y-auto pr-1">
        {filteredList.map((role) => {
          const isSelected = selectedTemplate?.id === role.id
          return (
            <div
              key={role.id}
              onClick={() => void handleSelectRole(role)}
              className={cn(
                'relative flex flex-col justify-between p-4 rounded-xl border text-left cursor-pointer transition-all',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                  : 'border-border/80 hover:border-border hover:bg-muted/30 bg-card',
              )}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                  <Check className="size-3 stroke-[3]" />
                </div>
              )}

              <div className="space-y-1.5 pr-6">
                <div className="flex flex-wrap items-center gap-1.5">
                  {role.published ? (
                    <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                      <Globe className="size-2.5" />
                      Công khai
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 text-muted-foreground">
                      <Lock className="size-2.5" />
                      Riêng tư
                    </Badge>
                  )}
                  {role.targetSeniority && (
                    <Badge variant="outline" className="text-[10px] font-semibold px-1.5 py-0">
                      {role.targetSeniority}
                    </Badge>
                  )}
                  {role.confirmed ? (
                    <span className="text-[11px] text-success font-medium flex items-center gap-0.5">
                      <BadgeCheck className="size-3" /> Đã duyệt
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 font-medium flex items-center gap-0.5">
                      <TriangleAlert className="size-3" /> Chờ duyệt
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-foreground truncate" title={role.title}>
                  {role.title}
                </h4>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <Briefcase className="size-3 shrink-0" />
                  <span>
                    {role.jobTitle
                      ? role.title.trim().toLowerCase() !== role.jobTitle.trim().toLowerCase()
                        ? `Chức danh JD: ${role.jobTitle}`
                        : `Chức danh: ${role.jobTitle}`
                      : 'Trích xuất từ JD'}
                  </span>
                </p>
              </div>

              <div className="text-[11px] text-muted-foreground pt-3 mt-2 border-t border-border/40">
                Cập nhật {formatDateTime(role.updatedAt)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Chọn vị trí phỏng vấn
          </h3>
          <p className="text-xs text-muted-foreground">
            Chọn vị trí tuyển dụng bạn muốn phỏng vấn thử sức.
          </p>
        </div>

        <CreateRoleDialog
          onSuccess={(id) => void handleRoleCreated(id)}
          trigger={
            <Button size="sm" variant="outline" className="gap-1.5 self-start text-xs">
              <Sparkles className="size-3.5 text-primary" />
              Tạo vị trí mới từ JD
            </Button>
          }
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'mine' | 'public')} className="w-full sm:w-auto">
          <TabsList className="h-9">
            <TabsTrigger value="mine" className="text-xs gap-1.5">
              <Lock className="size-3" />
              Vị trí của tôi
              {mineQuery.data?.content && (
                <span className="ml-1 text-[10px] font-semibold opacity-70">
                  ({mineQuery.data.content.filter((r) => !r.archivedAt).length})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="public" className="text-xs gap-1.5">
              <Globe className="size-3" />
              Vị trí công khai
              {publicQuery.data?.content && (
                <span className="ml-1 text-[10px] font-semibold opacity-70">
                  ({publicQuery.data.content.filter((r) => !r.archivedAt).length})
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên vị trí hoặc cấp bậc..."
            className="pl-8 text-xs h-9"
          />
        </div>
      </div>

      <div className="pt-1">{renderList()}</div>

      {/* Footer next button */}
      <div className="flex items-center justify-between pt-4 border-t border-border/80">
        <div className="text-xs text-muted-foreground">
          {selectedTemplate ? (
            <span>
              Đã chọn: <strong className="text-foreground">{selectedTemplate.title}</strong>
            </span>
          ) : (
            <span>Vui lòng nhấp chọn 1 vị trí để tiếp tục</span>
          )}
        </div>

        <Button
          disabled={!selectedTemplate || isLoadingDetails}
          onClick={() => onNext(selectedTemplate ?? undefined)}
          className="gap-2"
        >
          {selectedTemplate?.confirmed ? 'Tiếp tục chọn hồ sơ' : 'Tiếp tục'}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
