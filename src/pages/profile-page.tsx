import { FileUp, UserRoundPen } from 'lucide-react'
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
import CvUploadDialog from '@/features/profile/components/cv-upload-dialog'
import { getErrorMessage } from '@/api/api-error'
import { useCandidateProfiles } from '@/hooks/use-candidate-profile'

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

    // Hồ sơ sinh ra từ một lần bóc tách CV hoặc khởi tạo
    if (profilesQuery.data.length === 0) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundPen />
            </EmptyMedia>
            <EmptyTitle>Chưa có hồ sơ ứng viên</EmptyTitle>
            <EmptyDescription>
              Tải CV định dạng PDF lên để AI tự động bóc tách kỹ năng, học vấn và tạo hồ sơ phỏng vấn cho bạn.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CvUploadDialog
              onSuccess={() => void profilesQuery.refetch()}
              trigger={
                <Button className="gap-2">
                  <FileUp className="size-4" />
                  Tải CV lên ngay
                </Button>
              }
            />
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
        description="Mỗi CV tạo ra một hồ sơ. Chọn hồ sơ để soát lại thông tin AI bóc tách và sẵn sàng cho buổi phỏng vấn."
        actions={
          <CvUploadDialog
            onSuccess={() => void profilesQuery.refetch()}
            trigger={
              <Button className="gap-2">
                <FileUp className="size-4" />
                Tải CV mới
              </Button>
            }
          />
        }
      />
      {renderContent()}
    </div>
  )
}
