import { CircleDashed, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProfileConfirmBadgeProps {
  confirmed: boolean
  className?: string
}

export default function ProfileConfirmBadge({ confirmed, className }: ProfileConfirmBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'h-6 gap-1.5 border px-2',
        confirmed
          ? 'border-success/25 bg-success/10 text-success'
          : 'border-border bg-muted text-muted-foreground',
        className,
      )}
    >
      {confirmed ? <ShieldCheck /> : <CircleDashed />}
      {confirmed ? 'Đã xác nhận' : 'Chưa xác nhận'}
    </Badge>
  )
}
