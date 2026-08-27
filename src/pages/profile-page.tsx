import { FileUp, UserRoundPen } from 'lucide-react'
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
import ProfileSummaryCard from '@/features/profile/components/profile-summary-card'
import { getErrorMessage } from '@/api/api-error'
import { useCandidateProfiles } from '@/hooks/use-candidate-profile'
import { ROUTES } from '@/constants/routes'

export default function ProfilePage() {
  const profilesQuery = useCandidateProfiles()

  function renderContent() {
    if (profilesQuery.isPending) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      )
    }

    if (profilesQuery.isError) {
      return (
        <ErrorState
          message={getErrorMessage(profilesQuery.error)}
          onRetry={() => void profilesQuery.refetch()}
        />
      )
    }

    // Hồ sơ chỉ sinh ra từ một lần bóc tách CV — không nhập tay từ đầu được.
    if (profilesQuery.data.length === 0) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundPen />
            </EmptyMedia>
            <EmptyTitle>Chưa có hồ sơ</EmptyTitle>
            <EmptyDescription>
              Mỗi CV bóc tách xong sẽ tạo ra một hồ sơ ở đây. Hãy tải CV lên trước.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to={ROUTES.cv}>
                <FileUp className="size-4" />
                Tải CV lên
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      )
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {profilesQuery.data.map((profile) => (
          <ProfileSummaryCard key={profile.id} profile={profile} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hồ sơ ứng viên"
        description="Mỗi CV cho ra một hồ sơ. Chọn hồ sơ để soát lại thông tin AI bóc tách."
        actions={
          <Button variant="outline" asChild>
            <Link to={ROUTES.cv}>
              <FileUp className="size-4" />
              Tải CV mới
            </Link>
          </Button>
        }
      />
      {renderContent()}
    </div>
  )
}
