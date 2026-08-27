import { ArrowLeft, Briefcase, FileUp } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import SessionSetupForm from '@/features/session/components/session-setup-form'
import { getErrorMessage } from '@/api/api-error'
import { useCandidateProfiles } from '@/hooks/use-candidate-profile'
import { useJobDescriptions } from '@/hooks/use-job-descriptions'
import { JD_MAX_PAGE_SIZE } from '@/constants/jd'
import { ROUTES } from '@/constants/routes'

export default function SessionCreatePage() {
  const profilesQuery = useCandidateProfiles()
  const jdQuery = useJobDescriptions(0, JD_MAX_PAGE_SIZE)

  const isPending = profilesQuery.isPending || jdQuery.isPending
  const error = profilesQuery.error ?? jdQuery.error

  const confirmedProfiles = (profilesQuery.data ?? []).filter((p) => p.confirmedAt !== null)
  const readyJds = (jdQuery.data?.items ?? []).filter((j) => j.status === 'READY')

  const canCreate = confirmedProfiles.length > 0 && readyJds.length > 0

  function renderContent() {
    if (isPending) {
      return <Skeleton className="h-64 w-full rounded-xl" />
    }

    if (error) {
      return (
        <ErrorState
          message={getErrorMessage(error)}
          onRetry={() => {
            void profilesQuery.refetch()
            void jdQuery.refetch()
          }}
        />
      )
    }

    if (!canCreate) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Briefcase />
            </EmptyMedia>
            <EmptyTitle>Chưa đủ điều kiện</EmptyTitle>
            <EmptyDescription>
              {confirmedProfiles.length === 0
                ? 'Bạn cần xác nhận ít nhất một hồ sơ ứng viên.'
                : 'Bạn cần tạo và xác nhận ít nhất một mô tả công việc (JD).'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {confirmedProfiles.length === 0 ? (
              <Button asChild>
                <Link to={ROUTES.cv}>
                  <FileUp className="size-4" />
                  Tải CV lên
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to={ROUTES.jdCreate}>
                  <Briefcase className="size-4" />
                  Tạo JD mới
                </Link>
              </Button>
            )}
          </EmptyContent>
        </Empty>
      )
    }

    return (
      <SessionSetupForm
        confirmedProfiles={confirmedProfiles}
        readyJds={readyJds}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <PageHeader
        title="Tạo phiên phỏng vấn"
        description="Chọn hồ sơ và JD để hệ thống sinh câu hỏi phỏng vấn riêng cho bạn."
        actions={
          <Button variant="outline" asChild>
            <Link to={ROUTES.home}>
              <ArrowLeft className="size-4" />
              Tổng quan
            </Link>
          </Button>
        }
      />
      {renderContent()}
    </div>
  )
}
