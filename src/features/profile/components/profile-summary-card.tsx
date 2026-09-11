import { BadgeCheck, FileText, PencilLine, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { profileDetailPath } from '@/constants/routes'
import { formatDateTime } from '@/lib/format'
import CvPreviewPanel from '@/features/profile/components/cv-preview-panel'
import type { ProfileSummary } from '@/types/profile'

interface ProfileSummaryCardProps {
  profile: ProfileSummary
}

/** Một dòng của `GET /api/profiles`; bấm vào là sang trang sửa hồ sơ đó. */
export default function ProfileSummaryCard({ profile }: ProfileSummaryCardProps) {
  const position = [profile.targetPosition, profile.seniorityLevel].filter(Boolean).join(' · ')

  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-all border-border/80 group py-0 gap-0">
      <div className="p-3.5 space-y-2">
        {/* Header: Title & Confirmation Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-0.5">
            <h3
              className="font-semibold text-base text-foreground leading-snug truncate"
              title={profile.headline ?? 'Hồ sơ chưa có tiêu đề'}
            >
              {profile.headline ?? 'Hồ sơ chưa có tiêu đề'}
            </h3>
            <div
              className="flex items-center gap-1.5 text-xs text-muted-foreground truncate"
              title={profile.cvOriginalFilename ? `Từ CV ${profile.cvOriginalFilename}` : 'Nhập tay'}
            >
              <FileText className="size-3 shrink-0 text-muted-foreground/70" />
              <span className="truncate">
                {profile.cvOriginalFilename ? `Từ CV ${profile.cvOriginalFilename}` : 'Nhập tay'}
              </span>
            </div>
          </div>

          <div className="shrink-0 pt-0.5">
            {profile.confirmedAt ? (
              <Badge
                variant="outline"
                className="gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5 shrink-0"
              >
                <BadgeCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                Đã xác nhận
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5 shrink-0"
              >
                <TriangleAlert className="size-3 text-amber-600 dark:text-amber-400" />
                Chưa xác nhận
              </Badge>
            )}
          </div>
        </div>

        {/* Content: Position & Summary stats */}
        <div className="space-y-0.5 pt-0.5 text-xs">
          {position ? (
            <p className="font-medium text-foreground truncate">{position}</p>
          ) : null}
          <p className="text-muted-foreground truncate">
            {profile.educationCount} học vấn · {profile.skillCount} kỹ năng ·{' '}
            {profile.projectCount} dự án
          </p>
        </div>
      </div>

      {/* Footer: Action buttons & Timestamp */}
      <div className="p-2.5 px-3.5 border-t border-border/40 bg-muted/5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" asChild className="gap-1.5 text-xs h-8 shadow-xs">
            <Link to={profileDetailPath(profile.id)}>
              <PencilLine className="size-3.5" />
              <span>Xem và sửa</span>
            </Link>
          </Button>
          {profile.cvDocumentId && (
            <CvPreviewPanel
              cvDocumentId={profile.cvDocumentId}
              filename={profile.cvOriginalFilename ?? 'CV gốc'}
              className="gap-1.5 text-xs h-8"
            />
          )}
        </div>
        <span className="text-[11px] text-muted-foreground/75 shrink-0 ml-auto sm:ml-0">
          Cập nhật {formatDateTime(profile.updatedAt)}
        </span>
      </div>
    </Card>
  )
}
