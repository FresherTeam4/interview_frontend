import { Card, CardContent } from '@/components/ui/card'
import InterviewAnswerInput from '@/features/session/components/interview-answer-input'
import InterviewChatView from '@/features/session/components/interview-chat-view'
import InterviewCompletedView from '@/features/session/components/interview-completed-view'
import InterviewRoomSidebar from '@/features/session/components/interview-room-sidebar'
import type { InterviewSession } from '@/types/session'

interface InterviewRoomProps {
  session: InterviewSession
}

export default function InterviewRoom({ session }: InterviewRoomProps) {
  const isFinished = session.status === 'COMPLETED' || session.status === 'SCORING'
  const isEvaluating =
    session.status === 'IN_PROGRESS' && session.awaitingAction === 'ENGINE_RESPONSE'

  if (isFinished) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left info */}
        <InterviewRoomSidebar session={session} />

        {/* Right completion view & history */}
        <div className="flex-1 flex flex-col gap-5 min-w-0 w-full">
          <InterviewCompletedView session={session} />
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-sm mb-3">Lịch sử đối thoại của buổi phỏng vấn</h3>
              <div className="max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                <InterviewChatView
                  turns={session.turns}
                  isEvaluating={false}
                  statusMessage={session.statusMessage}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
      {/* Left Sidebar: Session Info, Progress & Actions */}
      <InterviewRoomSidebar session={session} />

      {/* Right Column: Chat Turns & Answer Input */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 w-full">
        {/* Chat Conversation Card */}
        <Card className="flex flex-col min-h-[460px] max-h-[62vh] overflow-hidden shadow-xs border">
          <CardContent className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6">
            <InterviewChatView
              turns={session.turns}
              isEvaluating={isEvaluating}
              statusMessage={session.statusMessage}
            />
          </CardContent>
        </Card>

        {/* Answer Input */}
        <InterviewAnswerInput session={session} />
      </div>
    </div>
  )
}
