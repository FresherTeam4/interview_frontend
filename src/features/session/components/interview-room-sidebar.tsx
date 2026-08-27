import { ArrowLeft, Briefcase, CheckCircle2, CircleDot, History, Pause, Play, Sparkles, User } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/api/api-error'
import { usePauseSession, useResumeSession } from '@/hooks/use-interview-session'
import { ROUTES } from '@/constants/routes'
import {
  INTERVIEW_DIFFICULTY_LABEL,
  SESSION_MODE_LABEL,
  SESSION_STATUS_LABEL,
} from '@/constants/session'
import RubricPreviewDialog from '@/features/session/components/rubric-preview-dialog'
import type { InterviewSession } from '@/types/session'

interface InterviewRoomSidebarProps {
  session: InterviewSession
}

export default function InterviewRoomSidebar({ session }: InterviewRoomSidebarProps) {
  const pauseSession = usePauseSession(session.id)
  const resumeSession = useResumeSession(session.id)

  const isPaused = session.status === 'PAUSED'
  const isFinished = session.status === 'COMPLETED' || session.status === 'SCORING'
  const isBusy = pauseSession.isPending || resumeSession.isPending
  const currentQuestionNumber = Math.min(
    session.answeredQuestionCount + 1,
    session.totalQuestionCount,
  )
  const progressPercent =
    session.totalQuestionCount > 0
      ? Math.round((session.answeredQuestionCount / session.totalQuestionCount) * 100)
      : 0

  async function handleTogglePause() {
    try {
      if (isPaused) {
        await resumeSession.mutateAsync({ expectedVersion: session.version })
        toast.success('Đã tiếp tục buổi phỏng vấn.')
      } else {
        await pauseSession.mutateAsync({ expectedVersion: session.version })
        toast.info('Đã tạm dừng phiên phỏng vấn.')
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Session Info & Progress Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs">
                AI
              </span>
              <CardTitle className="text-base font-semibold">
                Phiên #{session.id}
              </CardTitle>
            </div>
            <Badge
              variant={
                isPaused
                  ? 'destructive'
                  : isFinished
                    ? 'default'
                    : session.status === 'IN_PROGRESS'
                      ? 'default'
                      : 'secondary'
              }
              className="text-xs shrink-0 font-medium"
            >
              {SESSION_STATUS_LABEL[session.status]}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-4 text-xs">
          {/* Target Position & Profile */}
          <div className="flex flex-col gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Briefcase className="size-3.5" />
                <span>Vị trí ứng tuyển</span>
              </div>
              <p className="font-medium text-sm text-foreground line-clamp-2">
                {session.jobDescription.title}
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <User className="size-3.5" />
                <span>Hồ sơ ứng viên</span>
              </div>
              <p className="font-medium text-foreground truncate">
                {session.profile?.headline ?? `Hồ sơ #${session.profile?.id}`}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Badge variant="outline" className="text-[11px] font-normal">
                Độ khó: <strong className="ml-1 font-semibold">{INTERVIEW_DIFFICULTY_LABEL[session.difficulty]}</strong>
              </Badge>
              <Badge variant="outline" className="text-[11px] font-normal">
                Hình thức: <strong className="ml-1 font-semibold">{SESSION_MODE_LABEL[session.mode]}</strong>
              </Badge>
            </div>
          </div>

          {/* Progress or Completed Section */}
          {isFinished ? (
            <div className="flex flex-col gap-2.5 rounded-lg border border-success/30 bg-success/5 p-3">
              <div className="flex items-center gap-2 text-success font-semibold text-xs">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Buổi phỏng vấn đã hoàn tất!</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">
                {session.status === 'SCORING'
                  ? 'Hệ thống đang hoàn tất lưu trữ hội thoại và xử lý dữ liệu của phiên.'
                  : 'Đã hoàn thành toàn bộ câu hỏi và lưu trữ dữ liệu đối thoại.'}
              </p>

              <div className="flex items-center justify-between text-[11px] font-medium pt-0.5">
                <span className="text-foreground">Tiến độ: {session.answeredQuestionCount}/{session.totalQuestionCount} câu</span>
                <span className="text-success font-semibold">100%</span>
              </div>

              {/* Step pills all green */}
              {session.totalQuestionCount > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Array.from({ length: session.totalQuestionCount }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex size-6 items-center justify-center rounded-md text-[11px] font-medium bg-success/15 text-success"
                      title={`Câu ${idx + 1}: Đã hoàn thành`}
                    >
                      <CheckCircle2 className="size-3.5" />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between font-medium">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Tiến độ câu hỏi</span>
                </span>
                <span className="text-primary font-semibold">
                  {currentQuestionNumber} / {session.totalQuestionCount}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Đã trả lời: {session.answeredQuestionCount} câu</span>
                <span>{progressPercent}% hoàn thành</span>
              </div>

              {/* Question Step Indicator list */}
              {session.totalQuestionCount > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Array.from({ length: session.totalQuestionCount }).map((_, idx) => {
                    const qNum = idx + 1
                    const isAnswered = qNum <= session.answeredQuestionCount
                    const isCurrent = qNum === currentQuestionNumber && !isAnswered

                    return (
                      <div
                        key={qNum}
                        className={`flex size-6 items-center justify-center rounded-md text-[11px] font-medium transition-colors ${
                          isAnswered
                            ? 'bg-primary/15 text-primary'
                            : isCurrent
                              ? 'bg-primary text-primary-foreground font-semibold ring-2 ring-primary/30'
                              : 'bg-muted text-muted-foreground'
                        }`}
                        title={
                          isAnswered
                            ? `Câu ${qNum}: Đã trả lời`
                            : isCurrent
                              ? `Câu ${qNum}: Đang trả lời`
                              : `Câu ${qNum}: Chưa trả lời`
                        }
                      >
                        {isAnswered ? (
                          <CheckCircle2 className="size-3.5" />
                        ) : isCurrent ? (
                          <CircleDot className="size-3.5" />
                        ) : (
                          qNum
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )}

          {/* Quick Actions & Navigation */}
          <div className="flex flex-col gap-2 pt-1">
            <RubricPreviewDialog />

            {/* During Interview: Pause / Resume Button */}
            {!isFinished && (session.status === 'IN_PROGRESS' || isPaused) ? (
              <Button
                variant={isPaused ? 'default' : 'outline'}
                size="sm"
                onClick={() => void handleTogglePause()}
                disabled={isBusy || session.awaitingAction === 'ENGINE_RESPONSE'}
                className="w-full gap-1.5 text-xs font-medium"
              >
                {isPaused ? (
                  <>
                    <Play className="size-3.5 fill-current" />
                    Tiếp tục phỏng vấn
                  </>
                ) : (
                  <>
                    <Pause className="size-3.5" />
                    Tạm dừng phỏng vấn
                  </>
                )}
              </Button>
            ) : null}

            {/* When Finished: History & Create New Session & Home buttons placed under Rubric */}
            {isFinished ? (
              <>
                <Button variant="outline" size="sm" asChild className="w-full gap-1.5 text-xs font-medium">
                  <Link to={ROUTES.sessionList}>
                    <History className="size-3.5" />
                    Xem lịch sử phỏng vấn
                  </Link>
                </Button>
                <Button size="sm" asChild className="w-full gap-1.5 text-xs font-medium shadow-xs">
                  <Link to={ROUTES.sessionCreate}>
                    <Sparkles className="size-3.5" />
                    Luyện phiên mới
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild className="w-full gap-1.5 text-xs text-muted-foreground">
                  <Link to={ROUTES.home}>
                    <ArrowLeft className="size-3.5" />
                    Về trang chủ
                  </Link>
                </Button>
              </>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
