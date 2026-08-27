import { ExternalLink, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { isPopupBlockedError, useOpenCvPdf } from '@/hooks/use-cv-file'
import { isApiError } from '@/api/api-error'

type ButtonProps = React.ComponentProps<typeof Button>

interface OpenCvPdfButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  cvId: number
  label?: string
}

export default function OpenCvPdfButton({
  cvId,
  label = 'Mở PDF',
  variant = 'outline',
  size = 'sm',
  ...buttonProps
}: OpenCvPdfButtonProps) {
  const openPdf = useOpenCvPdf()

  function handleClick() {
    openPdf.mutate(cvId, {
      onError: (error) => {
        if (isPopupBlockedError(error)) {
          toast.error('Trình duyệt đã chặn tab mới. Hãy cho phép pop-up cho trang này.')
          return
        }
        toast.error(isApiError(error) ? error.message : 'Không mở được file CV.')
      },
    })
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={openPdf.isPending || buttonProps.disabled}
      {...buttonProps}
    >
      {openPdf.isPending ? <Loader2 className="animate-spin" /> : <ExternalLink />}
      {label}
    </Button>
  )
}
