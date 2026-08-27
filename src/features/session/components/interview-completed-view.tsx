import { ArrowLeft, CheckCircle2, History, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ROUTES } from '@/constants/routes'
import { INTERVIEW_DIFFICULTY_LABEL } from '@/constants/session'
import RubricPreviewDialog from '@/features/session/components/rubric-preview-dialog'
import type { InterviewSession } from '@/types/session'

interface InterviewCompletedViewProps {
  session: InterviewSession
}

export default function InterviewCompletedView({ session }: InterviewCompletedViewProps) {
  const isScoring = session.status === 'SCORING'

  return (
    <Card className="text-center">
      <CardHeader className="flex flex-col items-center gap-2 pb-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-8" />
        </div>
        <CardTitle className="text-xl sm:text-2xl">
          {isScoring ? 'Buổi phỏng vấn đang được tổng hợp!' : 'Chúc mừng! Bạn đã hoàn thành buổi phỏng vấn'}
        </CardTitle>
        <CardDescription className="max-w-md text-sm">
          {isScoring
            ? 'Hệ thống đang hoàn tất lưu trữ hội thoại và xử lý dữ liệu của phiên.'
            : 'Toàn bộ câu trả lời của bạn đã được ghi nhận đầy đủ theo từng lượt đối thoại.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 max-w-lg w-full rounded-xl border bg-muted/20 p-4 text-sm text-left">
          <div>
            <p className="text-xs text-muted-foreground">Vị trí ứng tuyển</p>
            <p className="font-semibold text-foreground truncate">{session.jobDescription.title}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Độ khó</p>
            <p className="font-semibold text-foreground">{INTERVIEW_DIFFICULTY_LABEL[session.difficulty]}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Số câu đã hoàn thành</p>
            <p className="font-semibold text-success">
              {session.answeredQuestionCount} / {session.totalQuestionCount} câu
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <RubricPreviewDialog />
          <Button variant="outline" asChild>
            <Link to={ROUTES.sessionList}>
              <History className="size-4" />
              Xem lịch sử phỏng vấn
            </Link>
          </Button>
          <Button asChild>
            <Link to={ROUTES.sessionCreate}>
              <Sparkles className="size-4" />
              Luyện phiên mới
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to={ROUTES.home}>
              <ArrowLeft className="size-4" />
              Về trang chủ
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
