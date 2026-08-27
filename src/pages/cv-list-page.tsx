import { useState } from 'react'
import { FileText, RefreshCw, TriangleAlert, UsersRound } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import CvListItem from '@/features/cv-profile/components/cv-list-item'
import CvUploadPanel from '@/features/cv-profile/components/cv-upload-panel'
import GuideTourButton from '@/features/cv-profile/components/guide-tour-button'
import { isCvProcessing } from '@/features/cv-profile/lib/cv-status'
import { CV_LIST_TOUR_ID, cvListTourSteps } from '@/features/cv-profile/lib/tour'
import { useCvs } from '@/hooks/use-cvs'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import type { CvStatus } from '@/types/cv-profile'

const MAX_CV_COUNT = 10

type CvFilter = 'ALL' | 'PROCESSING' | 'PARSED' | 'FAILED'

const filterLabels: Record<CvFilter, string> = {
  ALL: 'Tất cả',
  PROCESSING: 'Đang xử lý',
  PARSED: 'Thành công',
  FAILED: 'Thất bại',
}

function matchesFilter(status: CvStatus, filter: CvFilter): boolean {
  if (filter === 'ALL') return true
  if (filter === 'PROCESSING') return isCvProcessing(status)
  return status === filter
}

export default function CvListPage() {
  const cvsQuery = useCvs()
  const [filter, setFilter] = useState<CvFilter>('ALL')
  const cvs = cvsQuery.data ?? []

  // Danh sách tối đa 10 CV nên đếm trực tiếp mỗi lần render, không cần memo hóa.
  const stats = {
    ALL: cvs.length,
    PROCESSING: cvs.filter((cv) => isCvProcessing(cv.status)).length,
    PARSED: cvs.filter((cv) => cv.status === 'PARSED').length,
    FAILED: cvs.filter((cv) => cv.status === 'FAILED').length,
    confirmed: cvs.filter((cv) => cv.profileConfirmed).length,
  }
  const visibleCvs = cvs.filter((cv) => matchesFilter(cv.status, filter))
  const quotaPercent = Math.min(100, Math.round((cvs.length / MAX_CV_COUNT) * 100))

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            CV &amp; hồ sơ của tôi
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Tải CV lên để AI bóc tách thông tin, sau đó kiểm tra và xác nhận hồ sơ trước khi dùng cho
            phỏng vấn.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <GuideTourButton
            data-tour="cv-guide"
            tourId={CV_LIST_TOUR_ID}
            steps={cvListTourSteps}
            autoStartWhenReady={!cvsQuery.isPending}
            variant="outline"
            size="icon"
          />
          <Button variant="outline" asChild data-tour="cv-profiles-link">
            <Link to={ROUTES.profiles}>
              <UsersRound />
              Danh sách hồ sơ
            </Link>
          </Button>
        </div>
      </header>

      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Tổng quan CV"
        data-tour="cv-stats"
      >
        <div className="rounded-xl border bg-card p-4 text-card-foreground shadow-xs">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Dung lượng đã dùng
          </p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">
            {cvs.length}
            <span className="text-base font-normal text-muted-foreground">/{MAX_CV_COUNT} CV</span>
          </p>
          <div
            className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label="Số CV đã dùng"
            aria-valuemin={0}
            aria-valuemax={MAX_CV_COUNT}
            aria-valuenow={cvs.length}
          >
            <div
              className={cn(
                'h-full rounded-full transition-[width]',
                cvs.length >= MAX_CV_COUNT ? 'bg-destructive' : 'bg-primary',
              )}
              style={{ width: `${quotaPercent}%` }}
            />
          </div>
        </div>

        {(
          [
            { label: 'Đang xử lý', value: stats.PROCESSING },
            { label: 'Hồ sơ sẵn sàng', value: stats.PARSED },
            { label: 'Đã xác nhận', value: stats.confirmed },
          ] as const
        ).map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border bg-card p-4 text-card-foreground shadow-xs"
          >
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {tile.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{tile.value}</p>
          </div>
        ))}
      </section>

      <div data-tour="cv-upload">
        <CvUploadPanel cvCount={cvs.length} />
      </div>

      <section aria-labelledby="cv-list-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="cv-list-heading" className="font-heading text-lg font-semibold">
              CV đã tải lên
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">CV mới nhất được hiển thị trước.</p>
          </div>
          <div className="flex items-center gap-2">
            {cvsQuery.isFetching && !cvsQuery.isPending && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="size-3 animate-spin" />
                Đang cập nhật
              </span>
            )}
            {cvs.length > 0 && (
              <div className="flex flex-wrap gap-1 rounded-lg border bg-card p-1">
                {(Object.keys(filterLabels) as CvFilter[]).map((key) => (
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
            )}
          </div>
        </div>

        {cvsQuery.isPending && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-40 rounded-xl" />
            ))}
          </div>
        )}

        {cvsQuery.isError && (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center">
            <TriangleAlert className="size-4 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Không thể tải danh sách CV</p>
              <p className="text-destructive/90">
                Kết nối đang gián đoạn. Dữ liệu của bạn không bị thay đổi.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void cvsQuery.refetch()}>
              <RefreshCw />
              Thử lại
            </Button>
          </div>
        )}

        {!cvsQuery.isPending && !cvsQuery.isError && cvs.length === 0 && (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText />
              </EmptyMedia>
              <EmptyTitle>Chưa có CV nào</EmptyTitle>
              <EmptyDescription>
                Tải CV đầu tiên ở khu vực phía trên để bắt đầu tạo hồ sơ ứng viên.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {cvs.length > 0 && visibleCvs.length === 0 && (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Không có CV nào ở trạng thái “{filterLabels[filter]}”.
          </p>
        )}

        {visibleCvs.length > 0 && (
          <ul className="flex flex-col gap-3" data-tour="cv-list">
            {visibleCvs.map((cv) => (
              <CvListItem key={cv.id} initialCv={cv} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
