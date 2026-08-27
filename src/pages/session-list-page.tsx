import { useState } from 'react'
import { ArrowRight, History, Play, Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import EmptyState from '@/components/empty-state'
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import { getErrorMessage } from '@/api/api-error'
import { useSessions } from '@/hooks/use-interview-session'
import { ROUTES, sessionDetailPath } from '@/constants/routes'
import {
  INTERVIEW_DIFFICULTY_LABEL,
  SESSION_MODE_LABEL,
  SESSION_STATUS_LABEL,
} from '@/constants/session'
import type { InterviewSessionSummary, SessionListScope } from '@/types/session'

function SessionCard({ session }: { session: InterviewSessionSummary }) {
  const isReady = session.status === 'READY'
  const isInProgress = session.status === 'IN_PROGRESS' || session.status === 'PAUSED'
  const isCompleted = session.status === 'COMPLETED' || session.status === 'SCORING'
  const isGenerating = session.status === 'CREATED' || session.status === 'SCRIPT_GENERATING'

  return (
    <Card className="transition-all hover:shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-3 pb-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-base truncate">
              {session.jobDescriptionTitle}
            </span>
            <Badge
              variant={
                isReady || isCompleted
                  ? 'default'
                  : isInProgress
                    ? 'secondary'
                    : session.status === 'FAILED'
                      ? 'destructive'
                      : 'outline'
              }
              className="text-xs shrink-0"
            >
              {SESSION_STATUS_LABEL[session.status]}
            </Badge>
          </div>
          <CardDescription className="text-xs truncate">
            {session.profileHeadline ?? `Hồ sơ #${session.profileId}`}
          </CardDescription>
        </div>

        <Button size="sm" asChild className="shrink-0 gap-1.5">
          <Link to={sessionDetailPath(session.id)}>
            {isReady ? (
              <>
                <Play className="size-3.5 fill-current text-primary-foreground" />
                <span>Bắt đầu</span>
              </>
            ) : isInProgress ? (
              <>
                <Play className="size-3.5 fill-current" />
                <span>Tiếp tục</span>
              </>
            ) : isGenerating ? (
              <>
                <Sparkles className="size-3.5" />
                <span>Theo dõi</span>
              </>
            ) : (
              <>
                <span>Chi tiết</span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <span>Độ khó: <strong className="text-foreground">{INTERVIEW_DIFFICULTY_LABEL[session.difficulty]}</strong></span>
            <span>Hình thức: <strong className="text-foreground">{SESSION_MODE_LABEL[session.mode]}</strong></span>
            <span>
              Tiến độ:{' '}
              <strong className="text-foreground">
                {isReady
                  ? `${session.totalQuestionCount} câu hỏi`
                  : `${session.answeredQuestionCount}/${session.totalQuestionCount} câu`}
              </strong>
            </span>
          </div>
          <span>
            {new Date(session.createdAt).toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionTabContent({ scope }: { scope: SessionListScope }) {
  const [page] = useState(0)
  const sessionsQuery = useSessions(scope, page, 20)

  if (sessionsQuery.isPending) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    )
  }

  if (sessionsQuery.isError) {
    return (
      <ErrorState
        message={getErrorMessage(sessionsQuery.error)}
        onRetry={() => void sessionsQuery.refetch()}
      />
    )
  }

  const items = sessionsQuery.data.items

  if (items.length === 0) {
    return (
      <EmptyState
        title={scope === 'ACTIVE' ? 'Chưa có phiên phỏng vấn đang diễn ra' : 'Chưa có lịch sử phỏng vấn'}
        description={
          scope === 'ACTIVE'
            ? 'Hãy tạo một phiên phỏng vấn mới để bắt đầu luyện tập với AI.'
            : 'Các phiên bạn hoàn thành sẽ xuất hiện tại đây.'
        }
        actionLabel={scope === 'ACTIVE' ? 'Tạo phiên phỏng vấn' : undefined}
        onAction={scope === 'ACTIVE' ? () => { window.location.href = ROUTES.sessionCreate } : undefined}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((session) => (
        <SessionCard key={session.id} session={session} />
      ))}
    </div>
  )
}

export default function SessionListPage() {
  const [scope, setScope] = useState<SessionListScope>('ACTIVE')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Phiên phỏng vấn"
        description="Luyện tập phỏng vấn kỹ thuật trực tiếp với câu hỏi sinh riêng từ CV và JD của bạn."
        actions={
          <Button asChild>
            <Link to={ROUTES.sessionCreate}>
              <Plus className="size-4" />
              Tạo phiên mới
            </Link>
          </Button>
        }
      />

      <Tabs value={scope} onValueChange={(v) => setScope(v as SessionListScope)}>
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="ACTIVE" className="gap-1.5">
            <Sparkles className="size-3.5" />
            Đang diễn ra
          </TabsTrigger>
          <TabsTrigger value="HISTORY" className="gap-1.5">
            <History className="size-3.5" />
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <div className="pt-4">
          <TabsContent value="ACTIVE">
            <SessionTabContent scope="ACTIVE" />
          </TabsContent>
          <TabsContent value="HISTORY">
            <SessionTabContent scope="HISTORY" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
