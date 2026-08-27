import { useEffect, useRef } from 'react'
import { Bot, CornerDownRight, Loader2, Sparkles, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Turn } from '@/types/session'

interface InterviewChatViewProps {
  turns: Turn[]
  isEvaluating: boolean
  statusMessage?: string | null
}

export default function InterviewChatView({
  turns,
  isEvaluating,
  statusMessage,
}: InterviewChatViewProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, isEvaluating])

  return (
    <div className="flex flex-col gap-4 py-2">
      {turns.map((turn, index) => {
        const isInterviewer = turn.role === 'INTERVIEWER'

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
            <div className="flex flex-col gap-1">
              <div
                className={cn(
                  'flex items-center gap-2 text-xs text-muted-foreground',
                  isInterviewer ? 'justify-start' : 'justify-end',
                )}
              >
                <span className="font-semibold text-foreground">
                  {isInterviewer ? 'Người phỏng vấn (AI)' : 'Bạn'}
                </span>
                {turn.isFollowUp ? (
                  <Badge variant="outline" className="text-[10px] gap-1 py-0 border-primary/30 text-primary">
                    <CornerDownRight className="size-3" />
                    Hỏi đào sâu #{turn.followUpDepth}
                  </Badge>
                ) : null}
                <span>
                  {new Date(turn.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div
                className={cn(
                  'rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-xs',
                  isInterviewer
                    ? 'rounded-tl-xs bg-muted/70 text-foreground border'
                    : 'rounded-tr-xs bg-primary text-primary-foreground',
                )}
              >
                {turn.content}
              </div>
            </div>
          </div>
        )
      })}

      {/* AI Evaluating Indicator */}
      {isEvaluating ? (
        <div className="flex gap-3 max-w-[85%] self-start animate-in fade-in-0 duration-200">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="size-5 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-muted-foreground">Người phỏng vấn (AI)</span>
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary shrink-0" />
              <span>AI đang phân tích câu trả lời và chuẩn bị phản hồi...</span>
            </div>
          </div>
        </div>
      ) : null}

      {statusMessage ? (
        <p className="text-center text-xs text-destructive py-1">{statusMessage}</p>
      ) : null}

      <div ref={bottomRef} />
    </div>
  )
}
