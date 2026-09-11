import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowRight, Award, Loader2, MessageSquare, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage } from '@/api/api-error'
import { useRetryScoring } from '@/hooks/use-interview-session'
import InterviewAnswerInput from '@/features/session/components/interview-answer-input'
import InterviewChatView from '@/features/session/components/interview-chat-view'
import InterviewRealtimeRoom from '@/features/session/components/interview-realtime-room'
import InterviewReportView from '@/features/session/components/interview-report-view'
import InterviewRoomHeader from '@/features/session/components/interview-room-header'
import { cn } from '@/lib/utils'
import type { InterviewSession } from '@/types/session'

interface InterviewRoomProps {
  session: InterviewSession
}

export default function InterviewRoom({ session }: InterviewRoomProps) {
  const isCompleted = session.status === 'COMPLETED'
  const isScoring = session.status === 'SCORING'
  const isFailed = session.status === 'SCORING_FAILED'
  const isFinished = isCompleted || isScoring || isFailed
  const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report')
  const isEvaluating =
    session.status === 'IN_PROGRESS' && session.awaitingAction === 'ENGINE_RESPONSE'

  const retryScoringMutation = useRetryScoring(session.id)

  // Track if audio is currently playing in InterviewChatView
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)

  // Track whether session was active when component first mounted
  // If user opened an already finished session, we show report immediately.
  // If user was actively in the session, we hold on chat view until AI stops talking AND scoring completes.
  const wasActiveOnMountRef = useRef(session.status !== 'COMPLETED' && session.status !== 'SCORING_FAILED')
  const [reportViewReady, setReportViewReady] = useState(!wasActiveOnMountRef.current)

  // Notify with toast if scoring fails
  const prevStatusRef = useRef(session.status)
  useEffect(() => {
    if (prevStatusRef.current !== session.status) {
      if (session.status === 'SCORING_FAILED') {
        toast.error(session.statusMessage || 'Quá trình chấm điểm phỏng vấn gặp sự cố!')
      }
      prevStatusRef.current = session.status
    }
  }, [session.status, session.statusMessage])

  // Auto-transition to report view once AI finishes speaking AND scoring completes
  useEffect(() => {
    if (wasActiveOnMountRef.current && isCompleted && !isAudioPlaying) {
      const timer = setTimeout(() => {
        setReportViewReady(true)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [isCompleted, isAudioPlaying])

  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('interview_auto_play_audio')
      return saved === null ? true : saved === 'true'
    } catch {
      return true
    }
  })

  const handleToggleAutoPlayAudio = () => {
    setAutoPlayAudio((prev) => {
      const next = !prev
      try {
        localStorage.setItem('interview_auto_play_audio', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  async function handleRetryScoring() {
    try {
      await retryScoringMutation.mutateAsync()
      toast.success('Đã gửi lại yêu cầu chấm điểm!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const turnCount = session.turns?.length || 0

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Compact Top Header Bar */}
      <InterviewRoomHeader
        session={session}
        autoPlayAudio={autoPlayAudio}
        onToggleAutoPlayAudio={handleToggleAutoPlayAudio}
      />

      {/* Main Room Content: 100% Screen Width */}
      {isFinished && reportViewReady ? (
        /* Finished State: Toggle between AI Report & Full Conversation */
        <div className="flex flex-col gap-4 w-full">
          {/* View Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 print:hidden">
            <div className="flex items-center gap-1.5 rounded-xl border bg-muted/30 p-1">
              <Button
                variant={activeTab === 'report' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('report')}
                className="gap-1.5 text-xs font-medium"
              >
                <Award className="size-3.5" />
                <span>Báo cáo đánh giá</span>
              </Button>
              <Button
                variant={activeTab === 'chat' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('chat')}
                className="gap-1.5 text-xs font-medium"
              >
                <MessageSquare className="size-3.5" />
                <span>Lịch sử đối thoại ({turnCount})</span>
              </Button>
            </div>
          </div>

          {/* Active Tab Content */}
          {activeTab === 'report' ? (
            <InterviewReportView
              session={session}
              onViewConversation={() => setActiveTab('chat')}
            />
          ) : (
            <Card className="flex flex-col overflow-hidden shadow-xs border min-h-[500px] max-h-[75vh]">
              <CardHeader className="py-3 px-4 sm:px-6 border-b shrink-0 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Lịch sử đối thoại của buổi phỏng vấn</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {turnCount} lượt trao đổi
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 min-h-0">
                <InterviewChatView
                  sessionId={session.id}
                  turns={session.turns}
                  isEvaluating={false}
                  statusMessage={session.statusMessage}
                  autoPlayLatest={false}
                  sessionMode={session.mode}
                  onAudioPlaybackChange={setIsAudioPlaying}
                />
              </CardContent>
            </Card>
          )}
        </div>
      ) : session.mode === 'VOICE_REALTIME' && !isFinished ? (
        /* Realtime Voice Room: Giao diện phòng thoại trực tiếp chuyên biệt, không lồng khung chat theo lượt */
        <InterviewRealtimeRoom session={session} />
      ) : (
        /* Turn-Based Interview State (Standard Chat View + Input / Scoring) */
        <div className="flex flex-col gap-4 w-full">
          <Card className="flex flex-col overflow-hidden shadow-xs border min-h-[480px] max-h-[66vh]">
            <CardContent className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 min-h-0">
              <InterviewChatView
                sessionId={session.id}
                turns={session.turns}
                isEvaluating={isEvaluating}
                statusMessage={
                  session.status === 'FAILED' || session.awaitingAction === 'ENGINE_RETRY'
                    ? session.statusMessage
                    : null
                }
                autoPlayLatest={isFinished || session.mode === 'VOICE_REALTIME' ? false : autoPlayAudio}
                sessionMode={session.mode}
                onAudioPlaybackChange={setIsAudioPlaying}
              />
            </CardContent>
          </Card>

          {isFinished ? (
            isFailed ? (
              /* Scoring Failed Error Box */
              <Card className="p-4 sm:p-5 border-destructive/40 bg-destructive/5 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive mt-0.5 sm:mt-0">
                      <AlertCircle className="size-5" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-destructive">
                          Quá trình chấm điểm gặp sự cố
                        </h4>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 font-medium">
                          SCORING_FAILED
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {session.statusMessage ||
                          'Hệ thống AI không thể hoàn tất phân tích nội dung phỏng vấn hoặc kết nối bị gián đoạn. Bạn có thể bấm Thử chấm điểm lại để AI phân tích lại.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleRetryScoring()}
                      disabled={retryScoringMutation.isPending}
                      className="gap-1.5 shadow-xs"
                    >
                      <RefreshCw className={cn('size-3.5', retryScoringMutation.isPending && 'animate-spin')} />
                      <span>{retryScoringMutation.isPending ? 'Đang gửi lại...' : 'Thử chấm điểm lại'}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReportViewReady(true)}
                      className="gap-1 text-xs"
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              /* Scoring Underway Box */
              <Card className="p-4 border shadow-xs bg-muted/30">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="flex items-center gap-3">
                    <Loader2 className="size-5 animate-spin text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        AI đang chấm điểm & tổng hợp báo cáo phỏng vấn...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isCompleted
                          ? 'Đã có kết quả! Đang chuẩn bị chuyển sang bảng đánh giá chi tiết...'
                          : 'Hệ thống đang phân tích các câu hỏi và câu trả lời để đánh giá năng lực.'}
                      </p>
                    </div>
                  </div>

                  {isCompleted && (
                    <Button
                      size="sm"
                      onClick={() => setReportViewReady(true)}
                      className="shrink-0 gap-1.5 shadow-xs"
                    >
                      <span>Xem báo cáo ngay</span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            )
          ) : (
            <InterviewAnswerInput session={session} />
          )}
        </div>
      )}
    </div>
  )
}
