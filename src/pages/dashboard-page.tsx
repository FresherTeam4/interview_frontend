import { Circle, CircleCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import CvStatusBadge from '@/features/cv/components/cv-status-badge'
import { getErrorMessage } from '@/api/api-error'
import { useAuth } from '@/hooks/use-auth'
import { useCandidateProfiles } from '@/hooks/use-candidate-profile'
import { isCvInProgress, useCvDocuments } from '@/hooks/use-cv-documents'
import { useSessions } from '@/hooks/use-interview-session'
import { useJobDescriptions } from '@/hooks/use-job-descriptions'
import { JD_MAX_PAGE_SIZE } from '@/constants/jd'
import { profileDetailPath, ROUTES, sessionDetailPath } from '@/constants/routes'
import { SESSION_STATUS_LABEL } from '@/constants/session'
import type { CvDocument } from '@/types/cv'

interface ReadinessStep {
  title: string
  description: string
  done: boolean
  to: string
  actionLabel: string
}

function findLatestCv(documents: CvDocument[]): CvDocument | null {
  return documents.reduce<CvDocument | null>(
    (latest, cv) => (latest === null || cv.uploadedAt > latest.uploadedAt ? cv : latest),
    null,
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const cvQuery = useCvDocuments()
  const profilesQuery = useCandidateProfiles()
  const jdQuery = useJobDescriptions(0, JD_MAX_PAGE_SIZE)
  const activeSessionsQuery = useSessions('ACTIVE', 0, 5)

  const documents = cvQuery.data ?? []
  const profiles = profilesQuery.data ?? []
  const jdItems = jdQuery.data?.items ?? []
  const activeSessions = activeSessionsQuery.data?.items ?? []
  const totalActiveCount = activeSessionsQuery.data?.totalElements ?? activeSessions.length
  const latestCv = findLatestCv(documents)
  const parsingCount = documents.filter(isCvInProgress).length
  const confirmedProfile = profiles.find((profile) => profile.confirmedAt !== null) ?? null
  const readyJd = jdItems.find((jd) => jd.status === 'READY') ?? null
  const isPending = cvQuery.isPending || profilesQuery.isPending || jdQuery.isPending
  const error = cvQuery.error ?? profilesQuery.error ?? jdQuery.error

  const steps: ReadinessStep[] = [
    {
      title: 'Tải CV lên',
      description: latestCv
        ? `CV mới nhất: ${latestCv.originalFilename}`
        : 'Cần một CV dạng PDF để hệ thống có nguyên liệu sinh câu hỏi.',
      done: latestCv !== null,
      to: ROUTES.cv,
      actionLabel: 'Tải CV',
    },
    {
      title: 'Chờ AI bóc tách thành hồ sơ',
      description:
        parsingCount > 0
          ? `Đang bóc tách ${parsingCount} CV — trạng thái tự cập nhật ở trang CV.`
          : 'Bóc tách chạy nền ngay sau khi tải lên: học vấn, kỹ năng, dự án.',
      done: profiles.length > 0,
      to: ROUTES.cv,
      actionLabel: 'Xem tiến trình',
    },
    {
      title: 'Xác nhận thông tin đã đúng',
      description: 'Sửa chỗ AI bóc tách sai, rồi xác nhận để mở khoá buổi phỏng vấn.',
      done: confirmedProfile !== null,
      to: profiles[0] ? profileDetailPath(profiles[0].id) : ROUTES.profile,
      actionLabel: 'Kiểm tra hồ sơ',
    },
    {
      title: 'Tạo mô tả công việc (JD)',
      description: readyJd
        ? `JD đã sẵn sàng: ${readyJd.title}`
        : 'Nhập hoặc tải JD để hệ thống sinh câu hỏi phù hợp với vị trí ứng tuyển.',
      done: readyJd !== null,
      to: ROUTES.jdCreate,
      actionLabel: 'Tạo JD',
    },
  ]

  const isReady = steps.every((step) => step.done)

  function renderSteps() {
    if (isPending) {
      return <Skeleton className="h-32 w-full rounded-lg" />
    }

    if (error) {
      return (
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => {
            void cvQuery.refetch()
            void profilesQuery.refetch()
            void jdQuery.refetch()
          }}
        />
      )
    }

    return (
      <ol className="flex flex-col gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-start gap-3">
            {step.done ? (
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-success" />
            ) : (
              <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="min-w-40 flex-1 space-y-0.5">
              <p className="text-sm font-medium">
                Bước {index + 1}: {step.title}
              </p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {step.done ? null : (
              <Button variant="outline" size="sm" asChild>
                <Link to={step.to}>{step.actionLabel}</Link>
              </Button>
            )}
          </li>
        ))}
      </ol>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Xin chào, ${user?.fullName ?? 'bạn'}`}
        description="Phỏng vấn thử với câu hỏi sinh riêng từ CV của bạn."
      />

      <Card>
        <CardHeader>
          <CardTitle>Chuẩn bị hồ sơ</CardTitle>
          <CardDescription>Xong bốn bước này là có thể bắt đầu phỏng vấn.</CardDescription>
          {latestCv ? (
            <CardAction>
              <CvStatusBadge status={latestCv.status} />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>{renderSteps()}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Buổi phỏng vấn thử</CardTitle>
          <CardDescription>
            {isReady
              ? 'Mọi thứ đã sẵn sàng! Bấm nút bên dưới để tạo phiên phỏng vấn.'
              : 'Hoàn thành bốn bước chuẩn bị ở trên để mở khoá buổi phỏng vấn.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isReady ? (
            <Button className="w-fit" asChild>
              <Link to={ROUTES.sessionCreate}>
                <Sparkles className="size-4" />
                Bắt đầu phỏng vấn
              </Link>
            </Button>
          ) : (
            <Button className="w-fit" disabled>
              <Sparkles className="size-4" />
              Bắt đầu phỏng vấn
            </Button>
          )}

          {/* Active Sessions */}
          {activeSessions.length > 0 ? (
            <div className="pt-3 border-t mt-2 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Phiên phỏng vấn gần đây ({totalActiveCount})
                </p>
                <Button variant="ghost" size="sm" asChild className="text-xs h-7">
                  <Link to={ROUTES.sessionList}>Xem tất cả</Link>
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {activeSessions.slice(0, 3).map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3 text-sm transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{session.jobDescriptionTitle}</span>
                        <span className="text-xs text-muted-foreground">#{session.id}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {SESSION_STATUS_LABEL[session.status]} •{' '}
                        {session.status === 'READY'
                          ? `${session.totalQuestionCount} câu hỏi sẵn sàng`
                          : `${session.answeredQuestionCount}/${session.totalQuestionCount} câu đã trả lời`}
                      </p>
                    </div>
                    <Button size="sm" asChild className="gap-1 text-xs shrink-0">
                      <Link to={sessionDetailPath(session.id)}>
                        {session.status === 'READY' ? 'Bắt đầu' : 'Tiếp tục'} →
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
              {totalActiveCount > 3 ? (
                <Button variant="outline" size="sm" asChild className="w-full text-xs mt-1">
                  <Link to={ROUTES.sessionList}>
                    Xem thêm {totalActiveCount - 3} phiên đang diễn ra khác →
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

