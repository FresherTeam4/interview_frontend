import { useState, type KeyboardEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowUp, Loader2, Play, RefreshCw, RotateCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/api/api-error'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useResumeSession, useRetrySession, useSubmitTextAnswer } from '@/hooks/use-interview-session'
import { cn } from '@/lib/utils'
import type { InterviewSession } from '@/types/session'

interface InterviewAnswerInputProps {
  session: InterviewSession
}

export default function InterviewAnswerInput({ session }: InterviewAnswerInputProps) {
  const [content, setContent] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()
  const submitAnswer = useSubmitTextAnswer(session.id)
  const resumeSession = useResumeSession(session.id)
  const retrySession = useRetrySession(session.id)

  const isPaused = session.status === 'PAUSED'
  const isEngineRetry = session.awaitingAction === 'ENGINE_RETRY'
  const isFailed = session.status === 'FAILED' || isEngineRetry

  // Tìm turnIndex và turnId của lượt phỏng vấn hiện tại
  const lastInterviewerTurn = [...session.turns].reverse().find((t) => t.role === 'INTERVIEWER')
  const expectedTurnIndex =
    session.currentTurnIndex ?? lastInterviewerTurn?.turnIndex ?? 0
  const promptTurnId = session.currentPrompt?.turnId ?? lastInterviewerTurn?.id ?? 0

  async function handleSubmit() {
    if (!content.trim() || submitAnswer.isPending) return

    const clientTurnId = crypto.randomUUID()
    const answerText = content.trim()
    setContent('')
    try {
      await submitAnswer.mutateAsync({
        promptTurnId,
        expectedTurnIndex,
        content: answerText,
        clientTurnId,
        expectedVersion: session.version,
      })
    } catch (error) {
      toast.error(getErrorMessage(error))
      setContent(answerText)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      void handleSubmit()
    }
  }

  async function handleResume() {
    try {
      await resumeSession.mutateAsync({ expectedVersion: session.version })
      toast.success('Đã tiếp tục buổi phỏng vấn.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRetry() {
    try {
      await retrySession.mutateAsync({ expectedVersion: session.version })
      toast.success('Đang thử lại phân tích câu trả lời...')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(session.id) })
      toast.success('Đã làm mới dữ liệu phiên phỏng vấn.')
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isFailed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-center shadow-xs">
        <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            {session.statusMessage
              ? `Hệ thống: ${session.statusMessage}`
              : 'Quá thời gian phản hồi hoặc AI gặp sự cố tạm thời.'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground max-w-lg">
          Lượt trả lời của bạn đã được lưu lại trên máy chủ. Bạn có thể bấm &ldquo;Thử lại lượt này&rdquo; để yêu cầu AI tiếp tục xử lý hoặc bấm &ldquo;Làm mới dữ liệu&rdquo; để cập nhật trạng thái mới nhất.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Button
            variant="default"
            size="sm"
            onClick={() => void handleRetry()}
            disabled={retrySession.isPending}
            className="gap-1.5 text-xs font-medium"
          >
            {retrySession.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Đang thử lại...
              </>
            ) : (
              <>
                <RefreshCw className="size-3.5" />
                Thử lại lượt này
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="gap-1.5 text-xs font-medium"
          >
            <RotateCw className={cn('size-3.5', isRefreshing && 'animate-spin')} />
            Làm mới dữ liệu
          </Button>
        </div>
      </div>
    )
  }

  if (isPaused) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Phiên phỏng vấn đang tạm dừng. Hãy bấm nút bên dưới khi bạn đã sẵn sàng tiếp tục.
        </p>
        <Button onClick={() => void handleResume()} disabled={resumeSession.isPending} className="gap-2">
          {resumeSession.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
          Tiếp tục phỏng vấn
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex items-end gap-2 rounded-2xl border bg-card p-1.5 shadow-xs focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nhập câu trả lời của bạn... (nhấn Ctrl + Enter để gửi)"
        disabled={submitAnswer.isPending}
        rows={1}
        className="flex-1 resize-none border-0 bg-transparent py-1 px-2.5 shadow-none focus-visible:ring-0 text-sm leading-relaxed min-h-[36px] max-h-[140px]"
      />

      <div className="flex items-center gap-1.5 shrink-0 pb-0.5 pr-0.5">
        {content.length > 0 ? (
          <span className="text-[11px] text-muted-foreground mr-1 select-none">
            {content.length} ký tự
          </span>
        ) : null}

        <Button
          size="icon"
          onClick={() => void handleSubmit()}
          disabled={!content.trim() || submitAnswer.isPending}
          className="size-8 rounded-xl shrink-0 shadow-xs"
          title="Gửi câu trả lời (Ctrl + Enter)"
        >
          {submitAnswer.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ArrowUp className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
