import { useEffect, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FeatureTour from '@/features/cv-profile/components/feature-tour'
import { hasSeenTour, markTourSeen, resolveTourSteps } from '@/features/cv-profile/lib/tour'
import type { TourStep } from '@/features/cv-profile/lib/tour'

type ButtonProps = React.ComponentProps<typeof Button>

interface GuideTourButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  tourId: string
  steps: TourStep[]
  /** Chỉ tự mở lần đầu khi trang đã render xong phần tử cần highlight. */
  autoStartWhenReady?: boolean
}

/** Chờ layout ổn định (danh sách, PDF, ảnh) rồi mới đo vị trí phần tử để highlight. */
const AUTO_START_DELAY_MS = 500

export default function GuideTourButton({
  tourId,
  steps,
  autoStartWhenReady = false,
  variant = 'ghost',
  size = 'icon-sm',
  ...buttonProps
}: GuideTourButtonProps) {
  // null nghĩa là chưa chạy; khi chạy thì giữ đúng danh sách bước hợp lệ tại thời điểm mở.
  const [activeSteps, setActiveSteps] = useState<TourStep[] | null>(null)

  useEffect(() => {
    if (!autoStartWhenReady || hasSeenTour(tourId)) return

    const timer = window.setTimeout(
      () => setActiveSteps(resolveTourSteps(steps)),
      AUTO_START_DELAY_MS,
    )
    return () => window.clearTimeout(timer)
  }, [autoStartWhenReady, steps, tourId])

  function closeTour() {
    setActiveSteps(null)
    markTourSeen(tourId)
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setActiveSteps(resolveTourSteps(steps))}
        aria-label="Xem hướng dẫn sử dụng"
        title="Xem hướng dẫn sử dụng"
        {...buttonProps}
      >
        <HelpCircle />
      </Button>
      {activeSteps !== null && activeSteps.length > 0 && (
        <FeatureTour steps={activeSteps} onClose={closeTour} />
      )}
    </>
  )
}
