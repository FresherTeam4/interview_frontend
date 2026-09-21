import type { ReactNode } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center bg-card/50">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon ?? <FolderOpen className="size-6" />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h3 className="font-semibold text-base text-foreground">{title}</h3>
        {description ? (
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actionLabel && onAction ? (
        <Button size="sm" onClick={onAction} className="mt-2 text-xs">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
