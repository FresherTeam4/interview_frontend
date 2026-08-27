import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import ProfileForm from '@/features/profile/components/profile-form'
import { getErrorMessage } from '@/api/api-error'
import { useCandidateProfile } from '@/hooks/use-candidate-profile'
import { ROUTES } from '@/constants/routes'

export default function ProfileDetailPage() {
  const { profileId } = useParams()
  const parsedId = Number(profileId)
  const profileQuery = useCandidateProfile(parsedId)

  function renderContent() {
    if (!Number.isInteger(parsedId)) {
      return <ErrorState title="Hồ sơ không tồn tại" message="Đường dẫn hồ sơ không hợp lệ." />
    }

    if (profileQuery.isPending) {
      return (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      )
    }

    if (profileQuery.isError) {
      return (
        <ErrorState
          message={getErrorMessage(profileQuery.error)}
          onRetry={() => void profileQuery.refetch()}
        />
      )
    }

    // key = id: đổi hồ sơ thì form phải nhận defaultValues mới, không giữ state của hồ sơ cũ.
    return <ProfileForm key={profileQuery.data.id} profile={profileQuery.data} />
  }

  const profile = profileQuery.data

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={profile?.headline ?? 'Hồ sơ ứng viên'}
        description={
          profile?.cvOriginalFilename
            ? `Bóc tách từ CV ${profile.cvOriginalFilename}`
            : 'Sửa lại thông tin AI bóc tách sai để buổi phỏng vấn không hỏi về thứ bạn chưa từng làm.'
        }
        actions={
          <Button variant="outline" asChild>
            <Link to={ROUTES.profile}>
              <ArrowLeft className="size-4" />
              Danh sách hồ sơ
            </Link>
          </Button>
        }
      />
      {renderContent()}
    </div>
  )
}
