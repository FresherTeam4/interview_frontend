import { FileText, Info } from 'lucide-react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import CvDocumentList from '@/features/cv/components/cv-document-list'
import CvUploadDropzone from '@/features/cv/components/cv-upload-dropzone'
import { getErrorMessage } from '@/api/api-error'
import {
  useCvDocuments,
  useCvFileUrl,
  useDeleteCv,
  useRetryParseCv,
  useUploadCv,
} from '@/hooks/use-cv-documents'
import { CV_MAX_PER_USER, CV_STATUS } from '@/constants/cv'
import { profileDetailPath } from '@/constants/routes'

export default function CvPage() {
  const navigate = useNavigate()
  const cvQuery = useCvDocuments()
  const uploadCv = useUploadCv()
  const retryParse = useRetryParseCv()
  const deleteCv = useDeleteCv()
  const cvFileUrl = useCvFileUrl()

  const documents = cvQuery.data ?? []
  const reachedMax = documents.length >= CV_MAX_PER_USER
  // Ba thao tác dòng đều nhận cvId, nên chỉ cần biết dòng nào đang chờ để chặn bấm tiếp.
  const busyId =
    (cvFileUrl.isPending ? cvFileUrl.variables : null) ??
    (retryParse.isPending ? retryParse.variables : null) ??
    (deleteCv.isPending ? deleteCv.variables : null) ??
    null

  async function handleUpload(file: File) {
    try {
      const uploaded = await uploadCv.mutateAsync(file)

      // Trùng đúng bộ byte của một CV đã bóc tách xong → backend trả lại CV cũ (200) thay vì
      // xếp hàng bóc tách lại, nên không có gì để chờ.
      if (uploaded.status === CV_STATUS.PARSED && uploaded.profileId !== null) {
        const profileId = uploaded.profileId
        toast.success('CV này đã được bóc tách trước đó.', {
          action: {
            label: 'Xem hồ sơ',
            onClick: () => void navigate(profileDetailPath(profileId)),
          },
        })
        return
      }

      toast.success('Đã tải CV lên. Đang bóc tách, trạng thái sẽ tự cập nhật.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleView(cvId: number) {
    try {
      const { url } = await cvFileUrl.mutateAsync(cvId)
      const opened = window.open(url, '_blank', 'noopener,noreferrer')
      if (!opened) toast.error('Trình duyệt đã chặn cửa sổ mới. Cho phép pop-up rồi thử lại.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRetryParse(cvId: number) {
    try {
      await retryParse.mutateAsync(cvId)
      toast.success('Đã xếp hàng bóc tách lại.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleDelete(cvId: number) {
    try {
      await deleteCv.mutateAsync(cvId)
      toast.success('Đã xoá CV.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  function renderHistory() {
    if (cvQuery.isPending) {
      return <Skeleton className="h-28 w-full rounded-lg" />
    }

    if (cvQuery.isError) {
      return (
        <ErrorState
          message={getErrorMessage(cvQuery.error)}
          onRetry={() => void cvQuery.refetch()}
        />
      )
    }

    if (cvQuery.data.length === 0) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>Chưa có CV nào</EmptyTitle>
            <EmptyDescription>
              Tải lên CV đầu tiên để hệ thống bóc tách thành hồ sơ.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <CvDocumentList
        documents={cvQuery.data}
        busyId={busyId}
        onView={(cvId) => void handleView(cvId)}
        onRetryParse={(cvId) => void handleRetryParse(cvId)}
        onDelete={(cvId) => void handleDelete(cvId)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CV của tôi"
        description="Tải CV dạng PDF để hệ thống có nguyên liệu sinh câu hỏi riêng cho bạn."
        actions={
          <Badge variant="outline">
            {documents.length}/{CV_MAX_PER_USER} CV
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Tải CV lên</CardTitle>
          <CardDescription>
            Mỗi CV được bóc tách thành một hồ sơ riêng, bóc tách chạy nền nên bạn không cần chờ ở
            trang này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reachedMax ? (
            <Alert>
              <Info />
              <AlertTitle>Đã đạt tối đa {CV_MAX_PER_USER} CV</AlertTitle>
              <AlertDescription>Xoá một CV cũ ở danh sách dưới để tải bản mới.</AlertDescription>
            </Alert>
          ) : (
            <CvUploadDropzone
              onSelect={(file) => void handleUpload(file)}
              isUploading={uploadCv.isPending}
            />
          )}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Lịch sử tải lên</h2>
        {renderHistory()}
      </section>
    </div>
  )
}
