import { CloudUpload } from 'lucide-react'
import { ErrorCode, useDropzone, type FileError } from 'react-dropzone'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { CV_ACCEPTED_MIME, CV_MAX_FILE_SIZE_BYTES, CV_MAX_PAGES } from '@/constants/cv'
import { cn } from '@/lib/utils'

const MAX_SIZE_LABEL = `${CV_MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`

const ERROR_MESSAGES: Record<string, string> = {
  [ErrorCode.FileInvalidType]: 'Chỉ nhận file CV định dạng PDF.',
  [ErrorCode.FileTooLarge]: `File vượt quá dung lượng cho phép (tối đa ${MAX_SIZE_LABEL}).`,
  [ErrorCode.TooManyFiles]: 'Mỗi lần chỉ tải lên 1 file.',
}

interface CvUploadDropzoneProps {
  onSelect: (file: File) => void
  isUploading: boolean
}

export default function CvUploadDropzone({ onSelect, isUploading }: CvUploadDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: { [CV_ACCEPTED_MIME]: ['.pdf'] },
    maxSize: CV_MAX_FILE_SIZE_BYTES,
    maxFiles: 1,
    multiple: false,
    disabled: isUploading,
    getErrorMessage: (error: FileError) => ERROR_MESSAGES[error.code] ?? error.message,
    onDropAccepted: (files) => {
      const [file] = files
      if (file) onSelect(file)
    },
    onDropRejected: (rejections) => {
      const message = rejections[0]?.errors[0]?.message
      if (message) toast.error(message)
    },
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center gap-3 rounded-lg border border-dashed border-input p-8 text-center transition-colors',
        isDragActive && 'border-primary bg-primary/5',
        isUploading ? 'opacity-60' : 'cursor-pointer hover:border-primary/60',
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <Spinner className="size-6 text-muted-foreground" />
      ) : (
        <CloudUpload className="size-6 text-muted-foreground" />
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium">
          {isUploading ? 'Đang tải CV lên…' : 'Kéo thả CV vào đây hoặc bấm để chọn file'}
        </p>
        <p className="text-xs text-muted-foreground">
          Chỉ nhận PDF, tối đa {MAX_SIZE_LABEL} và {CV_MAX_PAGES} trang
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={(event) => {
          // Root đã có onClick mở file dialog — chặn bubble để không mở 2 lần.
          event.stopPropagation()
          open()
        }}
      >
        Chọn file PDF
      </Button>
    </div>
  )
}
