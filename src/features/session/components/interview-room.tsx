import { Card, CardContent } from '@/components/ui/card'
import InterviewAnswerInput from '@/features/session/components/interview-answer-input'
import InterviewChatView from '@/features/session/components/interview-chat-view'
import InterviewCompletedView from '@/features/session/components/interview-completed-view'
import InterviewRoomHeader from '@/features/session/components/interview-room-header'
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
      <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
        <InterviewCompletedView session={session} />
        <Card>
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-semibold text-sm mb-3">Lịch sử đối thoại của buổi phỏng vấn</h3>
            <InterviewChatView
              turns={session.turns}
              isEvaluating={false}
              statusMessage={session.statusMessage}
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto w-full">
      <InterviewRoomHeader session={session} />

      <Card className="flex flex-col min-h-[420px] max-h-[65vh] overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6">
          <InterviewChatView
            turns={session.turns}
            isEvaluating={isEvaluating}
            statusMessage={session.statusMessage}
          />
        </CardContent>
      </Card>

      <InterviewAnswerInput session={session} />
    </div>
  )
}
