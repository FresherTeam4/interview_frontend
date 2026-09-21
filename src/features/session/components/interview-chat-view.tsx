import { useEffect, useRef } from 'react'
import { Loader2, RefreshCw, Square, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useTurnAudioPlayer } from '@/hooks/use-turn-audio-player'
import { useRetryTurn } from '@/hooks/use-interview-session'
import { getErrorMessage } from '@/api/api-error'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/format'
import type { SessionMode, Turn } from '@/types/session'

interface InterviewChatViewProps {
  sessionId: number
  turns: Turn[]
  isEvaluating: boolean
  statusMessage?: string | null
  autoPlayLatest?: boolean
  sessionMode?: SessionMode
  onAudioPlaybackChange?: (isPlaying: boolean) => void
}

export default function InterviewChatView({
  sessionId,
  turns,
  isEvaluating,
  statusMessage,
  autoPlayLatest = false,
  sessionMode,
  onAudioPlaybackChange,
}: InterviewChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const playedTurnIdsRef = useRef<Set<number>>(new Set())
  const { playingTurnId, loadingTurnId, playTurn, stopAudio } = useTurnAudioPlayer(sessionId)
  const retryTurnMutation = useRetryTurn(sessionId)

  async function handleRetryCandidateTurn(turnId: number) {
    try {
      await retryTurnMutation.mutateAsync(turnId)
      toast.success('Đã gửi lại câu trả lời thành công')
    } catch (err) {
      toast.error('Thử lại lượt trả lời thất bại: ' + getErrorMessage(err))
    }
  }

  // Notify parent component when audio playback status changes
  useEffect(() => {
    const isPlaying = playingTurnId !== null || loadingTurnId !== null
    onAudioPlaybackChange?.(isPlaying)
  }, [playingTurnId, loadingTurnId, onAudioPlaybackChange])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, isEvaluating])

  // Stop current audio playback when candidate submits an answer (isEvaluating = true)
  useEffect(() => {
    if (isEvaluating) {
      stopAudio()
    }
  }, [isEvaluating, stopAudio])

  // Directly auto-play the newest interviewer question as soon as it arrives
  useEffect(() => {
    if (!autoPlayLatest || isEvaluating || sessionMode !== 'TURN_BASED') return

    const interviewerTurns = turns.filter((t) => t.role === 'INTERVIEWER' && t.id)
    if (interviewerTurns.length === 0) return

    const latestTurn = interviewerTurns[interviewerTurns.length - 1]

    if (latestTurn?.id && !playedTurnIdsRef.current.has(latestTurn.id)) {
      playedTurnIdsRef.current.add(latestTurn.id)
      void playTurn(latestTurn.id)
    }
  }, [turns, autoPlayLatest, isEvaluating, sessionMode, playTurn])

  return (
    <div className="flex flex-col gap-4 py-2">
      {turns.map((turn, index) => {
        const isInterviewer = turn.role === 'INTERVIEWER'
        const isPlaying = playingTurnId === turn.id
        const isLoading = loadingTurnId === turn.id

        return (
          <div
            key={`${turn.id ?? 'turn'}-${turn.turnIndex ?? index}-${turn.role}`}
            className={cn(
              'flex gap-3 max-w-[90%] sm:max-w-[80%]',
              isInterviewer ? 'self-start' : 'self-end flex-row-reverse',
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-xl font-medium text-xs shadow-xs overflow-hidden',
                isInterviewer
                  ? 'border border-primary/30 ring-1 ring-primary/20 bg-primary/5'
                  : 'border border-border/80 ring-1 ring-border/30 bg-muted/40',
              )}
            >
              {isInterviewer ? (
                <img src="/ai-avatar.jpg" alt="AI Chatbot" className="size-full object-cover" />
              ) : (
                <img src="/candidate.png" alt="Bạn" className="size-full object-cover" />
              )}
            </div>

            {/* Bubble */}
            <div className="flex flex-col gap-1 max-w-full">
              <div
                className={cn(
                  'flex items-center gap-2 text-xs text-muted-foreground',
                  isInterviewer ? 'justify-start' : 'justify-end',
                )}
              >
                <span className="font-semibold text-foreground">
                  {isInterviewer ? 'Người phỏng vấn (AI)' : 'Bạn'}
                </span>
                <span>{formatTime(turn.createdAt)}</span>

                {isInterviewer && turn.id && sessionMode === 'TURN_BASED' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => void playTurn(turn.id)}
                    disabled={isLoading}
                    className={cn(
                      'size-6 rounded-full transition-all shrink-0 ml-0.5',
                      isPlaying
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/10',
                    )}
                    title={
                      isPlaying
                        ? 'Dừng đọc câu hỏi'
                        : 'Nghe giọng đọc AI cho câu hỏi này'
                    }
                  >
                    {isLoading ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : isPlaying ? (
                      <Square className="size-2.5 fill-current" />
                    ) : (
                      <Volume2 className="size-3.5" />
                    )}
                  </Button>
                ) : null}
              </div>

              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-xs transition-colors',
                  isInterviewer
                    ? cn(
                        'rounded-tl-xs bg-muted/70 text-foreground border',
                        isPlaying && 'border-primary/50 ring-1 ring-primary/20 bg-primary/5',
                      )
                    : 'rounded-tr-xs bg-primary text-primary-foreground',
                )}
              >
                {turn.content ||
                  (turn as unknown as { contentText?: string; text?: string }).contentText ||
                  (turn as unknown as { text?: string }).text}

                {/* Sound wave visualizer when question audio is active */}
                {isPlaying && (
                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-primary/20 text-xs text-primary font-medium select-none">
                    <Volume2 className="size-3.5 animate-pulse text-primary shrink-0" />
                    <span>Đang phát giọng đọc câu hỏi...</span>
                    <div className="flex items-center gap-0.5 ml-auto h-3">
                      <span className="w-0.5 bg-primary rounded-full animate-pulse h-2" />
                      <span className="w-0.5 bg-primary rounded-full animate-pulse h-3.5" />
                      <span className="w-0.5 bg-primary rounded-full animate-pulse h-2.5" />
                      <span className="w-0.5 bg-primary rounded-full animate-pulse h-1.5" />
                    </div>
                  </div>
                )}

                {/* Retry button if candidate turn failed */}
                {!isInterviewer && turn.processingStatus === 'FAILED' && (
                  <div className="flex items-center gap-2 justify-end mt-2 pt-1.5 border-t border-destructive/30 text-xs text-destructive">
                    <span className="text-[11px]">Lượt trả lời gặp lỗi xử lý</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => void handleRetryCandidateTurn(turn.id)}
                      disabled={retryTurnMutation.isPending}
                      className="h-6 px-2 text-[11px] gap-1 shrink-0 font-medium"
                    >
                      <RefreshCw className={cn('size-3', retryTurnMutation.isPending && 'animate-spin')} />
                      Thử lại lượt này
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* AI Thinking Indicator */}
      {isEvaluating && (
        <div className="flex gap-3 max-w-[90%] sm:max-w-[80%] self-start animate-in fade-in-50 duration-200">
          {/* Avatar */}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl font-medium text-xs shadow-xs overflow-hidden border border-primary/30 ring-1 ring-primary/20 bg-primary/5">
            <img src="/ai-avatar.jpg" alt="AI Chatbot" className="size-full object-cover" />
          </div>

          {/* Thinking bubble */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-start">
              <span className="font-semibold text-foreground">Người phỏng vấn (AI)</span>
            </div>

            <div className="rounded-2xl rounded-tl-xs bg-muted/80 text-foreground border px-4 py-3 shadow-xs w-fit">
              <div className="flex items-center gap-1.5 h-3.5 px-0.5">
                <span className="size-2 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                <span className="size-2 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                <span className="size-2 rounded-full bg-foreground/60 animate-bounce" />
              </div>
            </div>
          </div>
        </div>
      )}

      {statusMessage ? (
        <p className="text-center text-xs text-destructive py-1">{statusMessage}</p>
      ) : null}

      <div ref={bottomRef} />
    </div>
  )
}
