import { CircleCheck, CircleX, Clock3, Loader2 } from 'lucide-react'
import { cva } from 'class-variance-authority'
import { Badge } from '@/components/ui/badge'
import { cvStatusLabels } from '@/features/cv-profile/lib/cv-status'
import { cn } from '@/lib/utils'
import type { CvStatus } from '@/types/cv-profile'

const statusBadgeVariants = cva('h-6 gap-1.5 border px-2', {
  variants: {
    status: {
      UPLOADED: 'border-border bg-muted text-muted-foreground',
      PARSING: 'border-primary/25 bg-primary/10 text-primary',
      PARSED: 'border-success/25 bg-success/10 text-success',
      FAILED: 'border-destructive/25 bg-destructive/10 text-destructive',
    },
  },
})

const statusIcons = {
  UPLOADED: Clock3,
  PARSING: Loader2,
  PARSED: CircleCheck,
  FAILED: CircleX,
} satisfies Record<CvStatus, typeof Clock3>

interface CvStatusBadgeProps {
  status: CvStatus
  className?: string
}

export default function CvStatusBadge({ status, className }: CvStatusBadgeProps) {
  const Icon = statusIcons[status]

  return (
    <Badge variant="outline" className={cn(statusBadgeVariants({ status }), className)}>
      <Icon className={status === 'PARSING' ? 'animate-spin' : undefined} />
      {cvStatusLabels[status]}
    </Badge>
  )
}
