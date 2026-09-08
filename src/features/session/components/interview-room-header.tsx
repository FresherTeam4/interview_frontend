import { useState } from 'react'
import {
  Award,
  Briefcase,
  Clock,
  History,
  MessageSquare,
  Pause,
  Play,
  Plus,
  User,
} from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/api/api-error'
import { usePauseSession, useResumeSession } from '@/hooks/use-interview-session'
import { useInterviewTimer } from '@/features/session/hooks/use-interview-timer'
import { ROUTES } from '@/constants/routes'
import {
  INTERVIEW_DIFFICULTY_LABEL,
  SESSION_MODE_LABEL,
  SESSION_STATUS_LABEL,
} from '@/constants/session'
import SessionCompleteDialog from '@/features/session/components/session-complete-dialog'
import CreateInterviewDialog from '@/features/session/components/wizard/create-interview-dialog'
import { cn } from '@/lib/utils'
import type { InterviewSession } from '@/types/session'

interface InterviewRoomHeaderProps {
  session: InterviewSession
}

export default function InterviewRoomHeader({ session }: InterviewRoomHeaderProps) {
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const pauseSession = usePauseSession(session.id)
  const resumeSession = useResumeSession(session.id)

  const isPaused = session.status === 'PAUSED'
  const isScoring = session.status === 'SCORING'
  const isFailed = session.status === 'SCORING_FAILED'
  const isCompleted = session.status === 'COMPLETED'
  const isFinished = isCompleted || isScoring || isFailed
  const isBusy = pauseSession.isPending || resumeSession.isPending
  const turnCount = session.turns?.length || 0

  const timer = useInterviewTimer({
    deadlineAt: session.deadlineAt,
    initialRemainingSeconds: session.remainingSeconds,
    durationMinutes: session.durationMinutes || 30,
    startedAt: session.startedAt,
    isPaused: isPaused || isFinished,
  })

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
    <div className="flex flex-col gap-2.5 rounded-xl border bg-card p-3 sm:p-4 shadow-xs">
      {/* Primary Line: Identity, Position, Profile & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
              AI
            </span>
            <span className="font-semibold text-sm sm:text-base text-foreground">
              Phiên #{session.id}
            </span>
          </div>

          <Badge
            variant={
              isPaused || isFailed
                ? 'destructive'
                : isScoring
                  ? 'outline'
                  : isCompleted
                    ? 'secondary'
                    : session.status === 'IN_PROGRESS'
                      ? 'default'
                      : 'secondary'
            }
            className={cn('text-xs font-medium', isScoring && 'border-primary/40 text-primary animate-pulse')}
          >
            {isScoring ? 'AI đang chấm điểm...' : isFailed ? 'Chấm điểm lỗi' : isCompleted ? 'Đã hoàn tất' : SESSION_STATUS_LABEL[session.status]}
          </Badge>

          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-muted/40 border">
            <Briefcase className="size-3 text-primary shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-[260px] text-foreground">
              {session.jobDescription.title}
            </span>
          </div>

          {session.profile?.headline && (
            <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground font-medium px-2 py-0.5 rounded-md bg-muted/40 border">
              <User className="size-3 text-muted-foreground shrink-0" />
              <span className="truncate max-w-[180px]">
                {session.profile.headline}
              </span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isFinished && (session.status === 'IN_PROGRESS' || isPaused) ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleTogglePause()}
                disabled={isBusy || session.awaitingAction === 'ENGINE_RESPONSE'}
                className="gap-1.5 text-xs h-8"
              >
                {isPaused ? (
                  <>
                    <Play className="size-3.5 fill-current text-success" />
                    <span>Tiếp tục</span>
                  </>
                ) : (
                  <>
                    <Pause className="size-3.5 text-muted-foreground" />
                    <span>Tạm dừng</span>
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompleteDialogOpen(true)}
                disabled={isBusy || session.awaitingAction === 'ENGINE_RESPONSE'}
                className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary/10 font-medium"
              >
                <Award className="size-3.5" />
                <span>Kết thúc phiên</span>
              </Button>
            </>
          ) : isFinished ? (
            <>
              <CreateInterviewDialog
                trigger={
                  <Button size="sm" className="gap-1.5 text-xs h-8 shadow-xs">
                    <Plus className="size-3.5" />
                    <span>Luyện phiên mới</span>
                  </Button>
                }
              />
              <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs h-8">
                <Link to={ROUTES.sessionList}>
                  <History className="size-3.5" />
                  <span className="hidden sm:inline">Xem lịch sử</span>
                </Link>
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {/* Secondary Line: Metadata tags & Live Countdown Timer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/60 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
          <Badge variant="outline" className="text-[11px] font-normal py-0 h-5">
            Độ khó: <strong className="ml-1 font-semibold text-foreground">{INTERVIEW_DIFFICULTY_LABEL[session.difficulty]}</strong>
          </Badge>
          <Badge variant="outline" className="text-[11px] font-normal py-0 h-5">
            Hình thức: <strong className="ml-1 font-semibold text-foreground">{SESSION_MODE_LABEL[session.mode]}</strong>
          </Badge>
          <span className="flex items-center gap-1 font-medium text-foreground ml-1">
            <MessageSquare className="size-3.5 text-primary" />
            Lượt đối thoại: #{turnCount}
          </span>
        </div>

        {/* Live Timer */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'flex items-center gap-1.5 font-semibold font-mono text-xs px-2.5 py-0.5 rounded-md border transition-colors',
              timer.isUrgent
                ? 'bg-destructive/10 text-destructive border-destructive/30 animate-pulse'
                : 'bg-primary/10 text-primary border-primary/20',
            )}
          >
            <Clock className="size-3.5" />
            {isFinished
              ? 'Đã kết thúc'
              : isPaused
                ? `Tạm dừng (${timer.formattedTime})`
                : `${timer.formattedTime} còn lại`}
          </span>
        </div>
      </div>

      <SessionCompleteDialog
        session={session}
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
      />
    </div>
  )
}
