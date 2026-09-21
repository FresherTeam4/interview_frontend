import {
  Award,
  Briefcase,
  FileUp,
  MessageSquareText,
  UserRoundPen,
  ArrowRight,
  Play,
  Plus,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/page-header'
import CvUploadDialog from '@/features/profile/components/cv-upload-dialog'
import CreateInterviewDialog from '@/features/session/components/wizard/create-interview-dialog'
import { useAuth } from '@/hooks/use-auth'
import { useCandidateProfiles } from '@/hooks/use-candidate-profile'
import { useInterviewProgress, useSessions } from '@/hooks/use-interview-session'
import { useInterviewTemplates } from '@/hooks/use-interview-templates'
import { ROUTES, sessionDetailPath, profileDetailPath } from '@/constants/routes'
import { SESSION_MODE_LABEL, SESSION_STATUS_LABEL } from '@/constants/session'
import { formatDate } from '@/lib/format'

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const profilesQuery = useCandidateProfiles()
  const templatesQuery = useInterviewTemplates('mine', 0, 50)
  const activeSessionsQuery = useSessions('ACTIVE', 0, 5)
  const historySessionsQuery = useSessions('HISTORY', 0, 10)
  const progressQuery = useInterviewProgress(30)

  const profiles = profilesQuery.data ?? []
  const templates = templatesQuery.data?.content?.filter((t) => !t.archivedAt) ?? []
  const activeSessions = activeSessionsQuery.data?.items ?? []
  const historySessions = historySessionsQuery.data?.items ?? []
  const progress = progressQuery.data

  // Metrics
  const confirmedProfilesCount = profiles.filter((p) => p.confirmedAt !== null).length
  const confirmedRolesCount = templates.filter((t) => t.confirmed).length
  const totalSessionsCount = activeSessions.length + historySessions.length

  const recentSessions = [...activeSessions, ...historySessions].slice(0, 5)

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={
          isAdmin ? (
            <div className="flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="sm"
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-xs"
              >
                <Link to={ROUTES.adminOverview}>
                  <ShieldCheck className="size-4" />
                  <span>Quay lại Quản trị</span>
                </Link>
              </Button>
              <Badge
                variant="outline"
                className="text-xs font-normal text-muted-foreground border-border/80 py-1 px-2.5 bg-muted/40"
              >
                Chế độ xem giao diện người dùng
              </Badge>
            </div>
          ) : (
            `Xin chào, ${user?.fullName ?? 'bạn'}!`
          )
        }
        actions={
          <div className="flex items-center gap-2">
            <CvUploadDialog
              onSuccess={() => void profilesQuery.refetch()}
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <FileUp className="size-3.5" />
                  Tải CV mới
                </Button>
              }
            />
            <CreateInterviewDialog
              trigger={
                <Button size="sm" className="gap-1.5 text-xs shadow-xs">
                  <Plus className="size-3.5" />
                  Tạo phiên phỏng vấn
                </Button>
              }
            />
          </div>
        }
      />

      {/* Compact Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Hồ sơ ứng viên</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{profiles.length}</span>
              <span className="text-[11px] text-muted-foreground">({confirmedProfilesCount} đã xác nhận)</span>
            </div>
          </div>
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <UserRoundPen className="size-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Phiên phỏng vấn</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{totalSessionsCount}</span>
              <span className="text-[11px] text-muted-foreground">
                {activeSessions.length} đang chạy · {historySessions.length} xong
              </span>
            </div>
          </div>
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MessageSquareText className="size-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">Vị trí phỏng vấn</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{templates.length}</span>
              <span className="text-[11px] text-muted-foreground">({confirmedRolesCount} đã duyệt)</span>
            </div>
          </div>
          <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Briefcase className="size-5" />
          </div>
        </div>
      </div>

      {/* Progress & Skills Insight Card */}
      {progress && (
        <div className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Flame className="size-4" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">
                Tiến độ & Hiệu suất ({progress.periodDays} ngày qua)
              </h3>
            </div>
            {progress.overallChangeFromPreviousPeriod != null && (
              <Badge
                variant="outline"
                className={`text-xs gap-1 ${
                  progress.overallChangeFromPreviousPeriod >= 0
                    ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                    : 'text-destructive border-destructive/30 bg-destructive/10'
                }`}
              >
                {progress.overallChangeFromPreviousPeriod >= 0 ? (
                  <TrendingUp className="size-3" />
                ) : (
                  <TrendingDown className="size-3" />
                )}
                {progress.overallChangeFromPreviousPeriod > 0 ? '+' : ''}
                {progress.overallChangeFromPreviousPeriod}% so với kỳ trước
              </Badge>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
              <p className="text-[11px] text-muted-foreground">Tỷ lệ hoàn thành</p>
              <p className="text-xl font-bold text-foreground">
                {typeof progress.completionRate === 'number'
                  ? `${(progress.completionRate <= 1 ? progress.completionRate * 100 : progress.completionRate).toFixed(0)}%`
                  : 'N/A'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {progress.completedSessions}/{progress.totalSessions} phiên kết thúc
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
              <p className="text-[11px] text-muted-foreground">Điểm trung bình</p>
              <p className="text-xl font-bold text-foreground">
                {progress.averages?.overall != null ? `${Number(progress.averages.overall).toFixed(1)}/100` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {progress.scoredSessions} phiên đã chấm điểm
              </p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
              <p className="text-[11px] text-muted-foreground">Điểm chuyên môn (Tech)</p>
              <p className="text-xl font-bold text-foreground">
                {progress.averages?.technical != null ? `${Number(progress.averages.technical).toFixed(1)}/100` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">Độ chính xác kỹ thuật</p>
            </div>

            <div className="rounded-lg border bg-muted/20 p-3 space-y-1">
              <p className="text-[11px] text-muted-foreground">Điểm giao tiếp</p>
              <p className="text-xl font-bold text-foreground">
                {progress.averages?.communication != null ? `${Number(progress.averages.communication).toFixed(1)}/100` : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">Độ lưu loát & mạch lạc</p>
            </div>
          </div>

          {/* Weak Focus Areas */}
          {progress.weakFocusAreas && progress.weakFocusAreas.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0 font-medium">
                <AlertCircle className="size-3 text-amber-500" />
                Kỹ năng cần chú ý luyện tập:
              </span>
              {progress.weakFocusAreas.map((skill) => (
                <Badge
                  key={skill.code}
                  variant="outline"
                  className="text-[11px] bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1"
                >
                  <Target className="size-2.5" />
                  {skill.name} ({Number(skill.averageScore).toFixed(0)}đ)
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main 2-Column Productivity Workspace */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Recent Sessions */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Phiên phỏng vấn gần đây</h3>
              <Badge variant="secondary" className="text-xs font-medium">
                {recentSessions.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs gap-1 h-8">
              <Link to={ROUTES.sessionList}>
                Tất cả phiên
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>

          {recentSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3 bg-muted/10">
              <p className="text-xs text-muted-foreground">Bạn chưa có phiên phỏng vấn nào.</p>
              <CreateInterviewDialog
                trigger={
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Plus className="size-3.5" />
                    Bắt đầu phiên đầu tiên
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid gap-2.5">
              {recentSessions.map((session) => {
                const isCompleted = session.status === 'COMPLETED'
                return (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-border/70 bg-card/60 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {session.templateTitle || 'Buổi phỏng vấn'}
                        </span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {SESSION_STATUS_LABEL[session.status] ?? session.status}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0 font-normal border border-primary/20 text-primary bg-primary/5"
                        >
                          {SESSION_MODE_LABEL[session.mode] || session.mode}
                        </Badge>
                        {typeof session.overallScore === 'number' && !isNaN(session.overallScore) ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-500/15 shrink-0"
                          >
                            {Math.round(session.overallScore)}/100 điểm
                          </Badge>
                        ) : session.status === 'COMPLETED' ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50/5 shrink-0"
                            title="Chưa đủ dữ liệu điểm"
                          >
                            Chưa đủ dữ liệu điểm
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.profileName || 'Hồ sơ'} ·{' '}
                        {SESSION_MODE_LABEL[session.mode] || session.mode} ·{' '}
                        {session.durationMinutes ? `${session.durationMinutes} phút` : '30 phút'} ·{' '}
                        {formatDate(session.createdAt)}
                      </p>

                    </div>
                    <Button size="sm" asChild className="shrink-0 gap-1 text-xs h-8">
                      <Link to={sessionDetailPath(session.id)}>
                        {isCompleted ? (
                          <>
                            <Award className="size-3" />
                            Báo cáo
                          </>
                        ) : (
                          <>
                            <Play className="size-3 fill-current" />
                            Tiếp tục
                          </>
                        )}
                      </Link>
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Candidate Profiles Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Hồ sơ ứng viên</h3>
              <Badge variant="secondary" className="text-xs font-medium">
                {profiles.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs gap-1 h-8">
              <Link to={ROUTES.profile}>
                Xem tất cả
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center space-y-3 bg-muted/10">
              <p className="text-xs text-muted-foreground">Chưa có hồ sơ nào.</p>
              <CvUploadDialog
                onSuccess={() => void profilesQuery.refetch()}
                trigger={
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                    <FileUp className="size-3.5" />
                    Tải CV lên ngay
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid gap-2.5">
              {profiles.slice(0, 4).map((p) => {
                const isConfirmed = p.confirmedAt !== null
                return (
                  <Link
                    key={p.id}
                    to={profileDetailPath(p.id)}
                    className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border/70 bg-card/60 hover:border-primary/50 transition-colors group"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                          {p.headline || 'Hồ sơ chưa có tiêu đề'}
                        </span>
                        {isConfirmed ? (
                          <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="size-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.targetPosition || 'Chưa chọn vị trí'} · {p.skillCount} kỹ năng · {p.projectCount} dự án
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
