import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TourPlacement, TourStep } from '@/features/cv-profile/lib/tour'
import { cn } from '@/lib/utils'

interface FeatureTourProps {
  /** Chỉ mount khi hướng dẫn đang chạy; unmount là kết thúc, nhờ vậy bước hiện tại tự reset. */
  steps: TourStep[]
  /** Gọi khi người dùng bỏ qua hoặc hoàn thành hướng dẫn. */
  onClose: () => void
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const SPOTLIGHT_PADDING = 8
const CARD_WIDTH = 320
const CARD_GAP = 12
/** Chiều cao ước lượng của thẻ ghi chú, chỉ dùng để quyết định lật hướng khi thiếu chỗ. */
const CARD_HEIGHT_ESTIMATE = 220
const VIEWPORT_MARGIN = 16

function measureTarget(selector: string | undefined): Rect | null {
  if (!selector) return null
  const element = document.querySelector(selector)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return null
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
}

function isSameRect(a: Rect | null, b: Rect | null): boolean {
  if (a === null || b === null) return a === b
  return (
    Math.abs(a.top - b.top) < 1 &&
    Math.abs(a.left - b.left) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1
  )
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

/** Chọn phía đặt thẻ ghi chú: giữ nguyên phía mong muốn nếu còn chỗ, không thì lật sang phía đối diện. */
function resolvePlacement(rect: Rect, placement: TourPlacement): TourPlacement {
  const spaceBelow = window.innerHeight - (rect.top + rect.height)
  const spaceAbove = rect.top
  const spaceRight = window.innerWidth - (rect.left + rect.width)
  const needsVertical = CARD_HEIGHT_ESTIMATE + CARD_GAP + VIEWPORT_MARGIN
  const needsHorizontal = CARD_WIDTH + CARD_GAP + VIEWPORT_MARGIN

  if (placement === 'bottom' && spaceBelow < needsVertical && spaceAbove >= needsVertical) {
    return 'top'
  }
  if (placement === 'top' && spaceAbove < needsVertical && spaceBelow >= needsVertical) {
    return 'bottom'
  }
  if (placement === 'right' && spaceRight < needsHorizontal) return 'left'
  if (placement === 'left' && rect.left < needsHorizontal) return 'right'
  return placement
}

/**
 * Đặt thẻ theo cạnh của vùng highlight. Dùng `bottom`/`right` cho hai hướng lật để không cần biết
 * trước chiều cao thật của thẻ.
 */
function toCardStyle(rect: Rect, placement: TourPlacement): React.CSSProperties {
  const resolved = resolvePlacement(rect, placement)
  const maxLeft = window.innerWidth - CARD_WIDTH - VIEWPORT_MARGIN

  if (resolved === 'top' || resolved === 'bottom') {
    const left = clamp(rect.left + rect.width / 2 - CARD_WIDTH / 2, VIEWPORT_MARGIN, maxLeft)
    return resolved === 'bottom'
      ? { top: rect.top + rect.height + SPOTLIGHT_PADDING + CARD_GAP, left }
      : { bottom: window.innerHeight - rect.top + SPOTLIGHT_PADDING + CARD_GAP, left }
  }

  const top = clamp(
    rect.top,
    VIEWPORT_MARGIN,
    window.innerHeight - CARD_HEIGHT_ESTIMATE - VIEWPORT_MARGIN,
  )
  return resolved === 'right'
    ? { top, left: rect.left + rect.width + SPOTLIGHT_PADDING + CARD_GAP }
    : { top, right: window.innerWidth - rect.left + SPOTLIGHT_PADDING + CARD_GAP }
}

export default function FeatureTour({ steps, onClose }: FeatureTourProps) {
  const titleId = useId()
  const [stepIndex, setStepIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const nextButtonRef = useRef<HTMLButtonElement>(null)

  const step = steps[stepIndex]
  const totalSteps = steps.length
  const isLast = stepIndex === totalSteps - 1

  // Đo lại từng frame để vùng highlight dính theo phần tử cả khi trang đang cuộn mượt tới nó.
  useEffect(() => {
    if (!step) return

    let frame = 0
    function track() {
      const next = measureTarget(step.target)
      setRect((current) => (isSameRect(current, next) ? current : next))
      frame = requestAnimationFrame(track)
    }

    frame = requestAnimationFrame(track)
    return () => cancelAnimationFrame(frame)
  }, [step])

  useEffect(() => {
    if (!step?.target) return
    document.querySelector(step.target)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [step])

  useEffect(() => {
    nextButtonRef.current?.focus()
  }, [stepIndex])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowRight') {
        setStepIndex((current) => Math.min(current + 1, totalSteps - 1))
      }
      if (event.key === 'ArrowLeft') setStepIndex((current) => Math.max(current - 1, 0))
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, totalSteps])

  if (!step) return null

  return createPortal(
    // Lớp phủ chặn mọi tương tác với trang trong lúc xem hướng dẫn.
    <div className="fixed inset-0 z-[60]">
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-xl ring-2 ring-primary"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            // box-shadow cực lớn giúp "khoét" đúng vùng đang giới thiệu mà không cần SVG mask.
            boxShadow: '0 0 0 9999px color-mix(in oklch, var(--color-foreground) 45%, transparent)',
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-foreground/45" />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'absolute w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-popover p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10',
          !rect && 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
        )}
        style={rect ? toCardStyle(rect, step.placement ?? 'bottom') : undefined}
      >
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Lightbulb className="size-4" />
          </span>
          <p className="text-xs font-medium text-muted-foreground tabular-nums">
            Bước {stepIndex + 1}/{totalSteps}
          </p>
        </div>

        <h2 id={titleId} className="mt-2 font-heading font-semibold">
          {step.title}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {isLast ? 'Đóng' : 'Bỏ qua'}
          </Button>
          <div className="flex items-center gap-2">
            {stepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStepIndex((current) => current - 1)}
              >
                <ChevronLeft />
                Trước
              </Button>
            )}
            <Button
              ref={nextButtonRef}
              type="button"
              size="sm"
              onClick={() => (isLast ? onClose() : setStepIndex((current) => current + 1))}
            >
              {isLast ? 'Hoàn tất' : 'Tiếp'}
              {!isLast && <ChevronRight />}
            </Button>
          </div>
        </div>
      </div>

    </div>,
    document.body,
  )
}
