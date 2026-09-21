import type { ComponentType, ReactNode } from 'react'
import type { LucideProps } from 'lucide-react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface FieldArraySectionProps {
  title: string
  description?: string
  icon?: ComponentType<LucideProps>
  addLabel: string
  emptyLabel: string
  count: number
  /** Chặn ngay ở UI để không bao giờ chạm giới hạn @Size của backend. */
  max: number
  onAdd: () => void
  children: ReactNode
}

/** Khung chung cho 3 danh sách con của hồ sơ (học vấn / kỹ năng / dự án). */
export default function FieldArraySection({
  title,
  description,
  icon: Icon,
  addLabel,
  emptyLabel,
  count,
  max,
  onAdd,
  children,
}: FieldArraySectionProps) {
  const reachedMax = count >= max

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="border-b border-border/40 pb-4 bg-muted/15">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4.5" />
            </div>
          )}
          <div>
            <CardTitle className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              {title}
            </CardTitle>
            {description ? (
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {description}
              </CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="gap-4 pt-5">
        {count === 0 ? (
          <p className="rounded-md border border-dashed border-input p-4 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
        ) : (
          children
        )}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={reachedMax}
            onClick={onAdd}
          >
            <Plus className="size-4" />
            {addLabel}
          </Button>
          {reachedMax ? (
            <span className="text-xs text-muted-foreground">Đã đạt tối đa {max} mục</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
