import { Badge } from '@/components/ui/badge'
import { JD_STATUS_LABEL } from '@/constants/jd'
import type { JobDescriptionStatus } from '@/types/jd'

const statusVariant: Record<JobDescriptionStatus, 'secondary' | 'default'> = {
  DRAFT: 'secondary',
  READY: 'default',
}

interface JdStatusBadgeProps {
  status: JobDescriptionStatus
}

export default function JdStatusBadge({ status }: JdStatusBadgeProps) {
  return <Badge variant={statusVariant[status]}>{JD_STATUS_LABEL[status]}</Badge>
}
