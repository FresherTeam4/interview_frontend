import { useState, type KeyboardEvent } from 'react'
import { AlertCircle, ArrowUp, Loader2, Play, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/api/api-error'
import { useResumeSession, useRetrySession, useSubmitTextAnswer } from '@/hooks/use-interview-session'
import type { InterviewSession } from '@/types/session'

interface InterviewAnswerInputProps {
  session: InterviewSession
}

export default function InterviewAnswerInput({ session }: InterviewAnswerInputProps) {
  const [content, setContent] = useState('')
  const submitAnswer = useSubmitTextAnswer(session.id)
  const resumeSession = useResumeSession(session.id)
  const retrySession = useRetrySession(session.id)

  const isPaused = session.status === 'PAUSED'
  const isFailed = session.status === 'FAILED'
  const isEvaluating =
    session.status === 'IN_PROGRESS' && session.awaitingAction === 'ENGINE_RESPONSE'
  const isWaitingAnswer =
    session.status === 'IN_PROGRESS' && session.awaitingAction === 'CANDIDATE_ANSWER'

  // Tìm turnId của câu hỏi hiện tại
  const promptTurnId =
    session.currentPrompt?.turnId ??
    [...session.turns].reverse().find((t) => t.role === 'INTERVIEWER')?.id

  async function handleSubmit() {
    if (!content.trim() || !promptTurnId) return

    const clientTurnId = crypto.randomUUID()
    try {
      await submitAnswer.mutateAsync({
        promptTurnId,
        content: content.trim(),
        clientTurnId,
        expectedVersion: session.version,
      })
      setContent('')
    } catch (error) {
      toast.error(getErrorMessage(error))
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

  if (isFailed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
        <div className="flex items-center gap-2 text-destructive text-sm font-medium">
          <AlertCircle className="size-4 shrink-0" />
          <span>{session.statusMessage ?? 'Đã xảy ra sự cố khi xử lý câu trả lời.'}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleRetry()}
          disabled={retrySession.isPending}
          className="gap-1.5 text-xs"
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
    <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 shadow-xs">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isEvaluating
            ? 'AI đang suy nghĩ và chuẩn bị phản hồi...'
            : 'Nhập câu trả lời của bạn ở đây (nhấn Ctrl + Enter để gửi)...'
        }
        disabled={!isWaitingAnswer || submitAnswer.isPending || isEvaluating}
        rows={4}
        className="resize-none border-0 shadow-none focus-visible:ring-0 text-sm leading-relaxed p-1"
      />

      <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
        <span className="hidden sm:inline">Nhấn Ctrl + Enter để gửi nhanh câu trả lời</span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs">{content.length} ký tự</span>
          <Button
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={!content.trim() || !isWaitingAnswer || submitAnswer.isPending || !promptTurnId}
            className="gap-1.5"
          >
            {submitAnswer.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <span>Gửi trả lời</span>
                <ArrowUp className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
