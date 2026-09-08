import { useState } from 'react'
import { ArrowLeft, Compass, PencilLine } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import ProfileForm from '@/features/profile/components/profile-form'
import ProfileHighlights from '@/features/profile/components/profile-highlights'
import CvPreviewPanel from '@/features/profile/components/cv-preview-panel'
import { getErrorMessage } from '@/api/api-error'
import { useCandidateProfile } from '@/hooks/use-candidate-profile'
import { ROUTES } from '@/constants/routes'

export default function ProfileDetailPage() {
  const { profileId } = useParams()
  const parsedId = Number(profileId)
  const profileQuery = useCandidateProfile(parsedId)
  const [activeTab, setActiveTab] = useState<'highlights' | 'edit'>('highlights')

  const profile = profileQuery.data

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

    if (!profile) return null

    return (
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'highlights' | 'edit')}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="highlights" className="gap-2 text-xs font-medium">
            <Compass className="size-3.5 text-primary" />
            <span>Điểm nhấn & Trọng tâm</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="gap-2 text-xs font-medium">
            <PencilLine className="size-3.5" />
            <span>Soát lại & Chỉnh sửa</span>
          </TabsTrigger>
        </TabsList>

        <div className="pt-4">
          <TabsContent value="highlights" className="m-0 focus-visible:outline-none">
            <ProfileHighlights
              profile={profile}
              onEditClick={() => setActiveTab('edit')}
            />
          </TabsContent>

          <TabsContent value="edit" className="m-0 focus-visible:outline-none">
            {/* key = id: đổi hồ sơ thì form phải nhận defaultValues mới */}
            <ProfileForm key={profile.id} profile={profile} />
          </TabsContent>
        </div>
      </Tabs>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={profile?.headline ?? 'Hồ sơ ứng viên'}
        description={
          profile?.cvOriginalFilename
            ? `Trích xuất từ ${profile.cvOriginalFilename}`
            : undefined
        }
        actions={
          <div className="flex items-center gap-2">
            {profile?.cvDocumentId && (
              <CvPreviewPanel
                cvDocumentId={profile.cvDocumentId}
                filename={profile.cvOriginalFilename ?? 'CV gốc'}
              />
            )}
            <Button variant="outline" asChild>
              <Link to={ROUTES.profile}>
                <ArrowLeft className="size-4" />
                Danh sách hồ sơ
              </Link>
            </Button>
          </div>
        }
      />
      {renderContent()}
    </div>
  )
}

