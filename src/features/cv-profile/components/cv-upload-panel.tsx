import { useRef, useState } from 'react'
import {
  CircleAlert,
  CloudUpload,
  FileCheck2,
  FilePenLine,
  FileText,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import CvStatusBadge from '@/features/cv-profile/components/cv-status-badge'
import { isCvProcessing } from '@/features/cv-profile/lib/cv-status'
import { useCvProcessing } from '@/hooks/use-cv-processing'
import { useUploadCv } from '@/hooks/use-cvs'
import { isApiError } from '@/api/api-error'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_CV_COUNT = 10

const uploadErrorMessages: Record<string, string> = {
  CV_FILE_REQUIRED: 'Vui lòng chọn một file PDF.',
  CV_INVALID_FILE_TYPE: 'Chỉ chấp nhận file PDF hợp lệ.',
  CV_FILE_TOO_LARGE: 'File vượt quá giới hạn 5 MB.',
  CV_FILE_CORRUPTED: 'PDF bị hỏng, được mã hóa hoặc không thể đọc.',
  CV_TOO_MANY_PAGES: 'CV vượt quá giới hạn 10 trang.',
  CV_LIMIT_REACHED: 'Bạn đã đạt giới hạn 10 CV đang hoạt động.',
  STORAGE_UNAVAILABLE: 'Kho lưu trữ đang tạm thời gián đoạn. Vui lòng thử lại.',
}

const fileRules = ['Định dạng PDF', 'Tối đa 5 MB', 'Tối đa 10 trang']

function validateFile(file: File): string | null {
  if (!file.name.toLocaleLowerCase().endsWith('.pdf')) return 'Vui lòng chọn đúng file PDF.'
  if (file.type && file.type !== 'application/pdf') return 'Định dạng file không phải PDF.'
  if (file.size <= 0) return 'File đang trống.'
  if (file.size > MAX_FILE_SIZE) return 'File vượt quá giới hạn 5 MB.'
  return null
}

interface CvUploadPanelProps {
  cvCount: number
}

export default function CvUploadPanel({ cvCount }: CvUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const uploadMutation = useUploadCv()
  const [isDragging, setIsDragging] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [trackedCvId, setTrackedCvId] = useState<number | null>(null)
  const trackedQuery = useCvProcessing(trackedCvId)
  const limitReached = cvCount >= MAX_CV_COUNT
  const trackedCv = trackedQuery.data
  const isUploading = uploadMutation.isPending

  function submitFile(file: File) {
    if (limitReached) {
      setValidationError('Bạn đã đạt giới hạn 10 CV. Hãy xóa một CV trước khi tải file mới.')
      return
    }

    const errorMessage = validateFile(file)
    if (errorMessage) {
      setValidationError(errorMessage)
      return
    }

    setValidationError(null)
    setUploadPercent(0)
    setTrackedCvId(null)
    uploadMutation.mutate(
      { file, onProgress: setUploadPercent },
      {
        onSuccess: (cv) => {
          setUploadPercent(100)
          setTrackedCvId(cv.id)
          if (isCvProcessing(cv.status)) {
            toast.success('Đã tải CV lên. AI đang bắt đầu bóc tách thông tin.')
          } else if (cv.status === 'PARSED') {
            toast.success('CV này đã được xử lý trước đó và sẵn sàng để kiểm tra.')
          } else {
            toast.error(cv.statusMessage ?? 'AI chưa thể bóc tách CV này.')
          }
        },
        onError: (error) => {
          const message = isApiError(error)
            ? (uploadErrorMessages[error.code] ?? error.message)
            : 'Không thể tải CV lên. Vui lòng thử lại.'
          setValidationError(message)
          toast.error(message)
        },
      },
    )
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    if (files.length !== 1) {
      setValidationError('Mỗi lần chỉ có thể tải lên một file PDF.')
      return
    }
    submitFile(files[0])
  }

  return (
    <section className="rounded-2xl border bg-card p-4 text-card-foreground shadow-xs sm:p-5">
      <div
        className={cn(
          'flex flex-col items-center gap-4 rounded-xl border border-dashed px-5 py-8 text-center transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/25',
          limitReached && 'opacity-60',
        )}
        onDragEnter={(event) => {
          event.preventDefault()
          if (!limitReached) setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          event.preventDefault()
          if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          handleFiles(event.dataTransfer.files)
        }}
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CloudUpload className="size-6" />
        </div>

        <div className="space-y-1">
          <h2 className="font-heading text-base font-semibold">Tải CV để AI tạo hồ sơ ứng viên</h2>
          <p className="text-sm text-muted-foreground">
            Kéo thả file PDF vào đây hoặc chọn từ thiết bị của bạn
          </p>
        </div>

        <input
          ref={inputRef}
          id="cv-file"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={limitReached || isUploading}
          onChange={(event) => {
            handleFiles(event.target.files)
            event.target.value = ''
          }}
        />
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={limitReached || isUploading}
        >
          {isUploading ? <Loader2 className="animate-spin" /> : <FileText />}
          {isUploading ? 'Đang tải lên' : 'Chọn file PDF'}
        </Button>

        <ul className="flex flex-wrap items-center justify-center gap-2">
          {fileRules.map((rule) => (
            <li
              key={rule}
              className="rounded-full border bg-background px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {rule}
            </li>
          ))}
        </ul>
      </div>

      {limitReached && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          Bạn đã đạt giới hạn {MAX_CV_COUNT} CV đang hoạt động. Hãy xóa một CV cũ trước khi tải file
          mới.
        </p>
      )}

      {validationError && !limitReached && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {validationError}
        </p>
      )}

      {(isUploading || uploadPercent > 0) && (
        <div className="mt-3 rounded-lg border bg-muted/25 p-3">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 font-medium">
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileCheck2 className="size-4 text-success" />
              )}
              {isUploading ? 'Đang gửi file lên máy chủ' : 'Đã tải file lên máy chủ'}
            </span>
            <span className="tabular-nums text-muted-foreground">{uploadPercent}%</span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-label="Tiến độ tải file"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={uploadPercent}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${uploadPercent}%` }}
            />
          </div>
        </div>
      )}

      {trackedCv && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border bg-muted/25 p-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {isCvProcessing(trackedCv.status) ? (
                <Sparkles className="size-4 animate-pulse" />
              ) : (
                <FileCheck2 className="size-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{trackedCv.originalFilename}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {trackedCv.status === 'FAILED'
                  ? (trackedCv.statusMessage ?? 'AI chưa thể đọc CV. Bạn có thể thử lại bên dưới.')
                  : isCvProcessing(trackedCv.status)
                    ? 'File đã tải xong. AI đang đọc và tạo hồ sơ, thường mất 10–25 giây.'
                    : 'Hồ sơ đã sẵn sàng để bạn kiểm tra.'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:ml-auto">
            <CvStatusBadge status={trackedCv.status} />
            {trackedCv.status === 'PARSED' && trackedCv.profileId !== null && (
              <Button size="sm" asChild>
                <Link to={ROUTES.profileDetail(trackedCv.profileId)}>
                  <FilePenLine />
                  Kiểm tra hồ sơ
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
