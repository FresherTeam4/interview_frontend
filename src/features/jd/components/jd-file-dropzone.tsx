import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FileUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { JD_MAX_FILE_SIZE_BYTES } from '@/constants/jd'

interface JdFileDropzoneProps {
  onSelect: (file: File) => void
  isUploading: boolean
}

export default function JdFileDropzone({ onSelect, isUploading }: JdFileDropzoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return
      onSelect(file)
    },
    [onSelect],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    maxSize: JD_MAX_FILE_SIZE_BYTES,
    maxFiles: 1,
    disabled: isUploading,
    onDropRejected: (rejections) => {
      const error = rejections[0]?.errors[0]
      if (error?.code === 'file-too-large') {
        toast.error('File vượt quá 5 MB.')
      } else if (error?.code === 'file-invalid-type') {
        toast.error('Chỉ nhận file PDF hoặc TXT.')
      } else {
        toast.error(error?.message ?? 'File không hợp lệ.')
      }
    },
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50',
        isUploading && 'pointer-events-none opacity-60',
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <>
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Đang tải lên...</p>
        </>
      ) : (
        <>
          <FileUp className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            {isDragActive ? 'Thả file vào đây' : 'Kéo thả file PDF hoặc TXT, hoặc bấm để chọn'}
          </p>
          <p className="text-xs text-muted-foreground">Tối đa 5 MB</p>
        </>
      )}
    </div>
  )
}
