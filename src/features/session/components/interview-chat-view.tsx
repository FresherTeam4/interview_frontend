import { useEffect, useRef } from 'react'
import { Bot, User } from 'lucide-react'
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
                {turn.content || (turn as unknown as { contentText?: string; text?: string }).contentText || (turn as unknown as { text?: string }).text}
              </div>
            </div>
          </div>
        )
      })}

      {statusMessage ? (
        <p className="text-center text-xs text-destructive py-1">{statusMessage}</p>
      ) : null}

      <div ref={bottomRef} />
    </div>
  )
}
