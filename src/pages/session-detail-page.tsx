import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import InterviewRoom from '@/features/session/components/interview-room'
import SessionStatusCard from '@/features/session/components/session-status-card'
import { getErrorMessage } from '@/api/api-error'
import { useSession } from '@/hooks/use-interview-session'
import { ROUTES } from '@/constants/routes'

export default function SessionDetailPage() {
  const { sessionId } = useParams()
  const parsedId = Number(sessionId)
  const sessionQuery = useSession(parsedId)

  function renderContent() {
    if (!Number.isInteger(parsedId)) {
      return <ErrorState title="Phiên không tồn tại" message="Đường dẫn phiên không hợp lệ." />
    }

    if (sessionQuery.isPending) {
      return (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      )
    }

    if (sessionQuery.isError) {
      return (
        <ErrorState
          message={getErrorMessage(sessionQuery.error)}
          onRetry={() => void sessionQuery.refetch()}
        />
      )
    }

    const session = sessionQuery.data

    // If session is IN_PROGRESS, PAUSED, SCORING, COMPLETED or has active turns -> Render the full interactive Interview Room!
    const isInteractive =
      session.status === 'IN_PROGRESS' ||
      session.status === 'PAUSED' ||
      session.status === 'SCORING' ||
      session.status === 'COMPLETED' ||
      (session.turns && session.turns.length > 0)

    if (isInteractive) {
      return <InterviewRoom session={session} />
    }

    return <SessionStatusCard session={session} />
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <PageHeader
        title={`Phiên phỏng vấn${parsedId ? ` #${parsedId}` : ''}`}
        description="Theo dõi trạng thái phiên phỏng vấn."
        actions={
          <Button variant="outline" asChild>
            <Link to={ROUTES.sessionCreate}>
              <ArrowLeft className="size-4" />
              Tạo phiên mới
            </Link>
          </Button>
        }
      />
      {renderContent()}
    </div>
  )
}
