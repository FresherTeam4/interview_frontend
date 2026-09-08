import { useState } from 'react'
import {
  BadgeCheck,
  Briefcase,
  Globe,
  Lock,
  Play,
  TriangleAlert,
  Eye,
  MoreVertical,
  Archive,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDateTime } from '@/lib/format'
import { getInterviewTemplate } from '@/api/template'
import { useArchiveInterviewTemplate } from '@/hooks/use-interview-templates'
import { getErrorMessage } from '@/api/api-error'
import type { InterviewTemplateSummary } from '@/types/template'

interface RoleCardProps {
  role: InterviewTemplateSummary
  onViewDetail: (roleId: number) => void
  onPractice: (role: InterviewTemplateSummary) => void
  onArchive?: (role: InterviewTemplateSummary) => void
}

export default function RoleCard({ role, onViewDetail, onPractice, onArchive }: RoleCardProps) {
  const archiveMutation = useArchiveInterviewTemplate()
  const [isArchiving, setIsArchiving] = useState(false)

  async function handleQuickArchive() {
    const confirmed = window.confirm(`Bạn có chắc muốn lưu trữ vị trí "${role.title}"? Vị trí này sẽ được ẩn khỏi danh sách.`)
    if (!confirmed) return

    setIsArchiving(true)
    try {
      if (onArchive) {
        onArchive(role)
      } else {
        const full = await getInterviewTemplate(role.id)
        await archiveMutation.mutateAsync({
          id: role.id,
          expectedVersion: full.version,
        })
        toast.success(`Đã lưu trữ vị trí: ${role.title}`)
      }
    } catch (err) {
      toast.error('Lưu trữ vị trí thất bại: ' + getErrorMessage(err))
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-all border-border/80 group">
      <div className="p-4 space-y-2.5">
        {/* Top badges & action menu */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {role.published ? (
              <Badge variant="secondary" className="gap-1 text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200">
                <Globe className="size-3" />
                Công khai
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground">
                <Lock className="size-3" />
                Riêng tư
              </Badge>
            )}

            {role.targetSeniority && (
              <Badge variant="outline" className="text-[11px] font-semibold">
                {role.targetSeniority}
              </Badge>
            )}

            {role.confirmed ? (
              <Badge variant="outline" className="gap-1 text-[11px] text-success border-success/30">
                <BadgeCheck className="size-3" />
                Đã duyệt
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-[11px] text-amber-600 border-amber-300 bg-amber-50/50 dark:bg-amber-950/30">
                <TriangleAlert className="size-3" />
                Chờ duyệt
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                title="Thao tác khác"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 text-xs">
              <DropdownMenuItem onClick={() => onViewDetail(role.id)} className="gap-2 cursor-pointer">
                <Eye className="size-3.5" />
                Xem & sửa tiêu chí
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPractice(role)} className="gap-2 cursor-pointer">
                <Play className="size-3.5 fill-current" />
                Luyện tập vị trí này
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => void handleQuickArchive()}
                disabled={isArchiving}
                className="gap-2 text-destructive focus:text-destructive cursor-pointer"
              >
                <Archive className="size-3.5" />
                Lưu trữ vị trí
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Title & Job Title Subtitle */}
        <div>
          <h3 className="text-base font-bold text-foreground leading-snug truncate" title={role.title}>
            {role.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-1 gap-2">
            <span className="truncate flex items-center gap-1.5" title={role.jobTitle || 'Trích xuất từ JD'}>
              <Briefcase className="size-3 shrink-0 text-muted-foreground/70" />
              <span className="truncate">
                {role.jobTitle && role.title.trim().toLowerCase() !== role.jobTitle.trim().toLowerCase()
                  ? role.jobTitle
                  : 'Trích xuất từ JD'}
              </span>
            </span>
            <span className="shrink-0 text-[11px] text-muted-foreground/75">
              {formatDateTime(role.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer action buttons */}
      <div className="p-3 pt-2.5 px-4 border-t border-border/40 flex items-center justify-between gap-2 bg-muted/5">
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8"
          onClick={() => onViewDetail(role.id)}
        >
          <Eye className="size-3.5" />
          Xem tiêu chí
        </Button>

        <Button
          size="sm"
          className="gap-1.5 text-xs font-semibold h-8"
          onClick={() => onPractice(role)}
        >
          <Play className="size-3.5 fill-current" />
          Phỏng vấn
        </Button>
      </div>
    </Card>
  )
}
