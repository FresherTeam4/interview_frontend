import { FileQuestion, RefreshCw } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ProfileEditor from '@/features/cv-profile/components/profile-editor'
import { useProfile } from '@/hooks/use-profile'
import { ROUTES } from '@/constants/routes'

interface ProfileLoadErrorProps {
  title: string
  description: string
  onRetry?: () => void
}

function ProfileLoadError({ title, description, onRetry }: ProfileLoadErrorProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-xl border p-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
        <FileQuestion className="size-5" />
      </div>
      <div>
        <h1 className="font-heading text-lg font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw />
            Thử lại
          </Button>
        )}
        <Button size="sm" asChild>
          <Link to={ROUTES.cvs}>Về CV &amp; hồ sơ của tôi</Link>
        </Button>
      </div>
    </div>
  )
}

export default function ProfileDetailPage() {
  const { profileId: profileIdParam } = useParams()
  const profileId = Number(profileIdParam)
  const validProfileId = Number.isInteger(profileId) && profileId > 0 ? profileId : null
  const profileQuery = useProfile(validProfileId)

  if (validProfileId === null) {
    return (
      <ProfileLoadError
        title="Đường dẫn hồ sơ không hợp lệ"
        description="Vui lòng mở hồ sơ từ danh sách CV của bạn."
      />
    )
  }

  if (profileQuery.isPending) {
    return (
      <div className="ml-[calc(50%-min(50vw-1rem,55rem))] flex w-[min(100vw-2rem,110rem)] flex-col gap-4 lg:h-[calc(100dvh-8rem)]">
        <Skeleton className="h-8 max-w-xs rounded-lg" />
        <div className="grid items-start gap-5 lg:min-h-0 lg:flex-1 lg:items-stretch lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Skeleton className="hidden h-full rounded-xl lg:block" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-52 rounded-xl" />
            <Skeleton className="h-52 rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ProfileLoadError
        title="Không thể tải hồ sơ"
        description="Hồ sơ không tồn tại, đã bị xóa hoặc kết nối đang gián đoạn."
        onRetry={() => void profileQuery.refetch()}
      />
    )
  }

  return <ProfileEditor key={profileQuery.data.id} profile={profileQuery.data} />
}
