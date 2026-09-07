import { useState } from 'react'
import { Award, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InterviewAnswerInput from '@/features/session/components/interview-answer-input'
import InterviewChatView from '@/features/session/components/interview-chat-view'
import InterviewReportView from '@/features/session/components/interview-report-view'
import InterviewRoomHeader from '@/features/session/components/interview-room-header'
import type { InterviewSession } from '@/types/session'

interface InterviewRoomProps {
  session: InterviewSession
}

export default function InterviewRoom({ session }: InterviewRoomProps) {
  const isCompleted = session.status === 'COMPLETED'
  const isScoring = session.status === 'SCORING'
  const isFailed = session.status === 'SCORING_FAILED'
  const isFinished = isCompleted || isScoring || isFailed
  const isEvaluating =
    session.status === 'IN_PROGRESS' && session.awaitingAction === 'ENGINE_RESPONSE'

  const [activeTab, setActiveTab] = useState<'report' | 'chat'>('report')
  const turnCount = session.turns?.length || 0

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Compact Top Header Bar */}
      <InterviewRoomHeader session={session} />

      {/* Main Room Content: 100% Screen Width */}
      {isFinished ? (
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
                variant={activeTab === 'chat' ? 'ghost' : 'default'}
                size="sm"
                onClick={() => setActiveTab('chat')}
                className="gap-1.5 text-xs font-medium"
              >
                <MessageSquare className="size-3.5" />
                <span>Lịch sử đối thoại ({turnCount})</span>
              </Button>
            </div>

            <span className="text-xs text-muted-foreground hidden sm:inline">
              {activeTab === 'report'
                ? 'Báo cáo chi tiết năng lực & lộ trình hành động từ AI'
                : 'Toàn bộ các lượt đối thoại thực tế trong phiên phỏng vấn'}
            </span>
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
                  turns={session.turns}
                  isEvaluating={false}
                  statusMessage={session.statusMessage}
                />
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Active Interview State: Full-width Chat Conversation + Answer Input */
        <div className="flex flex-col gap-4 w-full">
          <Card className="flex flex-col overflow-hidden shadow-xs border min-h-[480px] max-h-[66vh]">
            <CardContent className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 min-h-0">
              <InterviewChatView
                turns={session.turns}
                isEvaluating={isEvaluating}
                statusMessage={
                  session.status === 'FAILED' || session.awaitingAction === 'ENGINE_RETRY'
                    ? session.statusMessage
                    : null
                }
              />
            </CardContent>
          </Card>

          <InterviewAnswerInput session={session} />
        </div>
      )}
    </div>
  )
}
