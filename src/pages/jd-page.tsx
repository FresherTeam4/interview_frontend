import { useState } from 'react'
import { Link } from 'react-router'
import { Briefcase, Plus } from 'lucide-react'
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
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import JdSummaryCard from '@/features/jd/components/jd-summary-card'
import { getErrorMessage } from '@/api/api-error'
import { useDeleteJd, useJobDescriptions } from '@/hooks/use-job-descriptions'
import { ROUTES } from '@/constants/routes'

export default function JdPage() {
  const [page, setPage] = useState(0)
  const pageSize = 10
  const jdQuery = useJobDescriptions(page, pageSize)
  const deleteJd = useDeleteJd()

  const data = jdQuery.data
  const items = data?.items ?? []

  async function handleDelete(id: number) {
    try {
      await deleteJd.mutateAsync(id)
      toast.success('Đã xoá JD.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  function renderContent() {
    if (jdQuery.isPending) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
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

    if (items.length === 0 && page === 0) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Briefcase />
            </EmptyMedia>
            <EmptyTitle>Chưa có mô tả công việc nào</EmptyTitle>
            <EmptyDescription>
              Tạo JD để hệ thống sinh câu hỏi phỏng vấn phù hợp với vị trí bạn ứng tuyển.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link to={ROUTES.jdCreate}>
                <Plus className="size-4" />
                Tạo JD mới
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      )
    }

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((jd) => (
            <JdSummaryCard
              key={jd.id}
              jd={jd}
              onDelete={(id) => void handleDelete(id)}
              isBusy={deleteJd.isPending}
            />
          ))}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Trang trước
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Trang sau
            </Button>
          </div>
        ) : null}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mô tả công việc"
        description="Tạo JD cho vị trí bạn muốn phỏng vấn thử. Xác nhận JD để mở khoá phỏng vấn."
        actions={
          <Button asChild>
            <Link to={ROUTES.jdCreate}>
              <Plus className="size-4" />
              Tạo JD mới
            </Link>
          </Button>
        }
      />
      {renderContent()}
    </div>
  )
}
