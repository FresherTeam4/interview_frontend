import { useState } from 'react'
import { ArrowRight, History, Play, Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
    <Card className="flex flex-col justify-between transition-all hover:shadow-md hover:border-primary/30 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-semibold text-base leading-snug line-clamp-2">
              {session.jobDescriptionTitle}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {session.profileHeadline ?? `Hồ sơ #${session.profileId}`}
            </p>
          </div>
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
            className="text-[11px] shrink-0 font-medium"
          >
            {SESSION_STATUS_LABEL[session.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex flex-col gap-3">
        {/* Metadata mini-grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-lg border bg-muted/20 p-2.5 text-xs text-muted-foreground">
          <div className="truncate">
            <span>Độ khó: </span>
            <strong className="text-foreground font-medium">{INTERVIEW_DIFFICULTY_LABEL[session.difficulty]}</strong>
          </div>
          <div className="truncate">
            <span>Hình thức: </span>
            <strong className="text-foreground font-medium">{SESSION_MODE_LABEL[session.mode]}</strong>
          </div>
          <div className="truncate">
            <span>Tiến độ: </span>
            <strong className="text-foreground font-medium">
              {isReady
                ? `${session.totalQuestionCount} câu hỏi`
                : `${session.answeredQuestionCount}/${session.totalQuestionCount} câu`}
            </strong>
          </div>
          <div className="truncate">
            <span>Thời gian: </span>
            <strong className="text-foreground font-medium">
              {new Date(session.createdAt).toLocaleDateString('vi-VN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </strong>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-end pt-1">
          <Button size="sm" asChild className="w-full sm:w-auto gap-1.5 shadow-xs text-xs font-medium">
            <Link to={sessionDetailPath(session.id)}>
              {isReady ? (
                <>
                  <Play className="size-3.5 fill-current" />
                  <span>Bắt đầu phỏng vấn</span>
                </>
              ) : isInProgress ? (
                <>
                  <Play className="size-3.5 fill-current" />
                  <span>Tiếp tục phỏng vấn</span>
                </>
              ) : isGenerating ? (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Theo dõi tiến trình</span>
                </>
              ) : (
                <>
                  <span>Xem chi tiết</span>
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionTabContent({ scope }: { scope: SessionListScope }) {
  const [page] = useState(0)
  const sessionsQuery = useSessions(scope, page, 30)

  if (sessionsQuery.isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
