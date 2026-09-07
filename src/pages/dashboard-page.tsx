import { Award, FileUp, MessageSquareText, UserRoundPen, ArrowRight, Play } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import PageHeader from '@/components/page-header'
import CvUploadDialog from '@/features/profile/components/cv-upload-dialog'
import { useAuth } from '@/hooks/use-auth'
import { useCandidateProfiles } from '@/hooks/use-candidate-profile'
import { useSessions } from '@/hooks/use-interview-session'
import { PRESET_TEMPLATES } from '@/features/session/data/preset-templates'
import { ROUTES, sessionDetailPath } from '@/constants/routes'
import { SESSION_STATUS_LABEL } from '@/constants/session'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const profilesQuery = useCandidateProfiles()
  const activeSessionsQuery = useSessions('ACTIVE', 0, 5)
  const historySessionsQuery = useSessions('HISTORY', 0, 10)

  const profiles = profilesQuery.data ?? []
  const activeSessions = activeSessionsQuery.data?.items ?? []
  const historySessions = historySessionsQuery.data?.items ?? []

  // Metrics
  const confirmedProfilesCount = profiles.filter((p) => p.confirmedAt !== null).length
  const totalSessionsCount = activeSessions.length + historySessions.length
  const scoredSessions = historySessions.filter((s) => s.overallScore !== null)
  const avgScore =
    scoredSessions.length > 0
      ? Math.round(
          scoredSessions.reduce((acc, curr) => acc + (curr.overallScore || 0), 0) /
            scoredSessions.length,
        )
      : null

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title={`Xin chào, ${user?.fullName ?? 'bạn'}!`}
        description="Chào mừng bạn đến với Nền tảng Luyện Phỏng vấn AI thực chiến. Hãy chọn một mẫu phỏng vấn hoặc tạo phiên mới để bắt đầu."
      />


      {/* Hero Stats & Quick Actions Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Hồ sơ ứng viên</p>
              <p className="text-2xl font-bold tracking-tight">{profiles.length}</p>
              <p className="text-[11px] text-muted-foreground">
                {confirmedProfilesCount} hồ sơ đã xác nhận
              </p>
            </div>
            <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <UserRoundPen className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Phiên phỏng vấn</p>
              <p className="text-2xl font-bold tracking-tight">{totalSessionsCount}</p>
              <p className="text-[11px] text-muted-foreground">
                {activeSessions.length} đang diễn ra · {historySessions.length} đã hoàn thành
              </p>
            </div>
            <div className="size-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquareText className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Điểm đánh giá TB</p>
              <p className="text-2xl font-bold tracking-tight">
                {avgScore !== null ? `${avgScore}/100` : 'Chưa có'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {scoredSessions.length > 0
                  ? `Dựa trên ${scoredSessions.length} phiên đã chấm`
                  : 'Hoàn thành phiên để nhận điểm'}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <Award className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Banner */}
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-primary/10 via-card to-background shadow-sm">
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-semibold">
              <span>Sẵn sàng luyện tập ngay</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Bắt đầu buổi phỏng vấn mô phỏng với AI
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lựa chọn vị trí mong muốn từ kho mẫu phỏng vấn chuẩn hóa hoặc tải lên JD tuyển dụng thực tế. AI sẽ tự động phân tích CV và JD để đối thoại phỏng vấn tự do theo thời lượng phù hợp nhất cho bạn.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
            <CvUploadDialog
              onSuccess={() => void profilesQuery.refetch()}
              trigger={
                <Button variant="outline" className="gap-2">
                  <FileUp className="size-4" />
                  Tải CV mới
                </Button>
              }
            />
            <Button size="lg" asChild className="gap-2 shadow-md shadow-primary/20">
              <Link to={ROUTES.sessionCreate}>
                <Play className="size-4 fill-current" />
                Luyện phỏng vấn ngay
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Preset Templates */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Vị trí phỏng vấn gợi ý</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Các mẫu phỏng vấn tiêu chuẩn được thiết kế sẵn sàng để bạn bắt đầu luyện tập tức thì.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
            <Link to={ROUTES.sessionCreate}>
              Xem tất cả
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {PRESET_TEMPLATES.slice(0, 3).map((tmpl) => (
            <Card
              key={tmpl.id}
              className="flex flex-col justify-between transition-all hover:border-primary/50 hover:shadow-xs"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {tmpl.targetSeniority}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {tmpl.content?.keySkills.length} tiêu chí
                  </span>
                </div>
                <CardTitle className="text-sm font-semibold pt-1 line-clamp-1">
                  {tmpl.title}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2">
                  {tmpl.content?.summary}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs gap-1.5 mt-2"
                  onClick={() => navigate(ROUTES.sessionCreate)}
                >
                  <Play className="size-3 fill-current" />
                  Luyện vị trí này
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">Phiên phỏng vấn gần đây</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Theo dõi tiến độ luyện tập và xem lại báo cáo phân tích năng lực của bạn.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs gap-1">
            <Link to={ROUTES.sessionList}>
              Tất cả phiên
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>

        {activeSessions.length === 0 && historySessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Bạn chưa có phiên phỏng vấn nào.</p>
              <Button size="sm" asChild>
                <Link to={ROUTES.sessionCreate}>Bắt đầu phiên đầu tiên ngay</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {[...activeSessions, ...historySessions].slice(0, 4).map((session) => {
              const isCompleted = session.status === 'COMPLETED'
              return (
                <div
                  key={session.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card/60 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {session.jobDescriptionTitle}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {SESSION_STATUS_LABEL[session.status]}
                      </Badge>
                      {isCompleted && session.overallScore !== null && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold text-success bg-success/10 shrink-0"
                        >
                          {session.overallScore}/100 điểm
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.profileHeadline || 'Hồ sơ ứng viên'} · Thời lượng{' '}
                      {session.durationMinutes ? `${session.durationMinutes} phút` : '30 phút'} · Đối thoại trực tiếp ·
                      Cập nhật{' '}
                      {new Date(session.lastActivityAt || session.createdAt).toLocaleDateString(
                        'vi-VN',
                      )}
                    </p>
                  </div>
                  <Button size="sm" asChild className="shrink-0 gap-1.5 text-xs">
                    <Link to={sessionDetailPath(session.id)}>
                      {isCompleted ? (
                        <>
                          <Award className="size-3.5" />
                          Xem báo cáo
                        </>
                      ) : (
                        <>
                          <Play className="size-3.5 fill-current" />
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
    </div>
  )
}
