import { useLayoutEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import InterviewAnswerInput from '@/features/session/components/interview-answer-input'
import InterviewChatView from '@/features/session/components/interview-chat-view'
import InterviewRoomSidebar from '@/features/session/components/interview-room-sidebar'
import type { InterviewSession } from '@/types/session'

interface InterviewRoomProps {
  session: InterviewSession
}

export default function InterviewRoom({ session }: InterviewRoomProps) {
  const isFinished = session.status === 'COMPLETED' || session.status === 'SCORING'
  const isEvaluating =
    session.status === 'IN_PROGRESS' && session.awaitingAction === 'ENGINE_RESPONSE'

  const sidebarContainerRef = useRef<HTMLDivElement>(null)
  const [matchedHeight, setMatchedHeight] = useState<number | undefined>(undefined)

  useLayoutEffect(() => {
    if (!sidebarContainerRef.current) return

    function syncHeight() {
      if (sidebarContainerRef.current) {
        setMatchedHeight(sidebarContainerRef.current.offsetHeight)
      }
    }

    syncHeight()
    const resizeObserver = new ResizeObserver(syncHeight)
    resizeObserver.observe(sidebarContainerRef.current)
    return () => resizeObserver.disconnect()
  }, [session, isFinished])

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
      {/* Left Sidebar: Measured via ref to determine exact pixel height */}
      <div ref={sidebarContainerRef} className="w-full lg:w-72 xl:w-80 shrink-0">
        <InterviewRoomSidebar session={session} />
      </div>

      {/* Right Column: Chat History & Answer Input */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 w-full">
        {/* Chat Conversation Card with exact matched height when finished */}
        <Card
          style={isFinished && matchedHeight ? { height: `${matchedHeight}px` } : undefined}
          className={`flex flex-col overflow-hidden shadow-xs border ${
            isFinished ? '' : 'min-h-[460px] max-h-[64vh]'
          }`}
        >
          {isFinished ? (
            <CardHeader className="pb-3 border-b shrink-0">
              <CardTitle className="text-sm font-semibold">
                Lịch sử đối thoại của buổi phỏng vấn
              </CardTitle>
            </CardHeader>
          ) : null}

          <CardContent className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 min-h-0">
            <InterviewChatView
              turns={session.turns}
              isEvaluating={isEvaluating}
              statusMessage={session.statusMessage}
            />
          </CardContent>
        </Card>

        {/* Answer Input (Only when active / in-progress) */}
        {!isFinished ? <InterviewAnswerInput session={session} /> : null}
      </div>
    </div>
  )
}
