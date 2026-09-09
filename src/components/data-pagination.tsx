import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DataPaginationProps {
  page: number // 0-indexed
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (newPage: number) => void
  itemName?: string
  className?: string
}

export default function DataPagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  itemName = 'kết quả',
  className,
}: DataPaginationProps) {
  if (totalElements <= 0 || totalPages <= 1) {
    return null
  }

  const startItem = page * pageSize + 1
  const endItem = Math.min((page + 1) * pageSize, totalElements)

  // Tạo danh sách trang hiển thị linh hoạt
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(0) // Luôn có trang đầu

      const left = Math.max(1, page - 1)
      const right = Math.min(totalPages - 2, page + 1)

      if (left > 1) {
        pages.push('ellipsis')
      }

      for (let i = left; i <= right; i++) {
        pages.push(i)
      }

      if (right < totalPages - 2) {
        pages.push('ellipsis')
      }

      pages.push(totalPages - 1) // Luôn có trang cuối
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t text-xs text-muted-foreground select-none',
        className,
      )}
    >
      {/* Thông tin số lượng */}
      <div className="text-center sm:text-left">
        Hiển thị{' '}
        <span className="font-semibold text-foreground">
          {startItem} - {endItem}
        </span>{' '}
        trong tổng số{' '}
        <span className="font-semibold text-foreground">{totalElements}</span>{' '}
        {itemName}
      </div>

      {/* Điều hướng trang */}
      <div className="flex items-center gap-1.5">
        {/* Nút Trước */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="h-8 px-2.5 text-xs gap-1 font-medium shadow-2xs"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Trước</span>
        </Button>

        {/* Các số trang */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex size-8 items-center justify-center text-muted-foreground/60"
                >
                  <MoreHorizontal className="size-3.5" />
                </span>
              )
            }

            const isCurrent = p === page

            return (
              <Button
                key={p}
                type="button"
                variant={isCurrent ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onPageChange(p)}
                className={cn(
                  'size-8 p-0 text-xs font-medium rounded-lg transition-all',
                  isCurrent
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs pointer-events-none'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                )}
              >
                {p + 1}
              </Button>
            )
          })}
        </div>

        {/* Nút Sau */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="h-8 px-2.5 text-xs gap-1 font-medium shadow-2xs"
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
