import { useEffect, useRef } from 'react'
import { Bot, Loader2, Square, User, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTurnAudioPlayer } from '@/hooks/use-turn-audio-player'
import { cn } from '@/lib/utils'
import type { Turn } from '@/types/session'

interface InterviewChatViewProps {
  sessionId: number
  turns: Turn[]
  isEvaluating: boolean
  statusMessage?: string | null
  autoPlayLatest?: boolean
}

export default function InterviewChatView({
  sessionId,
  turns,
  isEvaluating,
  statusMessage,
  autoPlayLatest = false,
}: InterviewChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const playedTurnIdsRef = useRef<Set<number>>(new Set())
  const { playingTurnId, loadingTurnId, playTurn, stopAudio } = useTurnAudioPlayer(sessionId)

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
    if (!autoPlayLatest || isEvaluating) return

    const interviewerTurns = turns.filter((t) => t.role === 'INTERVIEWER' && t.id)
    if (interviewerTurns.length === 0) return

    const latestTurn = interviewerTurns[interviewerTurns.length - 1]

    if (latestTurn?.id && !playedTurnIdsRef.current.has(latestTurn.id)) {
      playedTurnIdsRef.current.add(latestTurn.id)
      void playTurn(latestTurn.id)
    }
  }, [turns, autoPlayLatest, isEvaluating, playTurn])

  return (
    <div className="flex flex-col gap-4 py-2">
      {turns.map((turn, index) => {
        const isInterviewer = turn.role === 'INTERVIEWER'
        const isPlaying = playingTurnId === turn.id
        const isLoading = loadingTurnId === turn.id

        return (
          <div
            key={turn.id ?? index}
            className={cn(
              'flex gap-3 max-w-[90%] sm:max-w-[80%]',
              isInterviewer ? 'self-start' : 'self-end flex-row-reverse',
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'flex size-9 shrink-0 items-center justify-center rounded-xl font-medium text-xs shadow-xs',
                isInterviewer
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground border',
              )}
            >
              {isInterviewer ? <Bot className="size-5" /> : <User className="size-5" />}
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
                <span>
                  {new Date(turn.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                {isInterviewer && turn.id ? (
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
              </div>
            </div>
          </div>
        )
      })}

      {/* AI Thinking Indicator (Image 2 style: clean compact bubble with 3 jumping dots) */}
      {isEvaluating && (
        <div className="flex gap-3 max-w-[90%] sm:max-w-[80%] self-start animate-in fade-in-50 duration-200">
          {/* Avatar */}
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl font-medium text-xs shadow-xs bg-primary text-primary-foreground">
            <Bot className="size-5" />
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

