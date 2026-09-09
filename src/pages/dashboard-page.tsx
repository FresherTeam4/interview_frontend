import { Award, Briefcase, FileUp, MessageSquareText, UserRoundPen, ArrowRight, Play, Plus, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/page-header'
import CvUploadDialog from '@/features/profile/components/cv-upload-dialog'
import CreateInterviewDialog from '@/features/session/components/wizard/create-interview-dialog'
import { useAuth } from '@/hooks/use-auth'
import { useCandidateProfiles } from '@/hooks/use-candidate-profile'
import { useSessions } from '@/hooks/use-interview-session'
import { useInterviewTemplates } from '@/hooks/use-interview-templates'
import { ROUTES, sessionDetailPath, profileDetailPath } from '@/constants/routes'
import { SESSION_STATUS_LABEL } from '@/constants/session'

export default function DashboardPage() {
  const { user } = useAuth()
  const profilesQuery = useCandidateProfiles()
  const templatesQuery = useInterviewTemplates('mine', 0, 50)
  const activeSessionsQuery = useSessions('ACTIVE', 0, 5)
  const historySessionsQuery = useSessions('HISTORY', 0, 10)

  const profiles = profilesQuery.data ?? []
  const templates = templatesQuery.data?.content?.filter((t) => !t.archivedAt) ?? []
  const activeSessions = activeSessionsQuery.data?.items ?? []
  const historySessions = historySessionsQuery.data?.items ?? []

  // Metrics
  const confirmedProfilesCount = profiles.filter((p) => p.confirmedAt !== null).length
  const confirmedRolesCount = templates.filter((t) => t.confirmed).length
  const totalSessionsCount = activeSessions.length + historySessions.length

  const recentSessions = [...activeSessions, ...historySessions].slice(0, 5)

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader
        title={`Xin chào, ${user?.fullName ?? 'bạn'}!`}
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
                          {session.jobDescriptionTitle}
                        </span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {SESSION_STATUS_LABEL[session.status]}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0 font-normal border border-primary/20 text-primary bg-primary/5"
                        >
                          {session.mode === 'TEXT' ? 'Văn bản' : 'Giọng nói'}
                        </Badge>
                        {isCompleted && session.overallScore !== null && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold text-success bg-success/10 shrink-0"
                          >
                            {session.overallScore}/100
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.profileHeadline || 'Hồ sơ'} ·{' '}
                        {session.mode === 'TEXT' ? 'Phỏng vấn Văn bản' : 'Phỏng vấn Giọng nói'} ·{' '}
                        {session.durationMinutes ? `${session.durationMinutes} phút` : '30 phút'} ·{' '}
                        {new Date(session.lastActivityAt || session.createdAt).toLocaleDateString('vi-VN')}
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
                          <CheckCircle2 className="size-3 text-success shrink-0" />
                        ) : (
                          <AlertCircle className="size-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {p.targetPosition || 'Chưa chọn vị trí'} · {p.skillCount} kỹ năng · {p.projectCount} dự án
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
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
