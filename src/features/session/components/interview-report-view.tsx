import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Code2,
  Compass,
  FileText,
  History,
  Layers,
  Loader2,
  MessageSquare,
  Play,
  RefreshCw,
  Target,
  TrendingUp,
  UserCheck,
} from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getErrorMessage } from '@/api/api-error'
import { useRetryScoring, useSessionReport } from '@/hooks/use-interview-session'
import { ROUTES } from '@/constants/routes'
import type {
  ActionPlanItem,
  FocusAreaResult,
  InterviewAssessmentConfidence,
  InterviewEvidenceStatus,
  InterviewFocusPriority,
  ReportItem,
} from '@/types/report'
import type { InterviewSession } from '@/types/session'
import { cn } from '@/lib/utils'

interface InterviewReportViewProps {
  session: InterviewSession
  onViewConversation?: () => void
}

function getPerformanceTier(score: number | null): {
  label: string
  color: string
  bg: string
  border: string
} {
  if (score === null) {
    return {
      label: 'Chưa đủ dữ liệu',
      color: 'text-muted-foreground',
      bg: 'bg-muted/40',
      border: 'border-muted',
    }
  }
  if (score >= 85) {
    return {
      label: 'Xuất sắc',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
    }
  }
  if (score >= 70) {
    return {
      label: 'Tốt / Đạt chuẩn',
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/30',
    }
  }
  if (score >= 50) {
    return {
      label: 'Đạt yêu cầu',
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    }
  }
  return {
    label: 'Cần cải thiện',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
  }
}

function getConfidenceLabel(confidence: InterviewAssessmentConfidence | null): string {
  switch (confidence) {
    case 'HIGH':
      return 'Độ tin cậy cao'
    case 'MEDIUM':
      return 'Độ tin cậy vừa'
    case 'LOW':
      return 'Độ tin cậy thấp'
    default:
      return 'Chưa xác định'
  }
}

function getEvidenceStatusBadge(status: InterviewEvidenceStatus): { label: string; variant: 'default' | 'secondary' | 'outline' } {
  switch (status) {
    case 'SUFFICIENT':
      return { label: 'Đầy đủ dẫn chứng', variant: 'default' }
    case 'PARTIAL':
      return { label: 'Một phần dẫn chứng', variant: 'secondary' }
    case 'NOT_EXPLORED':
    default:
      return { label: 'Chưa khảo sát', variant: 'outline' }
  }
}

function getPriorityBadge(priority: InterviewFocusPriority): { label: string; className: string } {
  switch (priority) {
    case 'HIGH':
      return { label: 'Trọng tâm cao', className: 'border-destructive/30 bg-destructive/10 text-destructive' }
    case 'MEDIUM':
      return { label: 'Trọng tâm trung bình', className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400' }
    case 'LOW':
    default:
      return { label: 'Bổ trợ', className: 'border-muted bg-muted/40 text-muted-foreground' }
  }
}

export default function InterviewReportView({
  session,
  onViewConversation,
}: InterviewReportViewProps) {
  const reportQuery = useSessionReport(session.id, true)
  const retryScoringMutation = useRetryScoring(session.id)

  const report = reportQuery.data
  const isPending = reportQuery.isPending
  const isFailed = report?.status === 'SCORING_FAILED' || session.status === 'SCORING_FAILED'
  const isScoring = !isFailed && (report?.status === 'SCORING' || session.status === 'SCORING')

  async function handleRetryScoring() {
    try {
      await retryScoringMutation.mutateAsync()
      toast.success('Đã gửi lại yêu cầu chấm điểm!')
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  // Loading skeleton state
  if (isPending && !report) {
    return (
      <div className="flex flex-col gap-5 w-full">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  // 1. Scoring failed state (Prioritized so user always sees error if failure occurs)
  if (isFailed) {
    return (
      <Card className="border-destructive/30 bg-destructive/5 shadow-xs">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <AlertCircle className="size-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Quá trình chấm điểm gặp sự cố
                </h3>
                {report?.scoringErrorCode && (
                  <Badge variant="outline" className="text-[10px] font-mono border-destructive/30 text-destructive">
                    {report.scoringErrorCode}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {report?.scoringErrorMessage || session.statusMessage || 'Mô hình AI bị quá thời gian xử lý khi phân tích nội dung phỏng vấn dài hoặc kết nối bị gián đoạn. Vui lòng thử lại.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <Button
              size="sm"
              onClick={() => void handleRetryScoring()}
              disabled={retryScoringMutation.isPending}
              className="gap-1.5 text-xs font-medium shadow-xs"
            >
              <RefreshCw className={cn('size-3.5', retryScoringMutation.isPending && 'animate-spin')} />
              <span>Thử chấm điểm lại</span>
            </Button>
            {onViewConversation && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewConversation}
                className="gap-1.5 text-xs font-medium"
              >
                <MessageSquare className="size-3.5" />
                <span>Xem đối thoại</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // 2. Scoring in progress state
  if (isScoring) {
    return (
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-b from-primary/5 via-background to-background shadow-xs">
        <CardContent className="flex flex-col items-center justify-center p-8 sm:p-12 text-center max-w-lg mx-auto gap-5">
          <div className="relative">
            <div className="absolute -inset-2 rounded-2xl bg-primary/20 blur-md animate-pulse" />
            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
              <Award className="size-7 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              AI đang phân tích & chấm điểm buổi phỏng vấn
            </h2>
            <p className="text-xs text-muted-foreground">
              Đang phân tích {session.turns?.length || 0} lượt đối thoại và đối chiếu tiêu chí JD để lập báo cáo đánh giá.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-primary font-medium bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20">
            <Loader2 className="size-3.5 animate-spin" />
            <span>Đang chấm điểm (khoảng 20 – 45 giây)...</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void reportQuery.refetch()}
              disabled={reportQuery.isFetching}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={cn('size-3.5', reportQuery.isFetching && 'animate-spin')} />
              <span>Kiểm tra trạng thái</span>
            </Button>
            {onViewConversation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onViewConversation}
                className="gap-1.5 text-xs text-muted-foreground"
              >
                <MessageSquare className="size-3.5" />
                <span>Xem lại đối thoại</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!report) {
    return null
  }

  const overallTier = getPerformanceTier(report.overallScore)
  const technicalTier = getPerformanceTier(report.technicalScore)
  const communicationTier = getPerformanceTier(report.communicationScore)

  return (
    <div className="flex flex-col gap-6 w-full print:gap-4">
      {/* 1. Top Executive Banner & Metadata */}
      <Card className="overflow-hidden border shadow-xs bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Award className="size-6" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Báo cáo đánh giá năng lực phỏng vấn
                </h2>
                <Badge variant="outline" className="text-xs font-medium">
                  {getConfidenceLabel(report.confidence)}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Vị trí: <strong className="text-foreground">{session.jobDescription.title}</strong>
                {session.profile?.headline ? ` • Ứng viên: ${session.profile.headline}` : ''}
                {report.completedAt ? ` • Hoàn thành: ${new Date(report.completedAt).toLocaleString('vi-VN')}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden w-full sm:w-auto justify-end">
            {onViewConversation && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewConversation}
                className="gap-1.5 text-xs h-8"
              >
                <MessageSquare className="size-3.5" />
                <span>Xem đối thoại</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Overall Score */}
        <Card className="shadow-2xs border">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Award className="size-3.5 text-primary" />
                Điểm tổng quan
              </span>
              <Badge variant="outline" className={cn('text-[10px] font-semibold py-0', overallTier.bg, overallTier.color, overallTier.border)}>
                {overallTier.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
                {report.overallScore !== null ? report.overallScore : '--'}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {report.overallScore !== null ? 'Điểm trung bình trọng số toàn diện' : 'Chưa đủ độ bao phủ để kết luận điểm'}
            </p>
          </CardContent>
        </Card>

        {/* Technical Score */}
        <Card className="shadow-2xs border">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Code2 className="size-3.5 text-primary" />
                Chuyên môn kỹ thuật
              </span>
              <Badge variant="outline" className={cn('text-[10px] font-semibold py-0', technicalTier.bg, technicalTier.color, technicalTier.border)}>
                {technicalTier.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
                {report.technicalScore !== null ? report.technicalScore : '--'}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Đánh giá theo các kỹ năng yêu cầu trong JD
            </p>
          </CardContent>
        </Card>

        {/* Communication Score */}
        <Card className="shadow-2xs border">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-primary" />
                Kỹ năng giao tiếp
              </span>
              <Badge variant="outline" className={cn('text-[10px] font-semibold py-0', communicationTier.bg, communicationTier.color, communicationTier.border)}>
                {communicationTier.label}
              </Badge>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-mono">
                {report.communicationScore !== null ? report.communicationScore : '--'}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cấu trúc câu trả lời & phản xạ kỹ thuật
            </p>
          </CardContent>
        </Card>

        {/* Coverage Percentage */}
        <Card className="shadow-2xs border">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Target className="size-3.5 text-primary" />
                Độ bao phủ tiêu chí
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {session.turns?.length || 0} lượt trao đổi
              </span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-primary font-mono">
                {report.coveragePercentage !== null ? `${report.coveragePercentage}%` : '--'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Tỷ lệ các chủ đề cốt lõi đã được khảo sát
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. AI Executive Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Overall AI Summary */}
        <Card className="shadow-2xs border">
          <CardHeader className="py-3 px-4 sm:px-5 border-b bg-muted/20">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <span>Đánh giá tổng quan từ AI</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-foreground/90">
            {report.overallSummary || 'Chưa có tóm tắt tổng quan.'}
          </CardContent>
        </Card>

        {/* Communication & Behavioral Feedback */}
        <Card className="shadow-2xs border">
          <CardHeader className="py-3 px-4 sm:px-5 border-b bg-muted/20">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              <span>Nhận xét kỹ năng trình bày & giao tiếp</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-foreground/90">
            {report.communicationFeedback || 'Chưa có nhận xét giao tiếp chi tiết.'}
          </CardContent>
        </Card>
      </div>

      {/* 4. Focus Areas Breakdown */}
      {report.focusAreas && report.focusAreas.length > 0 && (
        <Card className="shadow-2xs border">
          <CardHeader className="py-3 px-4 sm:px-5 border-b bg-muted/20">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span>Đánh giá chi tiết theo từng lĩnh vực trọng tâm (Focus Areas)</span>
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {report.focusAreas.length} lĩnh vực
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4">
              {report.focusAreas.map((area: FocusAreaResult) => {
                const evidenceBadge = getEvidenceStatusBadge(area.evidenceStatus)
                const priorityBadge = getPriorityBadge(area.priority)
                const areaScoreTier = getPerformanceTier(area.score)

                return (
                  <div
                    key={area.focusAreaId || area.code}
                    className="flex flex-col gap-3 rounded-xl border bg-card/60 p-4 sm:p-5 shadow-2xs transition-colors hover:border-primary/40"
                  >
                    {/* Focus Area Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-sm sm:text-base text-foreground">
                            {area.name}
                          </h4>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {area.code}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[10px] font-medium py-0', priorityBadge.className)}>
                            {priorityBadge.label}
                          </Badge>
                          <Badge variant={evidenceBadge.variant} className="text-[10px]">
                            {evidenceBadge.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Score display */}
                      <div className="flex items-baseline gap-1 bg-muted/40 px-3 py-1 rounded-lg border">
                        <span className="font-bold text-base sm:text-lg text-foreground font-mono">
                          {area.score !== null ? area.score : '--'}
                        </span>
                        <span className="text-xs text-muted-foreground">/ 100</span>
                        <Badge variant="outline" className={cn('text-[9px] font-semibold ml-1 py-0', areaScoreTier.bg, areaScoreTier.color, areaScoreTier.border)}>
                          {areaScoreTier.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Rationale */}
                    {area.rationale && (
                      <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/50">
                        {area.rationale}
                      </p>
                    )}

                    {/* Strengths & Gaps 2-col mini grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {/* Strengths */}
                      {area.strengths && area.strengths.length > 0 && (
                        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="size-3.5 shrink-0" />
                            Điểm sáng đã ghi nhận
                          </span>
                          <ul className="space-y-1 list-disc list-inside text-foreground/80 pl-1">
                            {area.strengths.map((str: string, sIdx: number) => (
                              <li key={sIdx} className="leading-snug">{str}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Gaps */}
                      {area.gaps && area.gaps.length > 0 && (
                        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs">
                          <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="size-3.5 shrink-0" />
                            Khoảng trống kiến thức cần bù đắp
                          </span>
                          <ul className="space-y-1 list-disc list-inside text-foreground/80 pl-1">
                            {area.gaps.map((gap: string, gIdx: number) => (
                              <li key={gIdx} className="leading-snug">{gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Feedback and Evidence Turn IDs */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-border/60">
                      {area.feedback && (
                        <p className="text-muted-foreground flex-1 min-w-[240px]">
                          <strong className="text-foreground font-medium">Gợi ý phát triển: </strong>
                          {area.feedback}
                        </p>
                      )}
                      {area.evidenceTurnIds && area.evidenceTurnIds.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0 text-muted-foreground">
                          <span>Dẫn chứng từ:</span>
                          {area.evidenceTurnIds.map((tId: number) => (
                            <Badge key={tId} variant="secondary" className="text-[10px] font-mono">
                              Lượt #{tId}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Strengths & Improvements Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <Card className="shadow-2xs border">
          <CardHeader className="py-3 px-4 sm:px-5 border-b bg-emerald-500/5">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
              <span>Các điểm mạnh nổi bật ({report.strengths?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
            {report.strengths && report.strengths.length > 0 ? (
              report.strengths.map((item: ReportItem, idx: number) => (
                <div key={idx} className="flex flex-col gap-1 p-3 rounded-lg border bg-card text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground text-sm">{item.title}</span>
                    {item.evidenceTurnIds && item.evidenceTurnIds.length > 0 && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Lượt #{item.evidenceTurnIds.join(', #')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Chưa có danh sách điểm mạnh cụ thể.</p>
            )}
          </CardContent>
        </Card>

        {/* Improvements */}
        <Card className="shadow-2xs border">
          <CardHeader className="py-3 px-4 sm:px-5 border-b bg-amber-500/5">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <TrendingUp className="size-4" />
              <span>Điểm cần hoàn thiện ({report.improvements?.length || 0})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
            {report.improvements && report.improvements.length > 0 ? (
              report.improvements.map((item: ReportItem, idx: number) => (
                <div key={idx} className="flex flex-col gap-1 p-3 rounded-lg border bg-card text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground text-sm">{item.title}</span>
                    {item.evidenceTurnIds && item.evidenceTurnIds.length > 0 && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        Lượt #{item.evidenceTurnIds.join(', #')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">Chưa có danh sách điểm cần cải thiện.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. Action Plan / Learning Roadmap */}
      {report.actionPlan && report.actionPlan.length > 0 && (
        <Card className="shadow-2xs border">
          <CardHeader className="py-3 px-4 sm:px-5 border-b bg-primary/5">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2 text-primary">
                <Compass className="size-4" />
                <span>Lộ trình hành động & Kế hoạch ôn luyện đề xuất</span>
              </span>
              <Badge variant="outline" className="text-xs font-normal">
                {report.actionPlan.length} bước hành động
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
            {report.actionPlan.map((step: ActionPlanItem, idx: number) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-4 rounded-xl border bg-card text-xs shadow-2xs"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                  #{step.priority || idx + 1}
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground">
                    {step.action}
                  </p>
                  {step.reason && (
                    <p className="text-muted-foreground leading-relaxed">
                      <strong className="text-foreground font-medium">Lý do: </strong>
                      {step.reason}
                    </p>
                  )}
                  {step.suggestion && (
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-foreground/90 font-medium">
                      <span className="text-primary font-semibold">Gợi ý thực hành: </span>
                      {step.suggestion}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 7. Bottom Navigation and Call to Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border bg-muted/20 print:hidden">
        <div className="flex items-center gap-2">
          {onViewConversation && (
            <Button
              variant="outline"
              size="sm"
              onClick={onViewConversation}
              className="gap-1.5 text-xs font-medium"
            >
              <MessageSquare className="size-3.5" />
              <span>Xem lại toàn bộ đối thoại</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-xs text-muted-foreground">
            <Link to={ROUTES.sessionList}>
              <History className="size-3.5" />
              <span>Danh sách các phiên</span>
            </Link>
          </Button>
        </div>

        <Button size="sm" asChild className="gap-1.5 text-xs font-medium shadow-xs">
          <Link to={ROUTES.sessionCreate}>
            <Play className="size-3.5 fill-current" />
            <span>Luyện phiên phỏng vấn mới</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  )
}
