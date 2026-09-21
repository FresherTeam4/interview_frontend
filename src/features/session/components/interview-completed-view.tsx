import { CheckCircle2, History, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import CreateInterviewDialog from '@/features/session/components/wizard/create-interview-dialog'
import { ROUTES } from '@/constants/routes'
import type { InterviewSession } from '@/types/session'

interface InterviewCompletedViewProps {
  session: InterviewSession
}

export default function InterviewCompletedView({ session }: InterviewCompletedViewProps) {
  const isScoring = session.status === 'SCORING'

  return (
    <Card className="border-success/30 bg-success/5 shadow-xs overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success text-success-foreground shadow-xs">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="space-y-0.5">
            <h2 className="font-semibold text-base text-foreground">
              {isScoring
                ? 'Buổi phỏng vấn đã kết thúc thành công!'
                : 'Chúc mừng! Bạn đã hoàn thành phỏng vấn'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isScoring
                ? 'Đang xử lý dữ liệu và hoàn tất phiên...'
                : 'Đã ghi nhận toàn bộ câu trả lời của bạn.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <Button size="sm" variant="outline" asChild className="text-xs gap-1.5">
            <Link to={ROUTES.sessionList}>
              <History className="size-3.5" />
              Lịch sử phiên
            </Link>
          </Button>
          <CreateInterviewDialog
            trigger={
              <Button size="sm" className="text-xs gap-1.5 shadow-xs">
                <Plus className="size-3.5" />
                Luyện phiên mới
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  )
}
