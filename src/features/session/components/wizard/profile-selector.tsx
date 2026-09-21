import { Check, FileUp, UserRoundPen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CvUploadDialog from '@/features/profile/components/cv-upload-dialog'
import { cn } from '@/lib/utils'
import type { ProfileSummary } from '@/types/profile'

interface ProfileSelectorProps {
  profiles: ProfileSummary[]
  selectedProfileId?: number
  onSelect: (profileId: number) => void
  onRefreshProfiles: () => void
}

export default function ProfileSelector({
  profiles,
  selectedProfileId,
  onSelect,
  onRefreshProfiles,
}: ProfileSelectorProps) {
  if (profiles.length === 0) {
    return (
      <div className="border border-dashed border-input rounded-xl p-6 text-center space-y-3 bg-muted/20">
        <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
          <UserRoundPen className="size-5" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Chưa có hồ sơ ứng viên</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tải CV để bắt đầu phỏng vấn.
          </p>
        </div>
        <CvUploadDialog
          onSuccess={onRefreshProfiles}
          trigger={
            <Button size="sm" className="gap-2">
              <FileUp className="size-4" />
              Tải CV lên ngay
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground">
          Chọn hồ sơ ứng viên của bạn ({profiles.length})
        </label>
        <CvUploadDialog
          onSuccess={onRefreshProfiles}
          trigger={
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary h-7">
              <FileUp className="size-3.5" />
              Tải thêm CV khác
            </Button>
          }
        />
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {profiles.map((p) => {
          const isSelected = selectedProfileId === p.id
          const subtitle = [p.targetPosition, p.seniorityLevel].filter(Boolean).join(' · ')

          return (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                'cursor-pointer rounded-xl border p-3 text-left transition-all relative overflow-hidden space-y-1',
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                  : 'border-border/80 bg-card hover:border-primary/40',
              )}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                  <Check className="size-3 stroke-[2.5]" />
                </div>
              )}
              <div className="font-semibold text-sm text-foreground truncate pr-6">
                {p.headline || 'Hồ sơ ứng viên'}
              </div>
              {subtitle ? (
                <div className="text-xs text-muted-foreground truncate pr-6">{subtitle}</div>
              ) : null}
              <div className="text-[11px] text-muted-foreground/80 pt-0.5">
                {p.skillCount} kỹ năng · {p.projectCount} dự án
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
