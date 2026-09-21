import { useState } from 'react'
import { Link } from 'react-router'
import { Plus, Clock, History, Play, Award, Loader2, ArrowRight, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/page-header'
import ErrorState from '@/components/error-state'
import DataPagination from '@/components/data-pagination'
import CreateInterviewDialog from '@/features/session/components/wizard/create-interview-dialog'
import { getErrorMessage } from '@/api/api-error'
import { useCancelSession, useSessions } from '@/hooks/use-interview-session'
import { sessionDetailPath } from '@/constants/routes'
import {
  INTERVIEW_DIFFICULTY_LABEL,
  SESSION_MODE_LABEL,
  SESSION_STATUS_LABEL,
} from '@/constants/session'
import { formatDate } from '@/lib/format'
import type { InterviewSessionSummary, SessionListScope } from '@/types/session'

const PAGE_SIZE = 6

function SessionCard({ session }: { session: InterviewSessionSummary }) {
  const cancelMutation = useCancelSession(session.id)
  const isReady = session.status === 'READY'
  const isInProgress = session.status === 'IN_PROGRESS' || session.status === 'PAUSED'
  const isCompleted = session.status === 'COMPLETED'
  const isScoring = session.status === 'SCORING'
  const isGenerating = session.status === 'CREATED' || session.status === 'SCRIPT_GENERATING'
  const canCancel = isReady || isGenerating

  async function handleCancel(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const ok = window.confirm('Bạn có chắc muốn hủy phiên phỏng vấn này không?')
    if (!ok) return
    try {
      await cancelMutation.mutateAsync()
      toast.success('Đã hủy phiên phỏng vấn')
    } catch (err) {
      toast.error('Hủy phiên thất bại: ' + getErrorMessage(err))
    }
  }

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
          <div className="shrink-0 pt-0.5">
            <Badge
              variant={
                isCompleted
                  ? 'default'
                  : isReady
                    ? 'default'
                    : isInProgress
                      ? 'secondary'
                      : isScoring
                        ? 'outline'
                        : session.status === 'FAILED'
                          ? 'destructive'
                          : 'outline'
              }
              className="text-[11px] shrink-0 font-medium"
            >
              {SESSION_STATUS_LABEL[session.status]}
            </Badge>
          </div>
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
            <span>Thời lượng: </span>
            <strong className="text-foreground font-medium">
              {session.durationMinutes ? `${session.durationMinutes} phút` : '30 phút'}
            </strong>
          </div>
          <div className="truncate">
            <span>Hình thức: </span>
            <strong className="text-foreground font-medium">
              {SESSION_MODE_LABEL[session.mode] || session.mode}
            </strong>
          </div>
          <div className="truncate">
            <span>Thời gian: </span>
            <strong className="text-foreground font-medium">
              {formatDate(session.createdAt)}
            </strong>
          </div>
        </div>

        {/* Footer: Score / Status notice on left, Action button on right */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="min-w-0">
            {typeof session.overallScore === 'number' && !isNaN(session.overallScore) ? (
              <Badge
                variant="outline"
                className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15"
              >
                {session.overallScore}/100 điểm
              </Badge>
            ) : isCompleted ? (
              <Badge
                variant="outline"
                className="text-[10px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5"
                title="Chưa đủ dữ liệu hoặc độ bao phủ tiêu chí để kết luận điểm"
              >
                Chưa đủ dữ liệu điểm
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground hover:text-destructive h-8 px-2"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                title="Hủy phiên"
              >
                <XCircle className="size-3.5 mr-1" />
                Hủy
              </Button>
            )}

            <Button size="sm" asChild className="shrink-0 gap-1.5 shadow-xs text-xs font-medium h-8">
              <Link to={sessionDetailPath(session.id)}>
                {isReady ? (
                  <>
                    <Play className="size-3.5 fill-current" />
                    <span>Bắt đầu</span>
                  </>
                ) : isInProgress ? (
                  <>
                    <Play className="size-3.5 fill-current" />
                    <span>Tiếp tục</span>
                  </>
                ) : isScoring ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Đang chấm</span>
                  </>
                ) : isCompleted ? (
                  <>
                    <Award className="size-3.5" />
                    <span>Báo cáo</span>
                  </>
                ) : isGenerating ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Tiến trình</span>
                  </>
                ) : (
                  <>
                    <span>Chi tiết</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionTabContent({ scope }: { scope: SessionListScope }) {
  const [page, setPage] = useState(0)
  const sessionsQuery = useSessions(scope, page, PAGE_SIZE)

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
      <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-4 bg-muted/10 max-w-md mx-auto">
        <div className="space-y-1">
          <h3 className="font-semibold text-base">
            {scope === 'ACTIVE' ? 'Chưa có phiên phỏng vấn đang diễn ra' : 'Chưa có lịch sử phỏng vấn'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {scope === 'ACTIVE'
              ? 'Tạo một phiên phỏng vấn mới để bắt đầu luyện tập với AI.'
              : 'Các phiên hoàn thành sẽ xuất hiện tại đây.'}
          </p>
        </div>
        {scope === 'ACTIVE' && (
          <CreateInterviewDialog
            trigger={
              <Button size="sm" className="gap-1.5 text-xs">
                <Plus className="size-3.5" />
                Tạo phiên phỏng vấn
              </Button>
            }
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>

      <DataPagination
        page={sessionsQuery.data.page}
        totalPages={sessionsQuery.data.totalPages}
        totalElements={sessionsQuery.data.totalElements}
        pageSize={PAGE_SIZE}
        onPageChange={(newPage) => setPage(newPage)}
        itemName="phiên"
      />
    </div>
  )
}

export default function SessionListPage() {
  const [activeTab, setActiveTab] = useState<SessionListScope>('ACTIVE')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Phiên phỏng vấn"
        actions={
          <CreateInterviewDialog
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Tạo phiên phỏng vấn
              </Button>
            }
          />
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SessionListScope)} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="ACTIVE" className="gap-2">
            <Clock className="size-4" />
            Đang diễn ra
          </TabsTrigger>
          <TabsTrigger value="HISTORY" className="gap-2">
            <History className="size-4" />
            Lịch sử
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ACTIVE">
          <SessionTabContent scope="ACTIVE" />
        </TabsContent>

        <TabsContent value="HISTORY">
          <SessionTabContent scope="HISTORY" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
