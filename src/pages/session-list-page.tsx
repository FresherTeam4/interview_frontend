import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import {
  Plus,
  Clock,
  History,
  Play,
  Award,
  Loader2,
  ArrowRight,
  XCircle,
  Search,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import PageHeader from '@/components/page-header'
import ErrorState from '@/components/error-state'
import DataPagination from '@/components/data-pagination'
import CreateInterviewDialog from '@/features/session/components/wizard/create-interview-dialog'
import { getErrorMessage } from '@/api/api-error'
import { useCancelSession, useSessions } from '@/hooks/use-interview-session'
import { useDebounce } from '@/hooks/use-debounce'
import { sessionDetailPath } from '@/constants/routes'
import {
  SESSION_MODE_LABEL,
  SESSION_STATUS_LABEL,
} from '@/constants/session'
import { formatDate } from '@/lib/format'
import type {
  InterviewSessionNextAction,
  InterviewSessionSummaryResponse,
  SessionListScope,
  SessionMode,
  SessionStatus,
} from '@/types/session'

const PAGE_SIZE = 9

function getNextActionConfig(nextAction?: InterviewSessionNextAction, status?: SessionStatus) {
  if (nextAction === 'START') {
    return { label: 'Bắt đầu', icon: Play, spinning: false }
  }
  if (nextAction === 'CONTINUE') {
    return { label: 'Tiếp tục', icon: Play, spinning: false }
  }
  if (nextAction === 'VIEW_REPORT') {
    return { label: 'Báo cáo', icon: Award, spinning: false }
  }
  if (nextAction === 'WAIT_FOR_PREPARATION') {
    return { label: 'Đang chuẩn bị', icon: Loader2, spinning: true }
  }
  if (nextAction === 'RETRY_PREPARATION') {
    return { label: 'Thử lại chuẩn bị', icon: RefreshCw, spinning: false }
  }
  if (nextAction === 'WAIT_FOR_SCORING') {
    return { label: 'Đang chấm', icon: Loader2, spinning: true }
  }
  if (nextAction === 'RETRY_SCORING') {
    return { label: 'Thử lại chấm', icon: RefreshCw, spinning: false }
  }

  // Fallback theo status
  if (status === 'READY') return { label: 'Bắt đầu', icon: Play, spinning: false }
  if (status === 'IN_PROGRESS') return { label: 'Tiếp tục', icon: Play, spinning: false }
  if (status === 'COMPLETED') return { label: 'Báo cáo', icon: Award, spinning: false }
  if (status === 'SCORING') return { label: 'Đang chấm', icon: Loader2, spinning: true }
  if (status === 'PREPARING' || status === 'SCRIPT_GENERATING') return { label: 'Đang chuẩn bị', icon: Loader2, spinning: true }

  return { label: 'Chi tiết', icon: ArrowRight, spinning: false }
}

function SessionCard({ session }: { session: InterviewSessionSummaryResponse }) {
  const cancelMutation = useCancelSession(session.id)
  const isCompleted = session.status === 'COMPLETED'
  const isReady = session.status === 'READY'
  const isInProgress = session.status === 'IN_PROGRESS' || session.status === 'PAUSED'
  const isScoring = session.status === 'SCORING'
  const isGenerating = session.status === 'CREATED' || session.status === 'SCRIPT_GENERATING' || session.status === 'PREPARING'
  const canCancel = isReady || isGenerating || session.status === 'PREPARATION_FAILED'

  const title = session.templateTitle || 'Vị trí phỏng vấn'
  const headline = session.profileName || 'Ứng viên'
  const actionConfig = getNextActionConfig(session.nextAction, session.status)
  const ActionIcon = actionConfig.icon

  async function handleCancel(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const ok = window.confirm('Bạn có chắc muốn hủy phiên phỏng vấn này không?')
    if (!ok) return
    try {
      await cancelMutation.mutateAsync()
      toast.success('Đã hủy phiên phỏng vấn thành công')
    } catch (err) {
      toast.error('Hủy phiên thất bại: ' + getErrorMessage(err))
    }
  }

  return (
    <Card className="flex flex-col justify-between transition-all hover:shadow-md hover:border-primary/40 h-full bg-card/80 backdrop-blur-xs">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <h3 className="font-semibold text-base leading-snug line-clamp-2" title={title}>
              {title}
            </h3>
            <p className="text-xs text-muted-foreground truncate" title={headline}>
              {headline}
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
                        : session.status === 'FAILED' || session.status === 'PREPARATION_FAILED' || session.status === 'SCORING_FAILED'
                          ? 'destructive'
                          : 'outline'
              }
              className="text-[11px] shrink-0 font-medium"
            >
              {SESSION_STATUS_LABEL[session.status] ?? session.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex flex-col gap-3">
        {/* Metadata mini-grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-lg border bg-muted/20 p-2.5 text-xs text-muted-foreground">
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
          <div className="truncate">
            <span>Ngôn ngữ: </span>
            <strong className="text-foreground font-medium">
              {session.languageCode?.toUpperCase() === 'VI' ? 'Tiếng Việt' : 'Tiếng Anh'}
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
                {Math.round(session.overallScore)}/100 điểm
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
                <ActionIcon className={`size-3.5 ${actionConfig.spinning ? 'animate-spin' : 'fill-current'}`} />
                <span>{actionConfig.label}</span>
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SessionListPage() {
  const [activeTab, setActiveTab] = useState<SessionListScope>('ACTIVE')
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [modeFilter, setModeFilter] = useState<'ALL' | SessionMode>('ALL')
  const [page, setPage] = useState(0)

  // Reset về trang 1 khi đổi bộ lọc
  useEffect(() => {
    setPage(0)
  }, [activeTab, debouncedKeyword, modeFilter])

  const sessionsQuery = useSessions(activeTab, page, PAGE_SIZE, {
    keyword: debouncedKeyword.trim() || undefined,
    mode: modeFilter === 'ALL' ? undefined : modeFilter,
  })

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Phiên phỏng vấn"
        actions={
          <CreateInterviewDialog
            trigger={
              <Button className="gap-2 shadow-xs">
                <Plus className="size-4" />
                Tạo phiên phỏng vấn
              </Button>
            }
          />
        }
      />

      {/* Tabs & Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as SessionListScope)}
          className="w-auto"
        >
          <TabsList className="bg-muted/70 p-1">
            <TabsTrigger value="ACTIVE" className="gap-2 text-xs font-medium px-3">
              <Clock className="size-3.5" />
              Đang diễn ra
            </TabsTrigger>
            <TabsTrigger value="HISTORY" className="gap-2 text-xs font-medium px-3">
              <History className="size-3.5" />
              Lịch sử đã xong
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          {/* Keyword Search */}
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm theo vị trí hoặc hồ sơ..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="h-8 pl-8 pr-7 text-xs"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => setKeyword('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Mode Filter */}
          <Select
            value={modeFilter}
            onValueChange={(val) => setModeFilter(val as 'ALL' | SessionMode)}
          >
            <SelectTrigger className="h-8 text-xs w-[150px]">
              <SlidersHorizontal className="size-3 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Hình thức" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Tất cả hình thức</SelectItem>
              <SelectItem value="TURN_BASED" className="text-xs">Theo lượt (Turn-based)</SelectItem>
              <SelectItem value="VOICE_REALTIME" className="text-xs">Giọng nói Realtime</SelectItem>
            </SelectContent>
          </Select>

          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => void sessionsQuery.refetch()}
            disabled={sessionsQuery.isFetching}
            className="size-8 shrink-0"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`size-3.5 ${sessionsQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content Rendering */}
      {sessionsQuery.isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : sessionsQuery.isError ? (
        <ErrorState
          message={getErrorMessage(sessionsQuery.error)}
          onRetry={() => void sessionsQuery.refetch()}
        />
      ) : sessionsQuery.data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center space-y-4 bg-muted/10 max-w-md mx-auto my-8">
          <div className="space-y-1.5">
            <h3 className="font-semibold text-base">
              {activeTab === 'ACTIVE'
                ? 'Chưa có phiên phỏng vấn đang diễn ra'
                : 'Chưa có lịch sử phỏng vấn hoàn thành'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {keyword.trim()
                ? 'Không tìm thấy phiên phỏng vấn phù hợp với từ khóa tìm kiếm.'
                : activeTab === 'ACTIVE'
                  ? 'Tạo một phiên phỏng vấn mới để bắt đầu luyện tập với chuyên gia AI.'
                  : 'Các phiên hoàn thành sẽ hiển thị tại đây cùng báo cáo chi tiết.'}
            </p>
          </div>
          {activeTab === 'ACTIVE' && !keyword.trim() && (
            <CreateInterviewDialog
              trigger={
                <Button size="sm" className="gap-1.5 text-xs shadow-xs">
                  <Plus className="size-3.5" />
                  Tạo phiên phỏng vấn
                </Button>
              }
            />
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessionsQuery.data.items.map((session) => (
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
      )}
    </div>
  )
}
