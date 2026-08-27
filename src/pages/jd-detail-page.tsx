import { ArrowLeft, ExternalLink } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import JdForm from '@/features/jd/components/jd-form'
import { getErrorMessage } from '@/api/api-error'
import { useJdFileUrl, useJobDescription } from '@/hooks/use-job-descriptions'
import { ROUTES } from '@/constants/routes'

export default function JdDetailPage() {
  const { jobDescriptionId } = useParams()
  const parsedId = Number(jobDescriptionId)
  const jdQuery = useJobDescription(parsedId)
  const jdFileUrl = useJdFileUrl()

  async function handleViewFile() {
    try {
      const { url } = await jdFileUrl.mutateAsync(parsedId)
      const opened = window.open(url, '_blank', 'noopener,noreferrer')
      if (!opened) toast.error('Trình duyệt đã chặn cửa sổ mới. Cho phép pop-up rồi thử lại.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  function renderContent() {
    if (!Number.isInteger(parsedId)) {
      return <ErrorState title="JD không tồn tại" message="Đường dẫn JD không hợp lệ." />
    }

    if (jdQuery.isPending) {
      return (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )
    }

    if (jdQuery.isError) {
      return (
        <ErrorState
          message={getErrorMessage(jdQuery.error)}
          onRetry={() => void jdQuery.refetch()}
        />
      )
    }

    return <JdForm key={jdQuery.data.id} jd={jdQuery.data} />
  }

  const jd = jdQuery.data
  const hasFile = jd?.sourceType === 'FILE' && jd.originalFilename

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={jd?.title ?? 'Mô tả công việc'}
        description={
          jd?.originalFilename
            ? `Trích xuất từ file ${jd.originalFilename}`
            : 'Xem và chỉnh sửa nội dung mô tả công việc.'
        }
        actions={
          <div className="flex items-center gap-2">
            {hasFile ? (
              <Button
                variant="outline"
                onClick={() => void handleViewFile()}
                disabled={jdFileUrl.isPending}
              >
                <ExternalLink className="size-4" />
                Xem file gốc
              </Button>
            ) : null}
            <Button variant="outline" asChild>
              <Link to={ROUTES.jd}>
                <ArrowLeft className="size-4" />
                Danh sách JD
              </Link>
            </Button>
          </div>
        }
      />
      {renderContent()}
    </div>
  )
}
