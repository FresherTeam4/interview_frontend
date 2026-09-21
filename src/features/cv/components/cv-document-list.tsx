import { Eye, FileText, RotateCcw, Trash2, TriangleAlert, UserRoundPen } from 'lucide-react'
import { Link } from 'react-router'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CvStatusBadge from '@/features/cv/components/cv-status-badge'
import { CV_STATUS } from '@/constants/cv'
import { profileDetailPath } from '@/constants/routes'
import { formatDateTime, formatFileSize } from '@/lib/format'
import type { CvDocument } from '@/types/cv'

interface CvDocumentListProps {
  documents: CvDocument[]
  /** CV đang chờ một request chạy xong — chặn bấm tiếp trên đúng dòng đó. */
  busyId: number | null
  onView: (cvId: number) => void
  onRetryParse: (cvId: number) => void
  onDelete: (cvId: number) => void
}

export default function CvDocumentList({
  documents,
  busyId,
  onView,
  onRetryParse,
  onDelete,
}: CvDocumentListProps) {
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {documents.map((cv) => {
        // Trích xuất chạy nền: đang PARSING thì backend chặn cả /parse lẫn DELETE (409).
        const isParsing = cv.status === CV_STATUS.PARSING
        const isBusy = busyId === cv.id
        const canRetry = cv.status === CV_STATUS.FAILED

        return (
          <li key={cv.id} className="flex flex-wrap items-center gap-3 p-4">
            <FileText className="size-5 shrink-0 text-muted-foreground" />

            <div className="min-w-48 flex-1 space-y-1">
              <p className="truncate text-sm font-medium">{cv.originalFilename}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(cv.fileSizeBytes)} · Tải lên {formatDateTime(cv.uploadedAt)}
                {cv.parsedAt ? ` · Trích xuất ${formatDateTime(cv.parsedAt)}` : ''}
              </p>
              {canRetry && cv.statusMessage ? (
                <p className="flex items-center gap-1.5 text-xs text-destructive">
                  <TriangleAlert className="size-3.5 shrink-0" />
                  {cv.statusMessage}
                </p>
              ) : null}
              {cv.profileId === null ? null : (
                <Link
                  to={profileDetailPath(cv.profileId)}
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <UserRoundPen className="size-3.5 shrink-0" />
                  {cv.profileHeadline ?? 'Hồ sơ từ CV này'}
                  {cv.profileConfirmed ? null : <Badge variant="outline">Chưa xác nhận</Badge>}
                </Link>
              )}
            </div>

            <div className="flex items-center gap-2">
              <CvStatusBadge status={cv.status} />

              <Button
                variant="outline"
                size="icon"
                aria-label={`Xem file ${cv.originalFilename}`}
                disabled={isBusy}
                onClick={() => onView(cv.id)}
              >
                <Eye className="size-4" />
              </Button>

              {canRetry ? (
                <Button size="sm" disabled={isBusy} onClick={() => onRetryParse(cv.id)}>
                  <RotateCcw className="size-4" />
                  Trích xuất lại
                </Button>
              ) : null}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label={`Xoá ${cv.originalFilename}`}
                    disabled={isBusy || isParsing}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Xoá CV này?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {cv.originalFilename} và hồ sơ được trích xuất từ nó sẽ không còn hiện ra nữa.
                      Thao tác này không hoàn lại được.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Giữ lại</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={() => onDelete(cv.id)}>
                      Xoá CV
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
