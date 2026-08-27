import { FileText, FileWarning, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import OpenCvPdfButton from '@/features/cv-profile/components/open-cv-pdf-button'
import { useCvFile } from '@/hooks/use-cv-file'
import { cn } from '@/lib/utils'

interface CvPdfViewerProps {
  cvId: number
  filename: string
  enabled?: boolean
  className?: string
}

/**
 * Tham số của trình xem PDF đặt sau dấu "#" nên không nằm trong phần được ký của URL presigned:
 * ẩn cột thumbnail (chiếm gần nửa khung khi đối chiếu) và mở sẵn ở chế độ vừa chiều ngang.
 */
function toViewerSrc(url: string): string {
  return `${url}#navpanes=0&pagemode=none&scrollbar=1&toolbar=1&view=FitH`
}

export default function CvPdfViewer({
  cvId,
  filename,
  enabled = true,
  className,
}: CvPdfViewerProps) {
  const fileQuery = useCvFile(cvId, enabled)

  return (
    <div
      className={cn(
        'flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium" title={filename}>
          {filename}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => void fileQuery.refetch()}
          disabled={fileQuery.isFetching}
          aria-label="Làm mới đường dẫn PDF"
          title="Làm mới PDF"
        >
          <RefreshCw className={fileQuery.isFetching ? 'animate-spin' : undefined} />
        </Button>
        <OpenCvPdfButton cvId={cvId} label="Tab mới" variant="outline" size="sm" />
      </div>

      <div className="min-h-0 flex-1 bg-muted/30">
        {fileQuery.isPending && <Skeleton className="size-full rounded-none" />}

        {!fileQuery.isPending && (fileQuery.isError || !fileQuery.data) && (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <FileWarning className="size-5" />
            </div>
            <div>
              <p className="font-medium">Không thể mở CV</p>
              <p className="mt-1 text-sm text-muted-foreground">
                File tạm thời chưa tải được. Hãy lấy lại đường dẫn mới và thử lại.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void fileQuery.refetch()}>
              <RefreshCw />
              Thử lại
            </Button>
          </div>
        )}

        {fileQuery.data && (
          <iframe
            src={toViewerSrc(fileQuery.data.url)}
            title={`CV ${filename}`}
            className="size-full border-0"
          />
        )}
      </div>
    </div>
  )
}
