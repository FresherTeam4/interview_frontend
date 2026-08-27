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
import { profileDetailPath, ROUTES } from '@/constants/routes'
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

  const documents = cvQuery.data ?? []
  const profiles = profilesQuery.data ?? []
  const latestCv = findLatestCv(documents)
  const parsingCount = documents.filter(isCvInProgress).length
  const confirmedProfile = profiles.find((profile) => profile.confirmedAt !== null) ?? null
  const isPending = cvQuery.isPending || profilesQuery.isPending
  const error = cvQuery.error ?? profilesQuery.error

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
          <CardDescription>Xong ba bước này là có thể bắt đầu phỏng vấn.</CardDescription>
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
              ? 'Đã có hồ sơ được xác nhận. Chức năng phỏng vấn sẽ mở trong bản cập nhật tới.'
              : 'Hoàn thành ba bước chuẩn bị ở trên để mở khoá buổi phỏng vấn.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-fit" disabled>
            <Sparkles className="size-4" />
            Bắt đầu phỏng vấn (sắp có)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
