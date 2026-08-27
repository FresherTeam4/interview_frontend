import { Columns2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CompareLayout } from '@/features/cv-profile/lib/compare-layout'

const layoutOptions = [
  { value: 'cv', label: 'Ưu tiên CV', icon: PanelLeftOpen },
  { value: 'split', label: 'Chia đôi', icon: Columns2 },
  { value: 'form', label: 'Ẩn CV', icon: PanelLeftClose },
] as const satisfies ReadonlyArray<{ value: CompareLayout; label: string; icon: unknown }>

interface CompareLayoutToggleProps {
  value: CompareLayout
  onChange: (value: CompareLayout) => void
}

export default function CompareLayoutToggle({ value, onChange }: CompareLayoutToggleProps) {
  return (
    <div
      role="group"
      aria-label="Bố cục đối chiếu CV và hồ sơ"
      className="hidden gap-1 rounded-lg border bg-card p-1 lg:flex"
    >
      {layoutOptions.map((option) => (
        <Button
          key={option.value}
          type="button"
          size="xs"
          variant={value === option.value ? 'secondary' : 'ghost'}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          <option.icon />
          {option.label}
        </Button>
      ))}
    </div>
  )
}
