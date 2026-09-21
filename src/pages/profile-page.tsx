import { useState } from 'react'
import { FileUp, FileText, UserRoundPen, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import ProfileSummaryCard from '@/features/profile/components/profile-summary-card'
import CvUploadDialog from '@/features/profile/components/cv-upload-dialog'
import CreateManualProfileDialog from '@/features/profile/components/create-manual-profile-dialog'
import CvDocumentList from '@/features/cv/components/cv-document-list'
import { getErrorMessage } from '@/api/api-error'
import { useCandidateProfiles } from '@/hooks/use-candidate-profile'
import {
  useCvDocuments,
  useDeleteCv,
  useRetryParseCv,
  useCvFileUrl,
} from '@/hooks/use-cv-documents'

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<string>('profiles')
  const [busyCvId, setBusyCvId] = useState<number | null>(null)

  const profilesQuery = useCandidateProfiles()
  const cvsQuery = useCvDocuments()

  const deleteCvMutation = useDeleteCv()
  const retryParseMutation = useRetryParseCv()
  const cvFileUrlMutation = useCvFileUrl()

  const cvCount = cvsQuery.data?.length ?? 0

  async function handleViewCv(cvId: number) {
    setBusyCvId(cvId)
    try {
      const res = await cvFileUrlMutation.mutateAsync(cvId)
      if (res?.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error('Không tìm thấy liên kết xem file CV.')
      }
    } catch (err) {
      toast.error('Không thể mở CV: ' + getErrorMessage(err))
    } finally {
      setBusyCvId(null)
    }
  }

  async function handleRetryParse(cvId: number) {
    setBusyCvId(cvId)
    try {
      await retryParseMutation.mutateAsync(cvId)
      toast.success('Đã gửi yêu cầu trích xuất lại CV.')
    } catch (err) {
      toast.error('Trích xuất lại thất bại: ' + getErrorMessage(err))
    } finally {
      setBusyCvId(null)
    }
  }

  async function handleDeleteCv(cvId: number) {
    setBusyCvId(cvId)
    try {
      await deleteCvMutation.mutateAsync(cvId)
      toast.success('Đã xoá CV thành công. Hạn mức lưu trữ đã được giải phóng.')
    } catch (err) {
      toast.error('Xoá CV thất bại: ' + getErrorMessage(err))
    } finally {
      setBusyCvId(null)
    }
  }

  function handleRefetchAll() {
    void profilesQuery.refetch()
    void cvsQuery.refetch()
  }

  function renderProfilesContent() {
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

    if (profilesQuery.data.length === 0) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserRoundPen />
            </EmptyMedia>
            <EmptyTitle>Chưa có hồ sơ ứng viên</EmptyTitle>
            <EmptyDescription>
              Tải CV định dạng PDF lên để AI tự động trích xuất, hoặc tự tạo hồ sơ thủ công.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <CvUploadDialog
                onSuccess={handleRefetchAll}
                trigger={
                  <Button className="gap-2">
                    <FileUp className="size-4" />
                    Tải CV lên ngay
                  </Button>
                }
              />
              <CreateManualProfileDialog onSuccess={handleRefetchAll} />
            </div>
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

  function renderCvsContent() {
    if (cvsQuery.isPending) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      )
    }

    if (cvsQuery.isError) {
      return (
        <ErrorState
          message={getErrorMessage(cvsQuery.error)}
          onRetry={() => void cvsQuery.refetch()}
        />
      )
    }

    if (cvsQuery.data.length === 0) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>Chưa có tệp CV nào</EmptyTitle>
            <EmptyDescription>
              Tải lên tệp PDF để lưu trữ và trích xuất dữ liệu ứng viên tự động. Mỗi tài khoản có thể lưu tối đa 10 tệp CV.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CvUploadDialog
              onSuccess={handleRefetchAll}
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
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground px-1">
          <span>
            Đang lưu <strong className="text-foreground">{cvCount}/10</strong> tệp CV trong hệ thống
          </span>
        </div>
        <CvDocumentList
          documents={cvsQuery.data}
          busyId={busyCvId}
          onView={handleViewCv}
          onRetryParse={handleRetryParse}
          onDelete={handleDeleteCv}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hồ sơ ứng viên"
        actions={
          <div className="flex items-center gap-2">
            <CreateManualProfileDialog
              onSuccess={handleRefetchAll}
              trigger={
                <Button variant="outline" className="gap-2">
                  <UserPlus className="size-4" />
                  Tạo thủ công
                </Button>
              }
            />
            <CvUploadDialog
              onSuccess={handleRefetchAll}
              trigger={
                <Button className="gap-2">
                  <FileUp className="size-4" />
                  Tải CV mới
                </Button>
              }
            />
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profiles" className="gap-2">
            <UserRoundPen className="size-4" />
            Hồ sơ năng lực
            {profilesQuery.data && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {profilesQuery.data.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cvs" className="gap-2">
            <FileText className="size-4" />
            Tệp CV đã tải lên
            <span className="ml-1 rounded-full bg-muted-foreground/15 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
              {cvCount}/10
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          {renderProfilesContent()}
        </TabsContent>

        <TabsContent value="cvs">
          {renderCvsContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
