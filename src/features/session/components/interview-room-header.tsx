import { Pause, Play, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/api/api-error'
import { usePauseSession, useResumeSession } from '@/hooks/use-interview-session'
import {
  INTERVIEW_DIFFICULTY_LABEL,
  SESSION_STATUS_LABEL,
} from '@/constants/session'
import RubricPreviewDialog from '@/features/session/components/rubric-preview-dialog'
import type { InterviewSession } from '@/types/session'

interface InterviewRoomHeaderProps {
  session: InterviewSession
}

export default function InterviewRoomHeader({ session }: InterviewRoomHeaderProps) {
  const pauseSession = usePauseSession(session.id)
  const resumeSession = useResumeSession(session.id)

  const isPaused = session.status === 'PAUSED'
  const isBusy = pauseSession.isPending || resumeSession.isPending
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
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold text-xs">
              AI
            </span>
            <h1 className="font-semibold text-base sm:text-lg">
              Phiên phỏng vấn #{session.id}
            </h1>
          </div>
          <Badge variant="outline" className="text-xs">
            {session.jobDescription.title}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {INTERVIEW_DIFFICULTY_LABEL[session.difficulty]}
          </Badge>
          <Badge
            variant={isPaused ? 'destructive' : session.status === 'IN_PROGRESS' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {SESSION_STATUS_LABEL[session.status]}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <RubricPreviewDialog />
          {session.status === 'IN_PROGRESS' || isPaused ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleTogglePause()}
              disabled={isBusy || session.awaitingAction === 'ENGINE_RESPONSE'}
              className="gap-1.5 text-xs"
            >
              {isPaused ? (
                <>
                  <Play className="size-3.5 fill-current text-success" />
                  Tiếp tục
                </>
              ) : (
                <>
                  <Pause className="size-3.5 text-muted-foreground" />
                  Tạm dừng
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Question progress */}
      <div className="flex flex-col gap-1.5 pt-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="size-3.5 text-primary" />
            <span>
              Tiến độ: Câu {Math.min(session.answeredQuestionCount + 1, session.totalQuestionCount)} / {session.totalQuestionCount}
            </span>
          </span>
          <span>{progressPercent}% hoàn thành</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  )
}
