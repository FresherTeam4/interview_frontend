import { useState, useEffect } from 'react'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  FileCode2,
  History,
  Info,
  PauseCircle,
  PowerOff,
  RefreshCw,
  Search,
  ShieldAlert,
  Terminal,
  X,
  XCircle,
} from 'lucide-react'

import { useDebounce } from '@/hooks/use-debounce'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import DataPagination from '@/components/data-pagination'
import {
  useAdminForceCloseSession,
  useAdminRetryPreparation,
  useAdminRetryScoring,
  useAdminSessionDetail,
  useAdminSessionDiagnostics,
  useAdminSessions,
  useAdminStaleSessions,
  useAdminTerminateSession,
} from '@/hooks/use-admin'
import {
  SESSION_MODE_LABEL,
  SESSION_STATUS_LABEL,
} from '@/constants/session'
import type { InterviewSessionMode, InterviewSessionStatus } from '@/types/admin'
import { cn } from '@/lib/utils'


const PAGE_SIZE = 15

export default function AdminSessionsPage() {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [statusFilter, setStatusFilter] = useState<'ALL' | InterviewSessionStatus>('ALL')
  const [modeFilter, setModeFilter] = useState<'ALL' | InterviewSessionMode>('ALL')
  const [page, setPage] = useState(0)

  // Stale view state
  const [viewMode, setViewMode] = useState<'ALL' | 'STALE'>('ALL')
  const [staleMinutes, setStaleMinutes] = useState(15)

  // Modals state
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    sessionId: number
    type: 'FORCE_CLOSE' | 'TERMINATE'
  } | null>(null)
  const [actionReason, setActionReason] = useState('')

  // Tự động về trang 1 khi từ khóa tìm kiếm hoặc bộ lọc thay đổi
  useEffect(() => {
    setPage(0)
  }, [debouncedKeyword, statusFilter, modeFilter, viewMode, staleMinutes])

  // Normal sessions query
  const sessionsQuery = useAdminSessions({
    keyword: debouncedKeyword.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    mode: modeFilter === 'ALL' ? undefined : modeFilter,
    page,
    size: PAGE_SIZE,
  })

  // Stale sessions query
  const staleStatusToQuery = statusFilter === 'ALL' ? 'IN_PROGRESS' : statusFilter
  const staleSessionsQuery = useAdminStaleSessions({
    status: staleStatusToQuery,
    staleMinutes,
    page,
    size: PAGE_SIZE,
  })

  const activeQuery = viewMode === 'STALE' ? staleSessionsQuery : sessionsQuery

  const detailQuery = useAdminSessionDetail(selectedSessionId)
  const diagnosticsQuery = useAdminSessionDiagnostics(selectedSessionId)
  const retryPrepMutation = useAdminRetryPreparation()
  const retryScoringMutation = useAdminRetryScoring()
  const forceCloseMutation = useAdminForceCloseSession()
  const terminateMutation = useAdminTerminateSession()

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(0)
    void activeQuery.refetch()
  }

  function handleStatusChange(val: string) {
    setStatusFilter(val as 'ALL' | InterviewSessionStatus)
    setPage(0)
  }

  function handleModeChange(val: string) {
    setModeFilter(val as 'ALL' | InterviewSessionMode)
    setPage(0)
  }

  async function handleConfirmAction() {
    if (!actionDialog) return
    if (actionDialog.type === 'FORCE_CLOSE') {
      await forceCloseMutation.mutateAsync({
        sessionId: actionDialog.sessionId,
        request: { reason: actionReason.trim() || undefined },
      })
    } else {
      await terminateMutation.mutateAsync({
        sessionId: actionDialog.sessionId,
        request: { reason: actionReason.trim() || undefined },
      })
    }
    setActionDialog(null)
    setActionReason('')
  }

  const items = activeQuery.data?.items ?? []
  const totalElements = activeQuery.data?.totalElements ?? 0
  const totalPages = Math.ceil(totalElements / PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            <span>Vận hành & Giám sát phiên phỏng vấn</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Theo dõi vòng đời phiên, chẩn đoán AI Telemetry, cứu hộ (Retry) và xử lý sự cố khẩn cấp (Force Close / Terminate)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-0.5 bg-muted/60 border border-border/80 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode('ALL')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium',
                viewMode === 'ALL'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Tất cả phiên
            </button>
            <button
              type="button"
              onClick={() => setViewMode('STALE')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5',
                viewMode === 'STALE'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Clock className="size-3" />
              <span>Phiên bị treo ({staleMinutes}m)</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void activeQuery.refetch()}
            disabled={activeQuery.isFetching}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={cn('size-3.5', activeQuery.isFetching && 'animate-spin')} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardContent className="p-3.5">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
          >
            {/* Search Input */}
            {viewMode === 'ALL' && (
              <div className="relative flex-1">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm theo email hoặc tên ứng viên..."
                  className="pl-8 pr-8 h-9 text-xs"
                />
                {keyword && (
                  <button
                    type="button"
                    onClick={() => setKeyword('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                    title="Xóa tìm kiếm"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Status Filter */}
            <div className={cn('shrink-0', viewMode === 'ALL' ? 'w-full sm:w-52' : 'flex-1')}>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {viewMode === 'ALL' ? (
                    <>
                      <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                      <SelectItem value="PREPARING">Đang chuẩn bị (PREPARING)</SelectItem>
                      <SelectItem value="READY">Sẵn sàng (READY)</SelectItem>
                      <SelectItem value="IN_PROGRESS">Đang phỏng vấn (IN_PROGRESS)</SelectItem>
                      <SelectItem value="SCORING">Đang chấm điểm (SCORING)</SelectItem>
                      <SelectItem value="COMPLETED">Đã hoàn thành (COMPLETED)</SelectItem>
                      <SelectItem value="PREPARATION_FAILED">Lỗi chuẩn bị (PREPARATION_FAILED)</SelectItem>
                      <SelectItem value="SCORING_FAILED">Lỗi chấm điểm (SCORING_FAILED)</SelectItem>
                      <SelectItem value="FAILED">Thất bại (FAILED)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="IN_PROGRESS">Đang phỏng vấn treo (IN_PROGRESS)</SelectItem>
                      <SelectItem value="PREPARING">Đang chuẩn bị treo (PREPARING)</SelectItem>
                      <SelectItem value="SCORING">Đang chấm điểm treo (SCORING)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Mode Filter if ALL */}
            {viewMode === 'ALL' && (
              <div className="w-full sm:w-44 shrink-0">
                <Select value={modeFilter} onValueChange={handleModeChange}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Hình thức" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả hình thức</SelectItem>
                    <SelectItem value="TURN_BASED">Theo lượt (Turn-based)</SelectItem>
                    <SelectItem value="VOICE_REALTIME">Thoại trực tiếp (Realtime)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Stale Threshold selector if STALE */}
            {viewMode === 'STALE' && (
              <div className="w-full sm:w-48 shrink-0">
                <Select
                  value={String(staleMinutes)}
                  onValueChange={(v) => setStaleMinutes(Number(v))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Ngưỡng treo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Treo quá 10 phút</SelectItem>
                    <SelectItem value="15">Treo quá 15 phút</SelectItem>
                    <SelectItem value="30">Treo quá 30 phút</SelectItem>
                    <SelectItem value="60">Treo quá 60 phút</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" size="sm" className="h-9 text-xs px-4 shrink-0">
              Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>


      {/* Sessions Table */}
      <Card className="border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 text-center text-xs">ID</TableHead>
                <TableHead className="text-xs">Chủ phiên (Ứng viên)</TableHead>
                <TableHead className="text-xs">Vị trí / Hồ sơ</TableHead>
                <TableHead className="text-xs">Hình thức</TableHead>
                <TableHead className="text-xs">Trạng thái</TableHead>
                <TableHead className="text-xs">Điểm</TableHead>
                <TableHead className="text-xs">Thời gian tạo</TableHead>
                <TableHead className="text-right text-xs">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionsQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell colSpan={8} className="py-3">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center text-xs text-muted-foreground">
                    Không tìm thấy phiên phỏng vấn nào phù hợp với bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((session) => {
                  const isPrepFailed = session.status === 'PREPARATION_FAILED'
                  const isScoringFailed = session.status === 'SCORING_FAILED'
                  const isCompleted = session.status === 'COMPLETED'
                  const isInProgress = session.status === 'IN_PROGRESS'
                  const sessionUser = session.user || session.owner
                  const candidateName = sessionUser?.fullName || sessionUser?.email || 'Chưa đặt tên'
                  const candidateEmail = sessionUser?.email


                  return (
                    <TableRow key={session.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        #{session.id}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-[180px]">
                          <div className="font-medium text-xs text-foreground truncate" title={candidateName}>
                            {candidateName}
                          </div>
                          {candidateEmail && (
                            <div className="text-[11px] text-muted-foreground truncate font-mono" title={candidateEmail}>
                              {candidateEmail}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-[200px]">
                          <div className="font-semibold text-xs text-foreground truncate">
                            {session.templateTitle || 'Mẫu tự do'}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {session.profileName || session.profileHeadline || 'Hồ sơ tiêu chuẩn'}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] font-normal border',
                            session.mode === 'VOICE_REALTIME'
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                              : 'bg-primary/10 text-primary border-primary/20',
                          )}
                        >
                          {session.mode === 'VOICE_REALTIME' ? 'Realtime' : 'Turn-based'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isPrepFailed ? (
                          <Badge variant="destructive" className="text-[10px] gap-1 font-medium">
                            <XCircle className="size-2.5" />
                            <span>Lỗi chuẩn bị</span>
                          </Badge>
                        ) : isScoringFailed ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          >
                            <AlertTriangle className="size-2.5" />
                            <span>Lỗi chấm điểm</span>
                          </Badge>
                        ) : isCompleted ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          >
                            Hoàn thành
                          </Badge>
                        ) : isInProgress ? (
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            Đang chạy
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] font-normal">
                            {SESSION_STATUS_LABEL[session.status] || session.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {typeof session.overallScore === 'number' && !isNaN(session.overallScore) ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                          >
                            {session.overallScore}/100
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(session.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem chi tiết */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedSessionId(session.id)}
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            title="Xem chi tiết kỹ thuật & timeline"
                          >
                            <Eye className="size-3.5" />
                            <span className="hidden sm:inline">Chi tiết</span>
                          </Button>

                          {/* Thao tác cứu hộ nhanh: Retry Prep */}
                          {isPrepFailed && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={retryPrepMutation.isPending}
                              onClick={() => void retryPrepMutation.mutateAsync(session.id)}
                              className="h-7 px-2 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                              title="Khởi động lại chuẩn bị phiên phỏng vấn"
                            >
                              <RefreshCw className={cn('size-3', retryPrepMutation.isPending && 'animate-spin')} />
                              <span>Thử lại Prep</span>
                            </Button>
                          )}

                          {/* Thao tác cứu hộ nhanh: Retry Scoring */}
                          {isScoringFailed && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={retryScoringMutation.isPending}
                              onClick={() => void retryScoringMutation.mutateAsync(session.id)}
                              className="h-7 px-2 text-xs gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                              title="Khởi động lại quá trình chấm điểm"
                            >
                              <RefreshCw className={cn('size-3', retryScoringMutation.isPending && 'animate-spin')} />
                              <span>Thử lại chấm</span>
                            </Button>
                          )}

                          {/* Thao tác cứu hộ nhanh: Buộc kết thúc phiên đang chạy */}
                          {isInProgress && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setActionDialog({ sessionId: session.id, type: 'FORCE_CLOSE' })}
                              className="h-7 px-2 text-xs gap-1 text-purple-600 border-purple-500/30 hover:bg-purple-500/10"
                              title="Buộc kết thúc phỏng vấn và chuyển sang chấm điểm"
                            >
                              <PauseCircle className="size-3" />
                              <span className="hidden sm:inline">Dừng & Chấm</span>
                            </Button>
                          )}

                          {/* Thao tác cứu hộ nhanh: Hủy phiên khẩn cấp */}
                          {!isCompleted && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setActionDialog({ sessionId: session.id, type: 'TERMINATE' })}
                              className="h-7 px-2 text-xs gap-1 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                              title="Hủy phiên khẩn cấp (không chấm điểm)"
                            >
                              <PowerOff className="size-3" />
                              <span className="hidden sm:inline">Hủy</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}

            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-border/80 bg-muted/10 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Tổng cộng <strong>{totalElements}</strong> phiên phỏng vấn
          </span>
          <DataPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemName="phiên"
          />
        </div>
      </Card>

      {/* Technical Detail Modal */}
      <Dialog open={Boolean(selectedSessionId)} onOpenChange={(open) => !open && setSelectedSessionId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <FileCode2 className="size-4 text-primary" />
              <span>Chi tiết vận hành phiên #{selectedSessionId}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thông tin kỹ thuật, phiên bản model, mã lỗi và lịch sử chuyển trạng thái
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detailQuery.data ? (
            <div className="space-y-4 py-2 text-xs">
              {/* Session Overview Card */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl border border-border/80 bg-muted/20">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Ứng viên:</span>
                  <strong className="text-foreground font-medium truncate block">
                    {(detailQuery.data.user?.fullName || detailQuery.data.owner?.fullName) ||
                      (detailQuery.data.user?.email || detailQuery.data.owner?.email) ||
                      'Chưa đặt tên'}
                  </strong>
                  {(detailQuery.data.user?.email || detailQuery.data.owner?.email) && (
                    <span className="text-[10px] text-muted-foreground font-mono block truncate">
                      {detailQuery.data.user?.email || detailQuery.data.owner?.email}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-muted-foreground block text-[11px]">Trạng thái:</span>
                  <Badge variant="outline" className="text-[10px] mt-0.5">
                    {SESSION_STATUS_LABEL[detailQuery.data.status] || detailQuery.data.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Hình thức:</span>
                  <span className="font-semibold text-foreground">
                    {SESSION_MODE_LABEL[detailQuery.data.mode] || detailQuery.data.mode}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Thời lượng / Còn lại:</span>
                  <span className="text-foreground font-medium">
                    {detailQuery.data.durationMinutes} phút ({detailQuery.data.remainingSeconds}s)
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Điểm tổng:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {detailQuery.data.overallScore !== null ? `${detailQuery.data.overallScore}/100` : 'Chưa có'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Lý do kết thúc:</span>
                  <span className="text-foreground font-mono">
                    {detailQuery.data.endReason || '—'}
                  </span>
                </div>
              </div>

              {/* Version & Model Info */}
              <div className="p-3 rounded-xl border border-border/80 bg-card space-y-1.5">
                <h5 className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <Info className="size-3.5 text-primary" />
                  <span>Cấu hình AI & Phiên bản Prompt</span>
                </h5>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                  <div>
                    Model: <strong className="text-foreground font-mono">{detailQuery.data.modelVersion || 'default'}</strong>
                  </div>
                  <div>
                    Prompt: <strong className="text-foreground font-mono">{detailQuery.data.promptVersion || 'v1'}</strong>
                  </div>
                  <div>
                    Schema: <strong className="text-foreground font-mono">{detailQuery.data.schemaVersion || 'v1'}</strong>
                  </div>
                </div>
              </div>

              {/* AI Diagnostics & Telemetry Card */}
              {diagnosticsQuery.data && (
                <div className="p-3.5 rounded-xl border border-primary/25 bg-primary/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                      <Terminal className="size-3.5 text-primary" />
                      <span>Chẩn đoán & Đo lường AI Engine (Telemetry)</span>
                    </h5>
                    {diagnosticsQuery.isFetching && (
                      <RefreshCw className="size-3 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground">
                    <div>
                      Provider: <strong className="text-foreground font-mono">{diagnosticsQuery.data.realtimeProvider || 'WebRTC'}</strong>
                    </div>
                    <div>
                      Turn hiện tại: <strong className="text-foreground font-mono">{diagnosticsQuery.data.currentTurnIndex}</strong>
                    </div>
                    <div>
                      Lần sửa lỗi (Prep/Score): <strong className="text-foreground font-mono">{diagnosticsQuery.data.adminPreparationRetries}/{diagnosticsQuery.data.adminScoringRetries}</strong>
                    </div>
                    <div className="col-span-2 sm:col-span-3">
                      Hoạt động cuối: <strong className="text-foreground font-mono">{diagnosticsQuery.data.lastActivityAt ? new Date(diagnosticsQuery.data.lastActivityAt).toLocaleString('vi-VN') : '—'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Box if any */}
              {(detailQuery.data.preparationErrorMessage || detailQuery.data.scoringErrorMessage) && (
                <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-destructive flex items-center gap-1.5">
                      <AlertCircle className="size-4" />
                      <span>Thông tin sự cố kỹ thuật</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {detailQuery.data.status === 'PREPARATION_FAILED' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={retryPrepMutation.isPending}
                          onClick={() => void retryPrepMutation.mutateAsync(detailQuery.data!.id)}
                          className="h-6 px-2 text-[11px] gap-1"
                        >
                          <RefreshCw className={cn('size-3', retryPrepMutation.isPending && 'animate-spin')} />
                          <span>Thử lại Prep</span>
                        </Button>
                      )}
                      {detailQuery.data.status === 'SCORING_FAILED' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={retryScoringMutation.isPending}
                          onClick={() => void retryScoringMutation.mutateAsync(detailQuery.data!.id)}
                          className="h-6 px-2 text-[11px] gap-1"
                        >
                          <RefreshCw className={cn('size-3', retryScoringMutation.isPending && 'animate-spin')} />
                          <span>Thử lại Scoring</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  {detailQuery.data.preparationErrorCode && (
                    <div className="text-[11px]">
                      <span className="font-mono font-semibold text-destructive">Mã lỗi Prep: </span>
                      <span className="font-mono">{detailQuery.data.preparationErrorCode}</span>
                      <p className="text-foreground/80 mt-0.5">{detailQuery.data.preparationErrorMessage}</p>
                    </div>
                  )}
                  {detailQuery.data.scoringErrorCode && (
                    <div className="text-[11px]">
                      <span className="font-mono font-semibold text-destructive">Mã lỗi Scoring: </span>
                      <span className="font-mono">{detailQuery.data.scoringErrorCode}</span>
                      <p className="text-foreground/80 mt-0.5">{detailQuery.data.scoringErrorMessage}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status Transitions Timeline */}
              <div className="space-y-2">
                <h5 className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <History className="size-3.5 text-primary" />
                  <span>Dòng thời gian chuyển trạng thái (Transitions)</span>
                </h5>

                <div className="rounded-xl border border-border/80 bg-card p-3 divide-y divide-border/60">
                  {detailQuery.data.transitions && detailQuery.data.transitions.length > 0 ? (
                    detailQuery.data.transitions.map((trans, idx) => (
                      <div key={trans.id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-[11px] text-muted-foreground">
                              {trans.fromStatus || 'START'}
                            </span>
                            <ArrowRight className="size-3 text-muted-foreground/60 shrink-0" />
                            <Badge variant="outline" className="text-[10px] font-mono font-medium">
                              {trans.toStatus}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[9px] px-1.5 py-0 font-normal',
                                trans.actor === 'ADMIN'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                    : trans.actor === 'SYSTEM'
                                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                      : 'bg-muted',
                              )}
                            >
                              {trans.actor}
                            </Badge>
                          </div>
                          {trans.reason && (
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {trans.reason}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {new Date(trans.createdAt).toLocaleTimeString('vi-VN')} {new Date(trans.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-2">
                      Chưa có dữ liệu chuyển trạng thái ghi nhận.
                    </p>
                  )}
                </div>
              </div>

              {/* Emergency Operations Box inside Modal */}
              <div className="pt-2 border-t border-border/80 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground">
                  Thao tác can thiệp vận hành:
                </span>
                <div className="flex items-center gap-2">
                  {detailQuery.data.status === 'IN_PROGRESS' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionDialog({ sessionId: detailQuery.data!.id, type: 'FORCE_CLOSE' })}
                      className="h-7 text-xs gap-1.5 text-purple-600 border-purple-500/30 hover:bg-purple-500/10"
                    >
                      <PauseCircle className="size-3.5" />
                      <span>Dừng & Chấm điểm</span>
                    </Button>
                  )}
                  {detailQuery.data.status !== 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActionDialog({ sessionId: detailQuery.data!.id, type: 'TERMINATE' })}
                      className="h-7 text-xs gap-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <PowerOff className="size-3.5" />
                      <span>Hủy phiên khẩn cấp</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog (Force Close / Terminate) */}
      <Dialog open={Boolean(actionDialog)} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldAlert className="size-4 text-destructive" />
              <span>
                {actionDialog?.type === 'FORCE_CLOSE'
                  ? `Buộc kết thúc & Chấm điểm phiên #${actionDialog?.sessionId}`
                  : `Hủy khẩn cấp phiên #${actionDialog?.sessionId}`}
              </span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {actionDialog?.type === 'FORCE_CLOSE'
                ? 'Hành động này sẽ ngắt phiên phỏng vấn đang diễn ra và kích hoạt chấm điểm ngay lập tức.'
                : 'Hành động này sẽ dừng phiên phỏng vấn mà KHÔNG chấm điểm. Hãy sử dụng cẩn trọng khi phiên gặp sự cố không thể khắc phục.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <label className="font-medium text-foreground block">
              Lý do can thiệp vận hành (tùy chọn):
            </label>
            <Textarea
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="VD: Phiên bị treo quá 15 phút, người dùng yêu cầu cứu trợ..."
              className="text-xs min-h-[70px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActionDialog(null)}
              disabled={forceCloseMutation.isPending || terminateMutation.isPending}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              variant={actionDialog?.type === 'TERMINATE' ? 'destructive' : 'default'}
              onClick={() => void handleConfirmAction()}
              disabled={forceCloseMutation.isPending || terminateMutation.isPending}
              className="text-xs gap-1.5"
            >
              {(forceCloseMutation.isPending || terminateMutation.isPending) && (
                <RefreshCw className="size-3 animate-spin" />
              )}
              <span>Xác nhận thực hiện</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

