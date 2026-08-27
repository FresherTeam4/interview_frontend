import { useState } from 'react'
import { ArrowLeft, FilePenLine, RefreshCw, TriangleAlert, UsersRound } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import OpenCvPdfButton from '@/features/cv-profile/components/open-cv-pdf-button'
import ProfileConfirmBadge from '@/features/cv-profile/components/profile-confirm-badge'
import { formatDateTime } from '@/features/cv-profile/lib/formatters'
import { useProfiles } from '@/hooks/use-profile'
import { ROUTES } from '@/constants/routes'
import type { ProfileSummary } from '@/types/cv-profile'

type ProfileFilter = 'ALL' | 'CONFIRMED' | 'DRAFT'

const filterLabels: Record<ProfileFilter, string> = {
  ALL: 'Tất cả',
  CONFIRMED: 'Đã xác nhận',
  DRAFT: 'Chờ xác nhận',
}

function matchesFilter(profile: ProfileSummary, filter: ProfileFilter): boolean {
  if (filter === 'ALL') return true
  if (filter === 'CONFIRMED') return profile.confirmedAt !== null
  return profile.confirmedAt === null
}

export default function ProfileListPage() {
  const profilesQuery = useProfiles()
  const [filter, setFilter] = useState<ProfileFilter>('ALL')
  const profiles = profilesQuery.data ?? []
  const confirmedCount = profiles.filter((profile) => profile.confirmedAt !== null).length
  const stats: Record<ProfileFilter, number> = {
    ALL: profiles.length,
    CONFIRMED: confirmedCount,
    DRAFT: profiles.length - confirmedCount,
  }
  const visibleProfiles = profiles.filter((profile) => matchesFilter(profile, filter))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2 self-start">
          <Link to={ROUTES.cvs}>
            <ArrowLeft />
            CV &amp; hồ sơ của tôi
          </Link>
        </Button>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Hồ sơ ứng viên
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Chỉ hồ sơ đã xác nhận mới đủ điều kiện dùng cho phiên phỏng vấn.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="h-6 px-2">
              {profiles.length} hồ sơ
            </Badge>
            <Badge variant="outline" className="h-6 px-2">
              {confirmedCount} đã xác nhận
            </Badge>
          </div>
        </div>
      </header>

      {profiles.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
            {(Object.keys(filterLabels) as ProfileFilter[]).map((key) => (
              <Button
                key={key}
                type="button"
                size="xs"
                variant={filter === key ? 'secondary' : 'ghost'}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
              >
                {filterLabels[key]}
                <span className="tabular-nums text-muted-foreground">{stats[key]}</span>
              </Button>
            ))}
          </div>
          {profilesQuery.isFetching && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RefreshCw className="size-3 animate-spin" />
              Đang cập nhật
            </span>
          )}
        </div>
      )}

      {profilesQuery.isPending && (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-36 rounded-xl" />
          ))}
        </div>
      )}

      {profilesQuery.isError && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center">
          <TriangleAlert className="size-4 shrink-0" />
          <div className="flex-1">
            <p className="font-medium">Không thể tải danh sách hồ sơ</p>
            <p className="text-destructive/90">
              Kết nối đang gián đoạn. Vui lòng thử lại sau ít phút.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void profilesQuery.refetch()}>
            <RefreshCw />
            Thử lại
          </Button>
        </div>
      )}

      {!profilesQuery.isPending && !profilesQuery.isError && profiles.length === 0 && (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UsersRound />
            </EmptyMedia>
            <EmptyTitle>Chưa có hồ sơ nào</EmptyTitle>
            <EmptyDescription>
              Hồ sơ sẽ xuất hiện sau khi AI bóc tách thành công một CV.
            </EmptyDescription>
          </EmptyHeader>
          <Button asChild>
            <Link to={ROUTES.cvs}>Tải CV lên</Link>
          </Button>
        </Empty>
      )}

      {profiles.length > 0 && visibleProfiles.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Không có hồ sơ nào ở trạng thái “{filterLabels[filter]}”.
        </p>
      )}

      {visibleProfiles.length > 0 && (
        <ul className="flex flex-col gap-3">
          {visibleProfiles.map((profile) => (
            <li
              key={profile.id}
              className="rounded-xl border bg-card text-card-foreground shadow-xs transition-colors hover:border-foreground/20"
            >
              <div className="flex flex-col gap-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <h2 className="min-w-0 truncate font-medium">
                    {profile.headline || 'Hồ sơ chưa có tiêu đề'}
                  </h2>
                  <ProfileConfirmBadge confirmed={profile.confirmedAt !== null} />
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-muted-foreground">
                  <span className="min-w-0 truncate">{profile.cvOriginalFilename}</span>
                  <span aria-hidden>·</span>
                  <span>{profile.source === 'USER_EDITED' ? 'Đã chỉnh sửa' : 'Do AI bóc tách'}</span>
                  <span aria-hidden>·</span>
                  <span>Cập nhật {formatDateTime(profile.updatedAt)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {profile.targetPosition && (
                    <Badge variant="secondary" className="h-6 px-2">
                      {profile.targetPosition}
                    </Badge>
                  )}
                  {profile.seniorityLevel && (
                    <Badge variant="outline" className="h-6 px-2">
                      {profile.seniorityLevel}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {profile.educationCount} học vấn · {profile.skillCount} kỹ năng ·{' '}
                    {profile.projectCount} dự án
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:px-5">
                <Button size="sm" asChild>
                  <Link to={ROUTES.profileDetail(profile.id)}>
                    <FilePenLine />
                    Xem và chỉnh sửa
                  </Link>
                </Button>
                <OpenCvPdfButton cvId={profile.cvDocumentId} label="Mở PDF" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
