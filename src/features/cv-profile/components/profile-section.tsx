import type { LucideIcon } from 'lucide-react'
import { CircleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileSectionProps {
  icon: LucideIcon
  title: string
  description?: string
  counter?: string
  action?: React.ReactNode
  error?: string
  className?: string
  children: React.ReactNode
}

export default function ProfileSection({
  icon: Icon,
  title,
  description,
  counter,
  action,
  error,
  className,
  children,
}: ProfileSectionProps) {
  return (
    <section
      className={cn('rounded-xl border bg-card text-card-foreground shadow-xs', className)}
      aria-label={title}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-heading font-semibold">
              {title}
              {counter && (
                <span className="ml-2 text-xs font-normal tabular-nums text-muted-foreground">
                  {counter}
                </span>
              )}
            </h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="p-4 sm:p-5">
        {error && (
          <p className="mb-3 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        )}
        {children}
      </div>
    </section>
  )
}
