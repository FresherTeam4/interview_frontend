import { Calendar, FileText, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import JdStatusBadge from '@/features/jd/components/jd-status-badge'
import { JD_SOURCE_TYPE_LABEL } from '@/constants/jd'
import { jdDetailPath } from '@/constants/routes'
import type { JobDescriptionSummary } from '@/types/jd'

interface JdSummaryCardProps {
  jd: JobDescriptionSummary
  onDelete: (id: number) => void
  isBusy: boolean
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso))
}

export default function JdSummaryCard({ jd, onDelete, isBusy }: JdSummaryCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <Link
            to={jdDetailPath(jd.id)}
            className="hover:underline"
          >
            <CardTitle className="truncate text-base">{jd.title}</CardTitle>
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3" />
              {JD_SOURCE_TYPE_LABEL[jd.sourceType]}
            </span>
            {jd.originalFilename ? (
              <span className="truncate">{jd.originalFilename}</span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <JdStatusBadge status={jd.status} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" disabled={isBusy}>
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Tuỳ chọn</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={jdDetailPath(jd.id)}>
                  <Pencil className="size-4" />
                  Xem / Sửa
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(jd.id)}
              >
                <Trash2 className="size-4" />
                Xoá
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="size-3" />
          <span>Tạo {formatDate(jd.createdAt)}</span>
          {jd.confirmedAt ? (
            <span className="ml-2">· Xác nhận {formatDate(jd.confirmedAt)}</span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
