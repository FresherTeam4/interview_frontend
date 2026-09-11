import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  PhoneOff,
  Radio,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { QUERY_KEYS } from '@/constants/query-keys'
import { RealtimeBackendClient } from '@/features/session/realtime/backend-client'
import {
  VoiceRealtimeInterview,
  type RealtimeConnectionState,
} from '@/features/session/realtime/voice-realtime-interview'
import { cn } from '@/lib/utils'
import type { InterviewSession } from '@/types/session'

function isCandidateEndIntent(text?: string): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  const patterns = [
    'kết thúc phỏng vấn',
    'kết thúc buổi phỏng vấn',
    'dừng phỏng vấn',
    'dừng buổi phỏng vấn',
    'tôi muốn kết thúc',
    'em muốn kết thúc',
    'mình muốn kết thúc',
    'xin phép kết thúc',
    'xin phép dừng',
    'kết thúc ở đây',
    'kết thúc tại đây',
    'dừng ở đây',
    'dừng tại đây',
    'hết câu hỏi',
    'không còn câu hỏi',
    'chào tạm biệt',
    'tạm biệt bạn',
    'tạm biệt anh',
    'tạm biệt chị',
    'end interview',
    'finish interview',
  ]
  return patterns.some((p) => lower.includes(p))
}

function isAiClosingStatement(text?: string): boolean {
  if (!text) return false
  const lower = text.toLowerCase()
  const patterns = [
    'kết thúc tại đây',
    'kết thúc ở đây',
    'đến đây là kết thúc',
    'kết thúc buổi phỏng vấn',
    'cảm ơn bạn đã tham gia',
    'cảm ơn bạn đã dành thời gian',
    'chúc bạn một ngày tốt lành',
    'chúc bạn nhiều thành công',
    'kết quả phỏng vấn sẽ',
    'bộ phận nhân sự sẽ',
    'kết quả sẽ được gửi',
    'tạm biệt bạn',
    'hẹn gặp lại bạn',
  ]
  return patterns.some((p) => lower.includes(p))
}

interface InterviewRealtimeRoomProps {
  session: InterviewSession
  onFallbackRequested?: () => void
}

export default function InterviewRealtimeRoom({
  session,
  onFallbackRequested,
}: InterviewRealtimeRoomProps) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<RealtimeConnectionState>('CONNECTING')
  const [draftTranscript, setDraftTranscript] = useState('')
  const [userVolume, setUserVolume] = useState(0)
  const [aiVolume, setAiVolume] = useState(0)
  const [isAiSpeaking, setIsAiSpeaking] = useState(false)
  const [isUserSpeaking, setIsUserSpeaking] = useState(false)
  const [wasInterrupted, setWasInterrupted] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const interruptedTimerRef = useRef<number | null>(null)
  const userSpeakingTimerRef = useRef<number | null>(null)
  const aiSpeakingTimerRef = useRef<number | null>(null)
  const userRequestedEndRef = useRef(false)
  const isAutoFinishingRef = useRef(false)

  const backend = useMemo(() => new RealtimeBackendClient(), [])

  const realtimeRef = useRef<VoiceRealtimeInterview | null>(null)
  const handleFinishRef = useRef<(() => Promise<void>) | null>(null)

  const handleFinish = useCallback(async () => {
    if (!realtimeRef.current || isFinishing) return
    setIsFinishing(true)
    try {
      await realtimeRef.current.finish()
      toast.success('Đã hoàn tất phiên phỏng vấn. Đang chuyển sang chấm điểm...')
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(session.id) })
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Không thể kết thúc phiên.')
      setIsFinishing(false)
    }
  }, [isFinishing, queryClient, session.id])

  handleFinishRef.current = handleFinish

  useEffect(() => {
    let mounted = true

    const realtime = new VoiceRealtimeInterview(
      backend,
      {
        onState: (newState) => {
          if (!mounted) return
          setState(newState)
          if (newState === 'FALLBACK') {
            toast.info('Đã chuyển sang chế độ phỏng vấn theo lượt.')
            void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(session.id) })
            onFallbackRequested?.()
          }
        },
        onPartialUserTranscript: (text) => {
          if (!mounted) return
          setDraftTranscript(text)
          if (isCandidateEndIntent(text)) {
            userRequestedEndRef.current = true
          }
        },
        onTurn: (turn) => {
          if (!mounted) return
          setDraftTranscript('')
          if (turn.interrupted) {
            setWasInterrupted(true)
            setIsAiSpeaking(false)
            if (aiSpeakingTimerRef.current !== null) {
              window.clearTimeout(aiSpeakingTimerRef.current)
              aiSpeakingTimerRef.current = null
            }
            if (interruptedTimerRef.current) window.clearTimeout(interruptedTimerRef.current)
            interruptedTimerRef.current = window.setTimeout(() => {
              if (mounted) setWasInterrupted(false)
            }, 2500)
          }
          // Invalidate session to display newly confirmed turns in chat history
          void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(session.id) })

          // Tự động kết thúc nếu ứng viên yêu cầu hoặc AI chào kết thúc
          const candidateSaidEnd = isCandidateEndIntent(turn.userTranscript) || userRequestedEndRef.current
          const aiSaidFarewell = isAiClosingStatement(turn.assistantTranscript)

          if (candidateSaidEnd || aiSaidFarewell) {
            if (!isAutoFinishingRef.current) {
              isAutoFinishingRef.current = true
              toast.info('Đã nhận diện yêu cầu kết thúc. Đang chờ AI phát lời chào tạm biệt...')
              void (async () => {
                // Đợi AI phát xong toàn bộ âm thanh lời chào kết thúc
                await realtime.whenPlaybackIdle()
                await new Promise((r) => setTimeout(r, 1200))
                if (mounted) {
                  await handleFinishRef.current?.()
                }
              })()
            }
          }
        },
        onError: (err) => {
          if (!mounted) return
          console.error('[Realtime Voice Error]', err)
          toast.error(err.message || 'Lỗi kết nối âm thanh thời gian thực.')
        },
        onUserVolume: (vol) => {
          if (!mounted) return
          setUserVolume(vol)
          if (vol > 0.05) {
            if (userSpeakingTimerRef.current !== null) {
              window.clearTimeout(userSpeakingTimerRef.current)
              userSpeakingTimerRef.current = null
            }
            setIsUserSpeaking(true)
          } else {
            // Giữ trạng thái đang phát biểu 600ms chống nhấp nháy giữa các âm tiết và quãng ngắt
            if (userSpeakingTimerRef.current === null) {
              userSpeakingTimerRef.current = window.setTimeout(() => {
                if (mounted) setIsUserSpeaking(false)
                userSpeakingTimerRef.current = null
              }, 600)
            }
          }
        },
        onAiVolume: (vol) => {
          if (!mounted) return
          setAiVolume(vol)
          if (vol > 0.03) {
            if (aiSpeakingTimerRef.current !== null) {
              window.clearTimeout(aiSpeakingTimerRef.current)
              aiSpeakingTimerRef.current = null
            }
            setIsAiSpeaking(true)
          } else {
            // Giữ trạng thái AI đang nói 500ms chống tắt sớm giữa câu
            if (aiSpeakingTimerRef.current === null) {
              aiSpeakingTimerRef.current = window.setTimeout(() => {
                if (mounted) setIsAiSpeaking(false)
                aiSpeakingTimerRef.current = null
              }, 500)
            }
          }
        },
      },
      {
        workletUrl: '/pcm16-capture-worklet.js',
        maxResumeAttempts: 2,
      },
    )

    realtimeRef.current = realtime

    // Start session
    realtime
      .start(session.id, session.realtimeVoiceName || undefined)
      .catch((err) => {
        if (!mounted) return
        toast.error(err.message || 'Không thể bắt đầu phỏng vấn thời gian thực.')
      })

    return () => {
      mounted = false
      if (interruptedTimerRef.current) window.clearTimeout(interruptedTimerRef.current)
      if (userSpeakingTimerRef.current) window.clearTimeout(userSpeakingTimerRef.current)
      if (aiSpeakingTimerRef.current) window.clearTimeout(aiSpeakingTimerRef.current)
      void realtime.stop(false)
    }
  }, [backend, onFallbackRequested, queryClient, session.id, session.realtimeVoiceName])

  return (
    <Card className="overflow-hidden border shadow-sm bg-gradient-to-b from-card via-card to-muted/20">
      <CardContent className="p-4 sm:p-6 flex flex-col gap-6">
        {/* Top Realtime Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Radio className={cn('size-4', state === 'LIVE' && 'animate-pulse')} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">Phỏng vấn giọng nói trực tiếp</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-semibold transition-colors',
                    state === 'LIVE'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : state === 'CONNECTING'
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                        : state === 'RECONNECTING'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 animate-pulse'
                          : 'border-muted text-muted-foreground',
                  )}
                >
                  {state === 'LIVE'
                    ? '● Trực tiếp (Live)'
                    : state === 'CONNECTING'
                      ? 'Đang kết nối...'
                      : state === 'RECONNECTING'
                        ? 'Đang nối lại kết nối...'
                        : state === 'FALLBACK'
                          ? 'Đã chuyển chế độ'
                          : 'Đã dừng'}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Giao tiếp 2 chiều siêu tốc với AI • Tự động phát hiện giọng nói & ngắt lời khi nói
              </p>
            </div>
          </div>

          {/* Finish Action Button */}
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleFinish()}
              disabled={isFinishing}
              className="gap-1.5 text-xs h-8 shadow-xs"
            >
              {isFinishing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <PhoneOff className="size-3.5" />
              )}
              <span>Kết thúc phỏng vấn</span>
            </Button>
          </div>
        </div>

        {/* Dynamic Waveform & Voice Activity Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* AI Side */}
          <div
            className={cn(
              'flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 min-h-[160px] relative overflow-hidden',
              isAiSpeaking
                ? 'border-primary/50 bg-primary/[0.04] shadow-sm ring-1 ring-primary/20'
                : 'border-border/60 bg-muted/20',
            )}
          >
            <div className="relative mb-3">
              <div
                className={cn(
                  'flex size-20 items-center justify-center rounded-2xl transition-all duration-300 overflow-hidden border-2',
                  isAiSpeaking
                    ? 'border-primary shadow-lg scale-105 ring-4 ring-primary/25'
                    : 'border-border/80 shadow-xs',
                )}
              >
                <img
                  src="/ai-avatar.jpg"
                  alt="Người phỏng vấn AI"
                  className="size-full object-cover"
                />
              </div>
              {isAiSpeaking && (
                <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-primary" />
                </span>
              )}
            </div>

            <span className="text-xs font-semibold text-foreground mb-1">Người phỏng vấn AI</span>
            <span className="text-[11px] text-muted-foreground">
              {isAiSpeaking ? 'Đang nói...' : 'Đang lắng nghe bạn'}
            </span>

            {/* AI Audio Bars */}
            <div className="flex items-center gap-1 mt-3 h-5">
              {[0.4, 0.8, 1, 0.7, 0.5, 0.9, 0.6].map((scale, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-1 rounded-full transition-all duration-150',
                    isAiSpeaking ? 'bg-primary' : 'bg-muted-foreground/30',
                  )}
                  style={{
                    height: isAiSpeaking
                      ? `${Math.max(6, Math.min(22, Math.max(aiVolume, 0.25) * 24 * scale))}px`
                      : '4px',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Candidate Side */}
          <div
            className={cn(
              'flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 min-h-[160px] relative overflow-hidden',
              isUserSpeaking
                ? 'border-emerald-500/50 bg-emerald-500/[0.04] shadow-sm ring-1 ring-emerald-500/20'
                : 'border-border/60 bg-muted/20',
            )}
          >
            <div className="relative mb-3">
              <div
                className={cn(
                  'flex size-20 items-center justify-center rounded-2xl transition-all duration-300 overflow-hidden border-2',
                  isUserSpeaking
                    ? 'border-emerald-500 shadow-lg scale-105 ring-4 ring-emerald-500/25'
                    : 'border-border/80 shadow-xs',
                )}
              >
                <img
                  src="/candidate.png"
                  alt="Ứng viên"
                  className="size-full object-cover"
                />
              </div>
              {isUserSpeaking && (
                <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500" />
                </span>
              )}
            </div>

            <span className="text-xs font-semibold text-foreground mb-1">Bạn (Ứng viên)</span>
            <span className="text-[11px] text-muted-foreground">
              {isUserSpeaking ? 'Đang phát biểu...' : 'Micro đang mở • Hãy nói tự nhiên'}
            </span>

            {/* Candidate Audio Bars */}
            <div className="flex items-center gap-1 mt-3 h-5">
              {[0.5, 0.9, 0.6, 1, 0.8, 0.4, 0.7].map((scale, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-1 rounded-full transition-all duration-150',
                    isUserSpeaking ? 'bg-emerald-500' : 'bg-muted-foreground/30',
                  )}
                  style={{
                    height: isUserSpeaking
                      ? `${Math.max(6, Math.min(22, Math.max(userVolume, 0.25) * 24 * scale))}px`
                      : '4px',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Interim Transcript or Interruption Notice */}
        {(wasInterrupted || draftTranscript) && (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 p-3.5 sm:p-4 min-h-[50px] flex items-center justify-center animate-in fade-in duration-200">
            {wasInterrupted ? (
              <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                <Sparkles className="size-4 shrink-0" />
                <span>AI đã dừng nói để lắng nghe câu hỏi/ý kiến của bạn (Barge-in).</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground w-full">
                <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-muted-foreground shrink-0">Đang nhận diện:</span>
                <p className="font-normal italic truncate text-foreground flex-1">
                  "{draftTranscript}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Conversation History Drawer/Accordion */}
        {session.turns && session.turns.length > 0 && (
          <div className="pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="flex items-center justify-between w-full py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="size-3.5 text-primary" />
                <span>Lịch sử câu hỏi & trao đổi ({session.turns.length} lượt)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span>{showHistory ? 'Thu gọn' : 'Xem lại câu hỏi'}</span>
                {showHistory ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </div>
            </button>

            {showHistory && (
              <div className="mt-3 max-h-[260px] overflow-y-auto rounded-xl border bg-muted/20 p-3 space-y-3 no-scrollbar animate-in fade-in duration-200">
                {session.turns.map((turn) => (
                  <div
                    key={turn.id || turn.turnIndex}
                    className={cn(
                      'flex flex-col gap-1 p-3 rounded-xl text-xs leading-relaxed max-w-[85%]',
                      turn.role === 'INTERVIEWER'
                        ? 'bg-card border border-border/80 self-start text-foreground'
                        : 'bg-primary/10 border border-primary/20 self-end ml-auto text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground">
                      {turn.role === 'INTERVIEWER' ? (
                        <>
                          <img src="/ai-avatar.jpg" alt="AI" className="size-3.5 rounded-full object-cover shrink-0" />
                          <span>Người phỏng vấn AI</span>
                        </>
                      ) : (
                        <>
                          <img src="/candidate.png" alt="Bạn" className="size-3.5 rounded-full object-cover shrink-0" />
                          <span>Bạn (Ứng viên)</span>
                        </>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{turn.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
