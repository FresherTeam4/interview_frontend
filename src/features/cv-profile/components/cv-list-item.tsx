import { useEffect, useState } from 'react'
import { FilePenLine, FileText, RefreshCw, Sparkles, Trash2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import CvStatusBadge from '@/features/cv-profile/components/cv-status-badge'
import OpenCvPdfButton from '@/features/cv-profile/components/open-cv-pdf-button'
import ProfileConfirmBadge from '@/features/cv-profile/components/profile-confirm-badge'
import { canDeleteCv, canRetryCvParse, isCvProcessing } from '@/features/cv-profile/lib/cv-status'
import { formatDateTime, formatFileSize } from '@/features/cv-profile/lib/formatters'
import { useCvProcessing } from '@/hooks/use-cv-processing'
import { useDeleteCv, useRetryCvParse } from '@/hooks/use-cvs'
import { isApiError } from '@/api/api-error'
import { ROUTES } from '@/constants/routes'
import type { CvDocument } from '@/types/cv-profile'

const SLOW_PARSE_HINT_MS = 60_000

/**
 * Chỉ mount khi CV đang được xử lý, nên bộ đếm "lâu hơn dự kiến" tự reset
 * mỗi khi CV bắt đầu một lượt bóc tách mới mà không cần đồng bộ state.
 */
function ParseProgressHint() {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsSlow(true), SLOW_PARSE_HINT_MS)
    return () => window.clearTimeout(timeoutId)
  }, [])

  return (
    <p className="mt-2 text-xs text-muted-foreground">
      {isSlow
        ? 'Đang mất nhiều thời gian hơn dự kiến. Bạn có thể tải lại trạng thái hoặc chờ thêm.'
        : 'Thường mất khoảng 10–25 giây. Trạng thái tự cập nhật mỗi 2 giây.'}
    </p>
  )
}

interface CvListItemProps {
  initialCv: CvDocument
}

export default function CvListItem({ initialCv }: CvListItemProps) {
  const processingQuery = useCvProcessing(isCvProcessing(initialCv.status) ? initialCv.id : null)
  const retryMutation = useRetryCvParse()
  const deleteMutation = useDeleteCv()
  const cv = processingQuery.data ?? initialCv
  const isProcessing = isCvProcessing(cv.status)

  function handleRetry() {
    retryMutation.mutate(cv.id, {
      onSuccess: () => toast.success('Đã đưa CV vào hàng đợi bóc tách lại.'),
      onError: (error) => {
        toast.error(isApiError(error) ? error.message : 'Không thể bóc tách lại CV.')
      },
    })
  }

  function handleDelete() {
    deleteMutation.mutate(cv, {
      onSuccess: () => toast.success('Đã xóa CV.'),
      onError: (error) => {
        toast.error(isApiError(error) ? error.message : 'Không thể xóa CV.')
      },
    })
  }

  return (
    <li className="rounded-xl border bg-card text-card-foreground shadow-xs transition-colors hover:border-foreground/20">
      <div className="flex items-start gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <FileText className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h3 className="min-w-0 truncate font-medium" title={cv.originalFilename}>
              {cv.originalFilename}
            </h3>
            <CvStatusBadge status={cv.status} />
            {cv.status === 'PARSED' && <ProfileConfirmBadge confirmed={cv.profileConfirmed} />}
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span className="tabular-nums">{formatFileSize(cv.fileSizeBytes)}</span>
            <span aria-hidden>·</span>
            <span>Tải lên {formatDateTime(cv.uploadedAt)}</span>
            {cv.parsedAt && (
              <>
                <span aria-hidden>·</span>
                <span>Bóc tách {formatDateTime(cv.parsedAt)}</span>
              </>
            )}
          </p>

          {cv.profileHeadline && (
            <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Hồ sơ AI: </span>
              <span className="font-medium">{cv.profileHeadline}</span>
            </p>
          )}

          {isProcessing && (
            <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="size-4 animate-pulse" />
                {cv.status === 'UPLOADED'
                  ? 'CV đang chờ đến lượt xử lý'
                  : 'AI đang đọc CV và tạo hồ sơ'}
              </p>
              <div
                className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-primary/15"
                role="progressbar"
                aria-label="Tiến độ bóc tách của AI"
              >
                <div className="h-full w-full animate-pulse rounded-full bg-primary/60" />
              </div>
              <ParseProgressHint />
              {processingQuery.isError && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Tạm thời chưa lấy được trạng thái mới. Hệ thống sẽ tự thử lại.
                </p>
              )}
            </div>
          )}

          {cv.status === 'FAILED' && (
            <div className="mt-3 flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <p>{cv.statusMessage ?? 'AI chưa thể bóc tách CV này. Bạn có thể thử lại.'}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t px-4 py-3 sm:px-5">
        {cv.status === 'PARSED' && cv.profileId !== null && (
          <Button size="sm" asChild>
            <Link to={ROUTES.profileDetail(cv.profileId)}>
              <FilePenLine />
              {cv.profileConfirmed ? 'Xem hồ sơ' : 'Kiểm tra hồ sơ'}
            </Link>
          </Button>
        )}

        <OpenCvPdfButton cvId={cv.id} label="Mở PDF" />

        {canRetryCvParse(cv.status) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={retryMutation.isPending}
          >
            <RefreshCw className={retryMutation.isPending ? 'animate-spin' : undefined} />
            Bóc tách lại
          </Button>
        )}

        {isProcessing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void processingQuery.refetch()}
            disabled={processingQuery.isFetching}
          >
            <RefreshCw className={processingQuery.isFetching ? 'animate-spin' : undefined} />
            Tải lại trạng thái
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-muted-foreground hover:text-destructive"
              disabled={!canDeleteCv(cv.status) || deleteMutation.isPending}
              title={canDeleteCv(cv.status) ? undefined : 'Không thể xóa khi AI đang bóc tách'}
            >
              <Trash2 />
              Xóa
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa CV này?</AlertDialogTitle>
              <AlertDialogDescription>
                CV “{cv.originalFilename}” và hồ sơ liên quan sẽ không còn xuất hiện trong tài khoản
                của bạn.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Giữ lại</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete}>
                Xóa CV
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </li>
  )
}
