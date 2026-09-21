import { useState } from 'react'
import { ExternalLink, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { getCvFileUrl } from '@/api/cv'
import { getErrorMessage } from '@/api/api-error'

interface CvPreviewPanelProps {
  cvDocumentId: number
  filename?: string
  trigger?: React.ReactNode
  className?: string
}

export default function CvPreviewPanel({
  cvDocumentId,
  filename = 'CV gốc',
  trigger,
  className,
}: CvPreviewPanelProps) {
  const [loading, setLoading] = useState(false)

  async function handleOpenInNewTab(e?: React.MouseEvent) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (loading) return

    setLoading(true)
    try {
      const res = await getCvFileUrl(cvDocumentId)
      if (res?.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer')
      } else {
        toast.error('Không tìm thấy liên kết xem file CV.')
      }
    } catch (err) {
      toast.error('Không thể mở CV: ' + getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (trigger) {
    return (
      <span onClick={(e) => void handleOpenInNewTab(e)} className="inline-flex cursor-pointer">
        {trigger}
      </span>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={className ?? 'gap-2'}
      disabled={loading}
      onClick={(e) => void handleOpenInNewTab(e)}
      title={`Mở xem ${filename} trong tab mới`}
    >
      {loading ? <Spinner className="size-4" /> : <FileText className="size-4" />}
      <span>Xem CV gốc</span>
      <ExternalLink className="size-3 text-muted-foreground ml-0.5" />
    </Button>
  )
}

