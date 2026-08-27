import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface FieldArraySectionProps {
  title: string
  description: string
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
  addLabel,
  emptyLabel,
  count,
  max,
  onAdd,
  children,
}: FieldArraySectionProps) {
  const reachedMax = count >= max

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
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
