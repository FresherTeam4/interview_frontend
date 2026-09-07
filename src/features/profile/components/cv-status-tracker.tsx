import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, FileSearch, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { getCvDocument, retryParseCv } from '@/api/cv'
import { getErrorMessage } from '@/api/api-error'
import type { CvDocument } from '@/types/cv'

interface CvStatusTrackerProps {
  cvId: number
  onParsed: (profileId: number) => void
  onCancel?: () => void
}

export default function CvStatusTracker({ cvId, onParsed, onCancel }: CvStatusTrackerProps) {
  const [cv, setCv] = useState<CvDocument | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null
    let active = true

    async function poll() {
      try {
        const doc = await getCvDocument(cvId)
        if (!active) return

        setCv(doc)

        if (doc.status === 'PARSED' && doc.profileId) {
          toast.success('Bóc tách CV thành công!')
          onParsed(doc.profileId)
          return
        }

        if (doc.status === 'FAILED') {
          setErrorMessage(doc.statusMessage || 'Quá trình bóc tách CV gặp sự cố.')
          return
        }

        // Còn đang UPLOADED hoặc PARSING thì tiếp tục poll
        timer = setTimeout(() => {
          void poll()
        }, 1500)
      } catch (err) {
        if (!active) return
        setErrorMessage(getErrorMessage(err))
      }
    }

    void poll()

    return () => {
      active = false
      if (timer) clearTimeout(timer)
    }
  }, [cvId, onParsed])

  async function handleRetry() {
    setIsRetrying(true)
    setErrorMessage(null)
    try {
      const doc = await retryParseCv(cvId)
      setCv(doc)
      toast.info('Đang thử bóc tách lại...')
    } catch (err) {
      setErrorMessage(getErrorMessage(err))
      toast.error('Không thể thử lại: ' + getErrorMessage(err))
    } finally {
      setIsRetrying(false)
    }
  }

  const isParsing = cv?.status === 'PARSING' || cv?.status === 'UPLOADED' || !cv
  const isFailed = cv?.status === 'FAILED'
  const isParsed = cv?.status === 'PARSED'

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="relative">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {isFailed ? (
              <AlertCircle className="size-7 text-destructive" />
            ) : isParsed ? (
              <CheckCircle2 className="size-7 text-success" />
            ) : (
              <FileSearch className="size-7 animate-pulse" />
            )}
          </div>
          {isParsing && (
            <div className="absolute -inset-1 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
        </div>

        <h3 className="font-semibold text-lg">
          {isFailed
            ? 'Bóc tách CV thất bại'
            : isParsed
              ? 'Hoàn tất bóc tách CV!'
              : 'AI đang phân tích hồ sơ CV của bạn…'}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm">
          {cv?.originalFilename && (
            <span className="font-medium text-foreground block mb-1">
              File: {cv.originalFilename}
            </span>
          )}
          {isFailed
            ? errorMessage
            : 'Hệ thống đang trích xuất học vấn, kinh nghiệm làm việc và các kỹ năng chuyên môn.'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-4">
        <div className="flex items-center gap-3 text-sm">
          <CheckCircle2 className="size-5 text-success shrink-0" />
          <span className="font-medium">1. Tải file PDF lên hệ thống</span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {isParsing ? (
            <Spinner className="size-5 text-primary shrink-0" />
          ) : isFailed ? (
            <AlertCircle className="size-5 text-destructive shrink-0" />
          ) : (
            <CheckCircle2 className="size-5 text-success shrink-0" />
          )}
          <span className={isParsing ? 'font-semibold text-primary' : undefined}>
            2. Trích xuất thông tin bằng AI
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {isParsed ? (
            <CheckCircle2 className="size-5 text-success shrink-0" />
          ) : (
            <FileSearch className="size-5 text-muted-foreground shrink-0" />
          )}
          <span className={isParsed ? 'font-semibold text-success' : 'text-muted-foreground'}>
            3. Tạo hồ sơ ứng viên chuẩn hóa
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {isFailed && (
          <Button
            type="button"
            variant="default"
            disabled={isRetrying}
            onClick={() => void handleRetry()}
          >
            {isRetrying ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />}
            Thử phân tích lại
          </Button>
        )}
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {isParsed ? 'Đóng' : 'Hủy'}
          </Button>
        )}
      </div>
    </div>
  )
}
