import { useState } from 'react'
import { Award, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MVP_RUBRIC } from '@/constants/rubric'

export default function RubricPreviewDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button" className="gap-1.5 text-xs shrink-0">
          <Award className="size-3.5" />
          Xem bộ tiêu chí chấm điểm
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="size-5 text-primary shrink-0" />
            <span>{MVP_RUBRIC.name}</span>
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {MVP_RUBRIC.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1.5 flex flex-col gap-4 max-h-[68vh]">
          {MVP_RUBRIC.criteria.map((criterion, idx) => (
            <div key={criterion.code} className="flex flex-col gap-2.5 rounded-lg border p-4 bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary shrink-0">
                    {idx + 1}
                  </span>
                  <h4 className="font-semibold text-sm">{criterion.name}</h4>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Trọng số: {Math.round(criterion.weight * 100)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{criterion.description}</p>

              {/* 4 levels */}
              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                {criterion.levels.map((level) => (
                  <div
                    key={level.levelNo}
                    className="flex flex-col gap-1 rounded-md border bg-muted/40 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-foreground">
                        Mức {level.levelNo}: {level.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {level.scoreValue}/{criterion.maxScore} đ
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {level.descriptor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
