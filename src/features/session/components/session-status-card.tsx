import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/api/api-error'
import { useRetrySession, useStartSession } from '@/hooks/use-interview-session'
import {
  INTERVIEW_DIFFICULTY_LABEL,
  SESSION_MODE_LABEL,
  SESSION_STATUS,
  SESSION_STATUS_LABEL,
} from '@/constants/session'
import RubricPreviewDialog from '@/features/session/components/rubric-preview-dialog'
import type { InterviewSession } from '@/types/session'

interface SessionStatusCardProps {
  session: InterviewSession
}

export default function SessionStatusCard({ session }: SessionStatusCardProps) {
  const retrySession = useRetrySession(session.id)
  const startSession = useStartSession(session.id)
  const isGenerating =
    session.status === SESSION_STATUS.CREATED ||
    session.status === SESSION_STATUS.SCRIPT_GENERATING
  const isFailed = session.status === SESSION_STATUS.FAILED
  const isReady = session.status === SESSION_STATUS.READY

  async function handleRetry() {
    try {
      await retrySession.mutateAsync({ expectedVersion: session.version })
      toast.success('Đã gửi yêu cầu thử lại sinh câu hỏi.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleStart() {
    try {
      await startSession.mutateAsync({ expectedVersion: session.version })
      toast.success('Buổi phỏng vấn đã bắt đầu!')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isGenerating ? (
            <Loader2 className="size-5 animate-spin text-primary" />
          ) : isReady ? (
            <CheckCircle2 className="size-5 text-success" />
          ) : isFailed ? (
            <AlertCircle className="size-5 text-destructive" />
          ) : null}
          Phiên phỏng vấn #{session.id}
        </CardTitle>
        <CardDescription>
          {isGenerating
            ? 'Hệ thống đang sinh bộ câu hỏi phỏng vấn. Trạng thái tự cập nhật, bạn không cần làm mới trang.'
            : isReady
              ? 'Bộ câu hỏi đã sẵn sàng! Bạn có thể bắt đầu buổi phỏng vấn.'
              : isFailed
                ? 'Sinh câu hỏi thất bại. Bạn có thể thử lại.'
                : SESSION_STATUS_LABEL[session.status]}
        </CardDescription>
        <CardAction>
          <RubricPreviewDialog />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Trạng thái</p>
            <Badge
              variant={
                isReady ? 'default' : isFailed ? 'destructive' : 'secondary'
              }
            >
              {SESSION_STATUS_LABEL[session.status]}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Hồ sơ</p>
            <p className="font-medium">{session.profile.headline ?? `#${session.profile.id}`}</p>
          </div>
          <div>
            <p className="text-muted-foreground">JD</p>
            <p className="font-medium">{session.jobDescription.title}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Độ khó</p>
            <p className="font-medium">{INTERVIEW_DIFFICULTY_LABEL[session.difficulty]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Hình thức</p>
            <p className="font-medium">{SESSION_MODE_LABEL[session.mode]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tiến độ câu hỏi</p>
            <p className="font-medium">
              {isGenerating
                ? 'Đang sinh câu hỏi...'
                : isReady
                  ? `${session.totalQuestionCount} câu hỏi (chưa trả lời)`
                  : isFailed && session.totalQuestionCount === 0
                    ? 'Chưa sinh được câu hỏi'
                    : `${session.answeredQuestionCount}/${session.totalQuestionCount} câu đã trả lời`}
            </p>
          </div>
        </div>

        {session.statusMessage ? (
          <p className="text-sm text-destructive">{session.statusMessage}</p>
        ) : null}

        {isFailed ? (
          <Button
            variant="outline"
            className="w-fit"
            onClick={() => void handleRetry()}
            disabled={retrySession.isPending}
          >
            <RefreshCw className="size-4" />
            {retrySession.isPending ? 'Đang thử lại...' : 'Thử lại sinh câu hỏi'}
          </Button>
        ) : null}

        {isReady ? (
          <Button
            className="w-fit gap-2"
            onClick={() => void handleStart()}
            disabled={startSession.isPending}
          >
            {startSession.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Đang bắt đầu...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Bắt đầu phỏng vấn ngay
              </>
            )}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
