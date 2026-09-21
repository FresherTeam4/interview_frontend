import { useEffect, useRef } from 'react'
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/api/api-error'
import { useRetrySession, useStartSession } from '@/hooks/use-interview-session'
import {
  INTERVIEW_DIFFICULTY_LABEL,
  SESSION_MODE_LABEL,
  SESSION_STATUS,
  SESSION_STATUS_LABEL,
} from '@/constants/session'
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

  // Thông báo khi AI hoàn tất chuẩn bị hoặc gặp lỗi
  const prevStatusRef = useRef(session.status)
  useEffect(() => {
    if (prevStatusRef.current !== session.status) {
      if (session.status === SESSION_STATUS.READY) {
        toast.success('Phòng phỏng vấn đã sẵn sàng! Bạn có thể bắt đầu ngay.')
      } else if (session.status === SESSION_STATUS.FAILED) {
        toast.error('Quá trình thiết lập kế hoạch phỏng vấn gặp sự cố.')
      }
      prevStatusRef.current = session.status
    }
  }, [session.status])

  async function handleRetry() {
    try {
      await retrySession.mutateAsync({ expectedVersion: session.version })
      toast.success('Đã gửi yêu cầu thử lại chuẩn bị phiên phỏng vấn.')
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
            ? 'Đang thiết lập kế hoạch phỏng vấn...'
            : isReady
              ? 'Phòng phỏng vấn đã sẵn sàng.'
              : isFailed
                ? 'Thiết lập phiên gặp sự cố.'
                : SESSION_STATUS_LABEL[session.status]}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
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
            <p className="text-muted-foreground">Hình thức</p>
            <p className="font-medium">
              {SESSION_MODE_LABEL[session.mode] || session.mode}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Độ khó</p>
            <p className="font-medium">{INTERVIEW_DIFFICULTY_LABEL[session.difficulty]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Trạng thái đối thoại</p>
            <p className="font-medium">
              {isGenerating
                ? 'AI đang phân tích hồ sơ & JD...'
                : isReady
                  ? 'Sẵn sàng phỏng vấn tự do'
                  : isFailed
                    ? 'Quá trình chuẩn bị gặp sự cố'
                    : 'Đang tương tác thích ứng theo CV & JD'}
            </p>
          </div>
        </div>

        {isGenerating && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs">
            <Loader2 className="size-4 animate-spin text-primary shrink-0" />
            <div className="space-y-0.5">
              <p className="font-semibold text-foreground">AI đang thiết lập kế hoạch phỏng vấn</p>
              <p className="text-muted-foreground">
                Hệ thống đang phân tích CV và tiêu chí JD để xác định các trọng tâm đánh giá phù hợp. Trang sẽ tự động sẵn sàng trong giây lát.
              </p>
            </div>
          </div>
        )}

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
            {retrySession.isPending ? 'Đang thử lại...' : 'Thử chuẩn bị lại'}
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
