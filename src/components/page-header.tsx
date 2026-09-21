import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        {typeof title === 'string' ? (
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        ) : (
          title
        )}
        {description ? (
          typeof description === 'string' ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : (
            description
          )
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
