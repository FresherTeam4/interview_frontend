import { useState } from 'react'
import { useNavigate } from 'react-router'
import { FileUp, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import CvUploadDropzone from '@/features/cv/components/cv-upload-dropzone'
import CvStatusTracker from '@/features/profile/components/cv-status-tracker'
import { uploadCv } from '@/api/cv'
import { getErrorMessage } from '@/api/api-error'
import { profileDetailPath } from '@/constants/routes'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { CvDocument } from '@/types/cv'

interface CvUploadDialogProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export default function CvUploadDialog({ trigger, onSuccess }: CvUploadDialogProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedCv, setUploadedCv] = useState<CvDocument | null>(null)
  const [completedProfileId, setCompletedProfileId] = useState<number | null>(null)

  async function handleFileSelected(file: File) {
    setIsUploading(true)
    try {
      const cvDoc = await uploadCv(file)
      setUploadedCv(cvDoc)

      // Cập nhật ngay danh sách tệp CV để tab "Tệp CV đã tải" hiển thị tệp mới tức thì
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cvDocuments })
      onSuccess?.()

      // Nếu CV này đã được trích xuất từ trước (Backend trả status = PARSED ngay)
      if (cvDoc.status === 'PARSED' && cvDoc.profileId) {
        setCompletedProfileId(cvDoc.profileId)
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
        toast.success('Hồ sơ đã sẵn sàng từ CV này!')
      }
    } catch (err) {
      toast.error('Tải CV lên thất bại: ' + getErrorMessage(err))
    } finally {
      setIsUploading(false)
    }
  }

  function handleParsed(profileId: number) {
    setCompletedProfileId(profileId)
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cvDocuments })
    void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
    onSuccess?.()
  }

  function handleNavigateToProfile() {
    if (completedProfileId) {
      setOpen(false)
      navigate(profileDetailPath(completedProfileId))
    }
  }

  function handleOpenChange(newOpen: boolean) {
    // Không cho đóng khi đang tải file hoặc đang trích xuất
    if (!newOpen && isUploading) return
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state sau khi đóng dialog
      setTimeout(() => {
        setUploadedCv(null)
        setCompletedProfileId(null)
      }, 300)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <FileUp className="size-4" />
            Tải CV mới
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Tải lên CV ứng viên</DialogTitle>
          <DialogDescription className="sr-only">
            Tải file CV định dạng PDF để tạo hồ sơ phỏng vấn.
          </DialogDescription>
        </DialogHeader>

        {completedProfileId ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="size-14 rounded-full bg-success/15 text-success flex items-center justify-center">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Hồ sơ ứng viên đã tạo thành công!</h3>
              <p className="text-sm text-muted-foreground">
                Bạn có thể xem lại và hiệu chỉnh thông tin chi tiết ngay bây giờ.
              </p>
            </div>
            <Button className="w-full mt-2" onClick={handleNavigateToProfile}>
              Xem chi tiết hồ sơ
            </Button>
          </div>
        ) : uploadedCv ? (
          <CvStatusTracker
            cvId={uploadedCv.id}
            onParsed={handleParsed}
            onCancel={() => handleOpenChange(false)}
          />
        ) : (
          <div className="py-3">
            <CvUploadDropzone onSelect={(file) => void handleFileSelected(file)} isUploading={isUploading} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
