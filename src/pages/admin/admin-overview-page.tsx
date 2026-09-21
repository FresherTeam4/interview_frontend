import { useState } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
  Layers,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminOverview } from '@/hooks/use-admin'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

export default function AdminOverviewPage() {
  const [periodDays, setPeriodDays] = useState<number>(7)
  const { data: overview, isLoading, isError, refetch, isFetching } = useAdminOverview(periodDays)

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="size-5 text-primary" />
            <span>Chỉ số vận hành hệ thống</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Thống kê tài khoản, hiệu suất phỏng vấn và trạng thái dịch vụ AI trong kỳ đã chọn
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Tabs
            value={String(periodDays)}
            onValueChange={(val) => setPeriodDays(Number(val))}
            className="w-auto"
          >
            <TabsList className="h-8 bg-muted/60 p-0.5 rounded-lg">
              <TabsTrigger value="7" className="text-xs px-2.5 py-1">
                7 ngày
              </TabsTrigger>
              <TabsTrigger value="14" className="text-xs px-2.5 py-1">
                14 ngày
              </TabsTrigger>
              <TabsTrigger value="30" className="text-xs px-2.5 py-1">
                30 ngày
              </TabsTrigger>
              <TabsTrigger value="90" className="text-xs px-2.5 py-1">
                90 ngày
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Button
            variant="outline"
            size="icon"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="size-8 rounded-lg"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={cn('size-3.5', isFetching && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : isError || !overview ? (
        <Card className="p-6 border-destructive/30 bg-destructive/5 text-center">
          <p className="text-sm font-medium text-destructive mb-2">
            Không thể tải dữ liệu tổng quan quản trị
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </Card>
      ) : (
        <>
          {/* Main Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 1. Total Users */}
            <Card className="border border-border/80 bg-card shadow-xs">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Tổng người dùng
                </CardTitle>
                <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {overview.users.total.toLocaleString('vi-VN')}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                    <UserPlus className="size-3" />
                    +{overview.users.newInPeriod} mới
                  </span>
                  <span>·</span>
                  <span>{overview.users.enabled} hoạt động</span>
                </div>
              </CardContent>
            </Card>

            {/* 2. Total Sessions in Period */}
            <Card className="border border-border/80 bg-card shadow-xs">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Phiên phỏng vấn trong kỳ
                </CardTitle>
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Flame className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {overview.sessions.totalInPeriod.toLocaleString('vi-VN')}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {overview.sessions.inProgress} đang chạy
                  </span>
                  <span>·</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    {overview.sessions.completed} đã hoàn thành
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 3. Completion Rate */}
            <Card className="border border-border/80 bg-card shadow-xs">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Tỉ lệ hoàn thành phiên
                </CardTitle>
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {overview.sessions.completionRate.toFixed(1)}%
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{overview.sessions.completed} / {overview.sessions.totalInPeriod || 1} phiên</span>
                </div>
              </CardContent>
            </Card>

            {/* 4. Public Templates */}
            <Card className="border border-border/80 bg-card shadow-xs">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Kho mẫu công khai (Roles)
                </CardTitle>
                <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <BookOpen className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {overview.templates.published}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <span>Mẫu vai trò sẵn sàng phục vụ</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operational Issues & Health Section */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* System Health / Failed Sessions Monitoring */}
            <Card className="border border-border/80 bg-card shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                      <AlertTriangle className="size-4 text-amber-500" />
                      <span>Cảnh báo sự cố vận hành AI</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Các phiên phỏng vấn gặp sự cố cần quản trị viên can thiệp hoặc thử lại
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="text-xs gap-1 h-7 text-muted-foreground">
                    <Link to={`${ROUTES.adminSessions}?status=SCORING_FAILED`}>
                      <span>Xem tất cả</span>
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground/80">Lỗi chuẩn bị (Prep)</span>
                      <XCircle className="size-4 text-destructive" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-destructive">
                        {overview.sessions.preparationFailed}
                      </span>
                      <span className="text-[11px] text-muted-foreground">phiên</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Lỗi AI tạo kịch bản focus areas
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground/80">Lỗi chấm điểm (Scoring)</span>
                      <AlertTriangle className="size-4 text-amber-500" />
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {overview.sessions.scoringFailed}
                      </span>
                      <span className="text-[11px] text-muted-foreground">phiên</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Lỗi AI phân tích tổng hợp báo cáo
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground flex items-center justify-between">
                  <span>Thời điểm tính toán: {new Date(overview.generatedAt).toLocaleString('vi-VN')}</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {periodDays} ngày qua
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions & Navigation */}
            <Card className="border border-border/80 bg-card shadow-xs flex flex-col justify-between">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <SlidersHorizontal className="size-4 text-primary" />
                  <span>Lối tắt quản trị nhanh</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Truy cập nhanh các phân khu nghiệp vụ quản trị viên
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2.5 pt-0">
                <Link
                  to={ROUTES.adminUsers}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <UserCheck className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Quản lý tài khoản người dùng
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Tìm kiếm, xem chi tiết và kiểm soát khóa/mở tài khoản
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to={ROUTES.adminSessions}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <Clock className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Giám sát vận hành các phiên phỏng vấn
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Theo dõi timeline lifecycle, lỗi và kích hoạt retry
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>

                <Link
                  to={ROUTES.roles}
                  className="flex items-center justify-between p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/40 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Layers className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        Quản lý & Xuất bản Kho mẫu vai trò (Roles)
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Công khai (Publish) mẫu vị trí cho cộng đồng ứng viên
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
