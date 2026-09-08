import { useState } from 'react'
import { FileUp, FileText, UserRoundPen, AlertCircle } from 'lucide-react'
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
  const isLimitReached = cvCount >= 10

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
              Tải CV định dạng PDF lên để AI tự động trích xuất kỹ năng, học vấn và tạo hồ sơ phỏng vấn cho bạn.
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
          <span>Bấm nút xoá để giải phóng dung lượng tải lên</span>
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
          <CvUploadDialog
            onSuccess={handleRefetchAll}
            trigger={
              <Button className="gap-2">
                <FileUp className="size-4" />
                Tải CV mới
              </Button>
            }
          />
        }
      />

      {isLimitReached && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-300/80 bg-amber-50/80 p-3.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <strong>Đã đạt hạn mức 10/10 CV:</strong> Bạn đã lưu tối đa 10 tệp CV trên hệ thống. Hãy chuyển sang tab{' '}
            <button
              type="button"
              onClick={() => setActiveTab('cvs')}
              className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100"
            >
              "Tệp CV đã tải ({cvCount}/10)"
            </button>{' '}
            để xoá bớt các tệp trùng hoặc bị lỗi trước khi tải thêm CV mới.
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-3">
          <TabsList>
            <TabsTrigger value="profiles" className="gap-2">
              <UserRoundPen className="size-4" />
              Hồ sơ ứng viên
              {profilesQuery.data && profilesQuery.data.length > 0 && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {profilesQuery.data.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="cvs" className="gap-2">
              <FileText className="size-4" />
              Tệp CV đã tải
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isLimitReached
                    ? 'bg-destructive/15 text-destructive'
                    : 'bg-muted-foreground/15 text-muted-foreground'
                }`}
              >
                {cvCount}/10
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profiles" className="pt-4">
          {renderProfilesContent()}
        </TabsContent>

        <TabsContent value="cvs" className="pt-4">
          {renderCvsContent()}
        </TabsContent>
      </Tabs>
    </div>
  )
}
