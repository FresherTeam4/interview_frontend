import {
  AlertCircle,
  ArrowRight,
  Award,
  Code2,
  FileText,
  History,
  Layers,
  Loader2,
  MessageSquare,
  Play,
  RefreshCw,
  Sparkles,
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
import { SESSION_MODE_LABEL } from '@/constants/session'
import type {
  FocusAreaResult,
  ImprovementItem,
  InterviewAssessmentConfidence,
  InterviewEvidenceStatus,
  InterviewFocusPriority,
} from '@/types/report'
import type { InterviewSession } from '@/types/session'
import { cn } from '@/lib/utils'

interface InterviewReportViewProps {
  session: InterviewSession
  onViewConversation?: () => void
}

function getPerformanceTier(score?: number | null): {
  label: string
  color: string
  bg: string
  border: string
} {
  if (score === null || score === undefined) {
    return {
      label: 'Chưa đủ điều kiện',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      border: 'border-amber-500/40',
    }
  }
  if (score >= 85) {
    return {
      label: 'Xuất sắc',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      border: 'border-emerald-500/40',
    }
  }
  if (score >= 70) {
    return {
      label: 'Tốt / Đạt chuẩn',
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      border: 'border-emerald-500/40',
    }
  }
  if (score >= 50) {
    return {
      label: 'Đạt yêu cầu',
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
      border: 'border-amber-500/30',
    }
  }
  return {
    label: 'Cần cải thiện',
    color: 'text-destructive',
    bg: 'bg-destructive/10 dark:bg-destructive/15',
    border: 'border-destructive/30',
  }
}

function getConfidenceBadge(confidence?: InterviewAssessmentConfidence | null): {
  label: string
  className: string
} {
  switch (confidence) {
    case 'HIGH':
      return {
        label: 'Độ tin cậy cao',
        className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      }
    case 'MEDIUM':
      return {
        label: 'Độ tin cậy vừa',
        className: 'border-primary/30 bg-primary/10 text-primary',
      }
    case 'LOW':
      return {
        label: 'Độ tin cậy thấp',
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
      }
    default:
      return {
        label: 'Chưa xác định',
        className: 'border-muted bg-muted/40 text-muted-foreground',
      }
  }
}

function getEvidenceStatusBadge(status: InterviewEvidenceStatus): {
  label: string
  variant: 'default' | 'secondary' | 'outline'
  className?: string
} {
  switch (status) {
    case 'SUFFICIENT':
      return {
        label: 'Đầy đủ dẫn chứng',
        variant: 'default',
        className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      }
    case 'PARTIAL':
      return {
        label: 'Dẫn chứng một phần',
        variant: 'secondary',
        className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      }
    case 'NOT_EXPLORED':
    default:
      return {
        label: 'Chưa khảo sát',
        variant: 'outline',
        className: 'text-muted-foreground border-dashed',
      }
  }
}

function getPriorityBadge(priority: InterviewFocusPriority): {
  label: string
  className: string
} {
  switch (priority) {
    case 'HIGH':
      return {
        label: 'Trọng tâm cao',
        className: 'border-destructive/30 bg-destructive/10 text-destructive font-medium',
      }
    case 'MEDIUM':
      return {
        label: 'Trọng tâm vừa',
        className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium',
      }
    case 'LOW':
    default:
      return {
        label: 'Bổ trợ',
        className: 'border-muted bg-muted/40 text-muted-foreground font-normal',
      }
  }
}

export default function InterviewReportView({
  session,
  onViewConversation,
}: InterviewReportViewProps) {
  const reportQuery = useSessionReport(session.id, true)
  const retryScoringMutation = useRetryScoring(session.id)

  const report = reportQuery.data
  const isPending = reportQuery.isPending && !report
  const isFailed = report ? report.status === 'SCORING_FAILED' : session.status === 'SCORING_FAILED'
  const isScoring = !isFailed && (report ? report.status === 'SCORING' : session.status === 'SCORING')

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
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
              <AlertCircle className="size-6" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  Quá trình chấm điểm gặp sự cố
                </h3>
                {report?.scoringErrorCode && (
                  <Badge variant="outline" className="text-[10px] font-mono border-destructive/30 text-destructive">
                    {report.scoringErrorCode}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {report?.scoringErrorMessage ||
                  session.statusMessage ||
                  'Mô hình AI bị quá thời gian xử lý khi phân tích nội dung phỏng vấn hoặc kết nối bị gián đoạn. Bạn có thể bấm Thử chấm điểm lại bên dưới.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleRetryScoring()}
              disabled={retryScoringMutation.isPending}
              className="gap-1.5 shadow-xs text-xs"
            >
              <RefreshCw className={cn('size-3.5', retryScoringMutation.isPending && 'animate-spin')} />
              <span>{retryScoringMutation.isPending ? 'Đang gửi lại...' : 'Thử chấm điểm lại'}</span>
            </Button>
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

  const rep = report.report
  const overallScore = rep?.score ?? report.overallScore ?? null
  const technicalScore = rep?.scores?.technical?.score ?? report.technicalScore ?? null
  const technicalFeedback = rep?.scores?.technical?.feedback ?? null
  const communicationScore = rep?.scores?.communication?.score ?? report.communicationScore ?? null
  const communicationFeedback = rep?.scores?.communication?.feedback ?? report.communicationFeedback ?? null
  const overallSummary = rep?.summary ?? report.overallSummary ?? null
  const recommendations: ImprovementItem[] = rep?.recommendations
    ? rep.recommendations.map((rec, idx) => ({ title: `Khuyến nghị #${idx + 1}`, summary: rec }))
    : (report.improvements || [])

  const overallTier = getPerformanceTier(overallScore)
  const technicalTier = getPerformanceTier(technicalScore)
  const communicationTier = getPerformanceTier(communicationScore)
  const confidenceBadge = getConfidenceBadge(report.confidence)

  const sortedFocusAreas: FocusAreaResult[] = (
    report.focusAreas && report.focusAreas.length > 0
      ? report.focusAreas
      : (rep?.focusAreas || []).map((fa, index) => ({
          focusAreaId: index + 1,
          code: `FA-${index + 1}`,
          name: fa.name,
          priority: 'HIGH' as const,
          displayOrder: index + 1,
          score: fa.score,
          confidence: 'MEDIUM' as const,
          evidenceStatus: fa.score !== null ? ('SUFFICIENT' as const) : ('NOT_EXPLORED' as const),
          summary: '',
        }))
  ).sort((a, b) => a.displayOrder - b.displayOrder)

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
                  Báo cáo Đánh giá Năng lực Phỏng vấn
                </h2>
                {report.confidence && (
                  <Badge variant="outline" className={cn('text-[11px] font-medium py-0 h-5', confidenceBadge.className)}>
                    {confidenceBadge.label}
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[11px] font-medium py-0 h-5',
                    session.mode === 'VOICE_REALTIME'
                      ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                      : session.mode === 'VOICE_TURN_BASED'
                        ? 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10'
                        : 'border-primary/25 text-primary bg-primary/5',
                  )}
                >
                  {SESSION_MODE_LABEL[session.mode] || session.mode}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                Vị trí: <strong className="text-foreground">{session.jobDescription.title}</strong>
                {session.profile?.headline ? ` • Ứng viên: ${session.profile.headline}` : ''}
                {report.completedAt ? ` • Hoàn tất: ${new Date(report.completedAt).toLocaleString('vi-VN')}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 print:hidden w-full sm:w-auto justify-end">
            {onViewConversation && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewConversation}
                className="gap-1.5 text-xs h-8 shadow-xs"
              >
                <MessageSquare className="size-3.5" />
                <span>Xem đối thoại</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insufficient Evaluation Notice Banner */}
      {overallScore === null && (
        <div className="flex items-start sm:items-center gap-3 p-3.5 sm:p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="space-y-0.5">
            <p className="font-semibold text-xs sm:text-sm text-amber-800 dark:text-amber-300">
              Phiên phỏng vấn chưa đủ điều kiện tính điểm tổng quan
            </p>
            <p className="text-xs text-amber-700/90 dark:text-amber-400/90">
              Ứng viên kết thúc phiên sớm hoặc thời lượng trao đổi chưa đạt tối thiểu 50% độ bao phủ các chủ đề chuyên môn theo yêu cầu JD.
            </p>
          </div>
        </div>
      )}

      {/* 2. Key Metrics Grid (4 Core Scorecards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Overall Score */}
        <Card className={cn('shadow-2xs border transition-colors', overallScore === null && 'border-amber-500/30 bg-amber-500/[0.03]')}>
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
              <span className={cn('text-2xl sm:text-3xl font-black tracking-tight font-mono', overallTier.color)}>
                {overallScore !== null ? overallScore : '--'}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className={cn('text-[11px] leading-tight', overallScore !== null ? 'text-muted-foreground' : 'text-amber-600/90 dark:text-amber-400/90 font-medium')}>
              {overallScore !== null
                ? '80% Chuyên môn + 20% Giao tiếp'
                : 'Chưa đủ 50% độ bao phủ để kết luận điểm tổng'}
            </p>
          </CardContent>
        </Card>

        {/* Technical Score */}
        <Card className={cn('shadow-2xs border transition-colors', technicalScore === null && 'border-amber-500/30 bg-amber-500/[0.03]')}>
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
              <span className={cn('text-2xl sm:text-3xl font-black tracking-tight font-mono', technicalTier.color)}>
                {technicalScore !== null ? technicalScore : '--'}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className={cn('text-[11px] leading-tight', technicalScore !== null ? 'text-muted-foreground' : 'text-amber-600/90 dark:text-amber-400/90 font-medium')}>
              {technicalScore !== null
                ? 'Trung bình trọng số các lĩnh vực kỹ thuật JD'
                : 'Chưa đủ dẫn chứng kỹ thuật'}
            </p>
          </CardContent>
        </Card>

        {/* Communication Score */}
        <Card className={cn('shadow-2xs border transition-colors', communicationScore === null && 'border-amber-500/30 bg-amber-500/[0.03]')}>
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
              <span className={cn('text-2xl sm:text-3xl font-black tracking-tight font-mono', communicationTier.color)}>
                {communicationScore !== null ? communicationScore : '--'}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <p className={cn('text-[11px] leading-tight', communicationScore !== null ? 'text-muted-foreground' : 'text-amber-600/90 dark:text-amber-400/90 font-medium')}>
              {communicationScore !== null
                ? 'Cấu trúc câu trả lời & phản xạ tương tác'
                : 'Chưa đủ tương tác đối thoại'}
            </p>
          </CardContent>
        </Card>

        {/* Coverage or Evaluated Focus Areas */}
        <Card className="shadow-2xs border">
          <CardContent className="p-4 flex flex-col justify-between h-full gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span className="flex items-center gap-1.5">
                <Target className="size-3.5 text-primary" />
                {report.coveragePercentage != null ? 'Độ bao phủ' : 'Chủ đề đánh giá'}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {session.turns?.length || 0} lượt trao đổi
              </span>
            </div>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-primary font-mono">
                {report.coveragePercentage != null ? `${report.coveragePercentage}%` : `${sortedFocusAreas.length}`}
              </span>
              {report.coveragePercentage == null && (
                <span className="text-xs text-muted-foreground ml-1">lĩnh vực</span>
              )}
            </div>
            {report.coveragePercentage != null ? (
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, report.coveragePercentage))}%` }}
                />
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-tight">
                Các trọng tâm chuyên môn theo yêu cầu JD
              </p>
            )}
            {report.coveragePercentage != null && (
              <p className="text-[11px] text-muted-foreground leading-tight">
                Tỷ lệ chủ đề trọng tâm trong JD đã được kiểm tra
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. AI Executive Summaries */}
      <div className="flex flex-col gap-4">
        {/* Overall AI Summary */}
        <Card className="shadow-2xs border bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader className="py-3 px-4 sm:px-5 border-b bg-muted/20">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <span>Đánh giá tổng quan từ AI</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
            {overallSummary || 'Chưa có tóm tắt tổng quan từ hệ thống.'}
          </CardContent>
        </Card>

        {/* Detailed Technical & Communication Breakdown Cards */}
        {(technicalFeedback || communicationFeedback) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Technical Feedback */}
            {technicalFeedback && (
              <Card className="shadow-2xs border">
                <CardHeader className="py-3 px-4 sm:px-5 border-b bg-muted/20">
                  <CardTitle className="text-xs sm:text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Code2 className="size-4 text-primary" />
                      <span>Nhận xét chuyên môn kỹ thuật</span>
                    </span>
                    {technicalScore !== null && (
                      <Badge variant="outline" className={cn('text-[10px] font-semibold py-0', technicalTier.bg, technicalTier.color, technicalTier.border)}>
                        {technicalScore} / 100
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                  {technicalFeedback}
                </CardContent>
              </Card>
            )}

            {/* Communication & Behavioral Feedback */}
            {communicationFeedback && (
              <Card className="shadow-2xs border">
                <CardHeader className="py-3 px-4 sm:px-5 border-b bg-muted/20">
                  <CardTitle className="text-xs sm:text-sm font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <UserCheck className="size-4 text-primary" />
                      <span>Nhận xét kỹ năng trao đổi & giao tiếp</span>
                    </span>
                    {communicationScore !== null && (
                      <Badge variant="outline" className={cn('text-[10px] font-semibold py-0', communicationTier.bg, communicationTier.color, communicationTier.border)}>
                        {communicationScore} / 100
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                  {communicationFeedback}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* 4. Top Key Improvements / Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card className="shadow-2xs border">
          <CardHeader className="py-3 px-4 sm:px-5 border-b bg-amber-500/5">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <TrendingUp className="size-4.5" />
                <span>Trọng tâm cần hoàn thiện & nâng cấp ({recommendations.length})</span>
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                Gợi ý ưu tiên từ AI
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {recommendations.map((item: ImprovementItem, idx: number) => (
                <div
                  key={idx}
                  className="flex flex-col gap-2 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs shadow-2xs hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-amber-950 font-bold text-xs shadow-2xs">
                      #{idx + 1}
                    </span>
                    <h4 className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-xs">
                    {item.summary}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5. Detailed Focus Areas Breakdown */}
      {sortedFocusAreas.length > 0 && (
        <Card className="shadow-2xs border">
          <CardHeader className="py-3 px-4 sm:px-5 border-b bg-muted/20">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <span>Đánh giá chi tiết theo từng lĩnh vực trọng tâm (Focus Areas)</span>
              </span>
              <span className="text-xs font-normal text-muted-foreground">
                {sortedFocusAreas.length} lĩnh vực
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4">
              {sortedFocusAreas.map((area: FocusAreaResult) => {
                const areaScoreTier = getPerformanceTier(area.score)
                const hasDetailedData = Boolean(area.summary && area.summary.trim())

                // Chế độ hiển thị cho schema mới gọn gàng
                if (!hasDetailedData) {
                  return (
                    <div
                      key={area.focusAreaId || area.code || area.name}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-xl border bg-card shadow-2xs hover:border-primary/40 transition-colors"
                    >
                      <div className="space-y-2 flex-1 min-w-0 sm:pr-6">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm sm:text-base text-foreground truncate">
                            {area.name}
                          </span>
                          <span className="text-xs font-mono sm:hidden text-muted-foreground">
                            {typeof area.score === 'number' && !isNaN(area.score) ? `${area.score}/100` : '--'}
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-500',
                              typeof area.score === 'number' && area.score >= 70
                                ? 'bg-emerald-500'
                                : typeof area.score === 'number' && area.score >= 50
                                ? 'bg-amber-500'
                                : 'bg-destructive'
                            )}
                            style={{ width: `${Math.min(100, Math.max(0, typeof area.score === 'number' ? area.score : 0))}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <div className="hidden sm:flex items-baseline gap-1 bg-muted/40 px-3 py-1.5 rounded-lg border">
                          <span className={cn('font-bold text-base sm:text-lg font-mono', typeof area.score === 'number' && !isNaN(area.score) ? areaScoreTier.color : 'text-foreground')}>
                            {typeof area.score === 'number' && !isNaN(area.score) ? area.score : '--'}
                          </span>
                          <span className="text-xs text-muted-foreground">/ 100</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-[11px] font-semibold py-1', areaScoreTier.bg, areaScoreTier.color, areaScoreTier.border)}
                        >
                          {areaScoreTier.label}
                        </Badge>
                      </div>
                    </div>
                  )
                }

                // Chế độ tương thích ngược cho dữ liệu cũ (có đầy đủ summary & tags)
                const evidenceBadge = getEvidenceStatusBadge(area.evidenceStatus)
                const priorityBadge = getPriorityBadge(area.priority)
                const areaConfidenceBadge = getConfidenceBadge(area.confidence)

                return (
                  <div
                    key={area.focusAreaId || area.code}
                    className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5 shadow-2xs transition-colors hover:border-primary/40"
                  >
                    {/* Focus Area Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-sm sm:text-base text-foreground">
                            {area.name}
                          </h4>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {area.code}
                          </Badge>
                          <Badge variant="outline" className={cn('text-[10px] py-0', priorityBadge.className)}>
                            {priorityBadge.label}
                          </Badge>
                          <Badge
                            variant={evidenceBadge.variant}
                            className={cn('text-[10px] py-0 border', evidenceBadge.className)}
                          >
                            {evidenceBadge.label}
                          </Badge>
                        </div>
                      </div>

                      {/* Score display */}
                      <div className="flex items-baseline gap-1.5 bg-muted/30 px-3 py-1.5 rounded-lg border">
                        <span className={cn('font-bold text-base sm:text-lg font-mono', area.score !== null ? areaScoreTier.color : 'text-foreground')}>
                          {area.score !== null ? area.score : '--'}
                        </span>
                        <span className="text-xs text-muted-foreground">/ 100</span>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-semibold ml-1 py-0', areaScoreTier.bg, areaScoreTier.color, areaScoreTier.border)}
                        >
                          {areaScoreTier.label}
                        </Badge>
                      </div>
                    </div>

                    {/* Qualitative AI Summary for this Focus Area */}
                    <div className="bg-muted/20 rounded-xl p-3.5 sm:p-4 border border-border/50 text-xs sm:text-sm leading-relaxed text-foreground/90 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground mb-1">
                        <Sparkles className="size-3.5 text-primary" />
                        <span>Đánh giá năng lực chuyên môn:</span>
                      </div>
                      <p className="whitespace-pre-line text-muted-foreground">
                        {area.summary}
                      </p>
                    </div>

                    {/* Footer Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>Độ tin cậy:</span>
                        <Badge variant="outline" className={cn('text-[10px] py-0', areaConfidenceBadge.className)}>
                          {areaConfidenceBadge.label}
                        </Badge>
                      </div>
                      <span className="text-[11px]">
                        Trọng số ưu tiên: {area.priority === 'HIGH' ? 'Cao (x3)' : area.priority === 'MEDIUM' ? 'Vừa (x2)' : 'Cơ bản (x1)'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 6. Bottom Navigation and Call to Action */}
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
