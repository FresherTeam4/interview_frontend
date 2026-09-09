import { useState } from 'react'
import { ArrowRight, Award, Clock, History, Loader2, Play, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ErrorState from '@/components/error-state'
import PageHeader from '@/components/page-header'
import DataPagination from '@/components/data-pagination'
import CreateInterviewDialog from '@/features/session/components/wizard/create-interview-dialog'
import { getErrorMessage } from '@/api/api-error'
import { useSessions } from '@/hooks/use-interview-session'
import { sessionDetailPath } from '@/constants/routes'
import {
  INTERVIEW_DIFFICULTY_LABEL,
  SESSION_STATUS_LABEL,
} from '@/constants/session'
import type { InterviewSessionSummary, SessionListScope } from '@/types/session'

const PAGE_SIZE = 6

function SessionCard({ session }: { session: InterviewSessionSummary }) {
  const isReady = session.status === 'READY'
  const isInProgress = session.status === 'IN_PROGRESS' || session.status === 'PAUSED'
  const isCompleted = session.status === 'COMPLETED'
  const isScoring = session.status === 'SCORING'
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
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="text-[10px] font-normal shrink-0 border-primary/25 text-primary bg-primary/5"
              >
                {session.mode === 'TEXT' ? 'Văn bản' : 'Giọng nói'}
              </Badge>
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
            {isCompleted &&
              (session.overallScore !== null ? (
                <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 bg-primary/5">
                  {session.overallScore}/100 điểm
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5"
                  title="Chưa đủ độ bao phủ tiêu chí (dưới 50%) để kết luận điểm"
                >
                  Chưa đủ dữ liệu điểm
                </Badge>
              ))}
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
              {session.mode === 'TEXT' ? 'Văn bản (Chat)' : 'Giọng nói (Voice)'}
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
              ) : isScoring ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Đang chấm điểm...</span>
                </>
              ) : isCompleted ? (
                <>
                  <Award className="size-3.5" />
                  <span>Xem báo cáo</span>
                </>
              ) : isGenerating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
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
        pageSize={sessionsQuery.data.size}
        onPageChange={(newPage) => setPage(newPage)}
        itemName="phiên phỏng vấn"
      />
    </div>
  )
}

export default function SessionListPage() {
  const [scope, setScope] = useState<SessionListScope>('ACTIVE')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Phiên phỏng vấn"
        actions={
          <CreateInterviewDialog
            trigger={
              <Button className="gap-2">
                <Plus className="size-4" />
                Tạo phiên mới
              </Button>
            }
          />
        }
      />

      <Tabs value={scope} onValueChange={(v) => setScope(v as SessionListScope)}>
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="ACTIVE" className="gap-1.5">
            <Clock className="size-3.5" />
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
