import type { ComponentProps } from 'react'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { CV_STATUS, CV_STATUS_LABEL, type CvDocumentStatus } from '@/constants/cv'

type BadgeStyle = {
  variant: ComponentProps<typeof Badge>['variant']
  className?: string
}

const STATUS_STYLE: Record<CvDocumentStatus, BadgeStyle> = {
  UPLOADED: { variant: 'secondary' },
  PARSING: { variant: 'secondary' },
  PARSED: { variant: 'default', className: 'bg-success text-success-foreground' },
  FAILED: { variant: 'destructive' },
}

export default function CvStatusBadge({ status }: { status: CvDocumentStatus }) {
  const style = STATUS_STYLE[status]

  return (
    <Badge variant={style.variant} className={style.className}>
      {status === CV_STATUS.PARSING ? <Spinner className="size-3" /> : null}
      {CV_STATUS_LABEL[status]}
    </Badge>
  )
}
