import { useState, useEffect } from 'react'
import {
  Briefcase,
  Eye,
  FileText,
  Flame,
  Lock,
  MessageSquareText,
  RefreshCw,
  Search,
  Shield,
  Unlock,
  UserCheck,
  Users,
  X,
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import DataPagination from '@/components/data-pagination'
import { useAdminUserDetail, useAdminUsers, useUpdateUserStatus } from '@/hooks/use-admin'
import { ROLES, type UserRole } from '@/constants/roles'
import type { AdminUserSummary } from '@/types/admin'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 15

export default function AdminUsersPage() {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'BLOCKED'>('ALL')
  const [page, setPage] = useState(0)

  // Tự động về trang 1 khi từ khóa tìm kiếm hoặc bộ lọc thay đổi
  useEffect(() => {
    setPage(0)
  }, [debouncedKeyword, roleFilter, statusFilter])

  // Modals state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [userToToggle, setUserToToggle] = useState<AdminUserSummary | null>(null)

  // Queries & mutations
  const usersQuery = useAdminUsers({
    keyword: debouncedKeyword.trim() || undefined,
    role: roleFilter === 'ALL' ? undefined : roleFilter,
    enabled: statusFilter === 'ALL' ? undefined : statusFilter === 'ACTIVE',
    page,
    size: PAGE_SIZE,
  })

  const detailQuery = useAdminUserDetail(selectedUserId)
  const updateStatusMutation = useUpdateUserStatus()

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(0)
    void usersQuery.refetch()
  }

  function handleRoleChange(val: string) {
    setRoleFilter(val as 'ALL' | UserRole)
    setPage(0)
  }

  function handleStatusChange(val: string) {
    setStatusFilter(val as 'ALL' | 'ACTIVE' | 'BLOCKED')
    setPage(0)
  }

  async function handleConfirmToggleStatus() {
    if (!userToToggle) return
    const newStatus = !userToToggle.enabled
    await updateStatusMutation.mutateAsync({
      userId: userToToggle.id,
      enabled: newStatus,
    })
    setUserToToggle(null)
  }

  const items = usersQuery.data?.items ?? []
  const totalElements = usersQuery.data?.totalElements ?? 0
  const totalPages = Math.ceil(totalElements / PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <span>Quản lý tài khoản người dùng</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Tra cứu thông tin, phân quyền và kiểm soát quyền truy cập tài khoản trên hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void usersQuery.refetch()}
            disabled={usersQuery.isFetching}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={cn('size-3.5', usersQuery.isFetching && 'animate-spin')} />
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
            <div className="relative flex-1">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Tìm theo tên hoặc địa chỉ email..."
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

            {/* Role Filter */}
            <div className="w-full sm:w-44 shrink-0">
              <Select value={roleFilter} onValueChange={handleRoleChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                  <SelectItem value="USER">Ứng viên (USER)</SelectItem>
                  <SelectItem value="ADMIN">Quản trị (ADMIN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44 shrink-0">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="BLOCKED">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" size="sm" className="h-9 text-xs px-4 shrink-0">
              Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center text-xs">ID</TableHead>
                <TableHead className="text-xs">Người dùng</TableHead>
                <TableHead className="text-xs">Vai trò</TableHead>
                <TableHead className="text-xs">Trạng thái</TableHead>
                <TableHead className="text-xs">Ngày tham gia</TableHead>
                <TableHead className="text-right text-xs">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell colSpan={6} className="py-3">
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-xs text-muted-foreground">
                    Không tìm thấy người dùng nào phù hợp với bộ lọc.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((user) => {
                  const isAdmin = user.role === ROLES.ADMIN
                  return (
                    <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        #{user.id}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'size-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                              isAdmin
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                : 'bg-primary/10 text-primary',
                            )}
                          >
                            {user.fullName?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-xs text-foreground truncate">
                              {user.fullName || 'Chưa đặt tên'}
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate font-mono">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAdmin ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          >
                            <Shield className="size-2.5" />
                            <span>ADMIN</span>
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            USER
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.enabled ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          >
                            Hoạt động
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-medium text-destructive border-destructive/30 bg-destructive/10"
                          >
                            Đã khóa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Xem chi tiết */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserId(user.id)}
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            title="Xem chi tiết hồ sơ & dữ liệu"
                          >
                            <Eye className="size-3.5" />
                            <span className="hidden sm:inline">Chi tiết</span>
                          </Button>

                          {/* Khóa/Mở khóa */}
                          <Button
                            variant={user.enabled ? 'outline' : 'default'}
                            size="sm"
                            disabled={isAdmin || updateStatusMutation.isPending}
                            onClick={() => setUserToToggle(user)}
                            className={cn(
                              'h-7 px-2.5 text-xs gap-1 font-medium',
                              user.enabled
                                ? 'text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white',
                            )}
                            title={
                              isAdmin
                                ? 'Không thể khóa tài khoản Quản trị viên'
                                : user.enabled
                                  ? 'Khóa quyền truy cập của người dùng này'
                                  : 'Mở khóa tài khoản người dùng'
                            }
                          >
                            {user.enabled ? (
                              <>
                                <Lock className="size-3" />
                                <span className="hidden sm:inline">Khóa</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="size-3" />
                                <span className="hidden sm:inline">Mở</span>
                              </>
                            )}
                          </Button>
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
            Tổng cộng <strong>{totalElements}</strong> tài khoản
          </span>
          <DataPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemName="người dùng"
          />
        </div>
      </Card>

      {/* User Detail Modal */}
      <Dialog open={Boolean(selectedUserId)} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              <span>Chi tiết tài khoản người dùng</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Thông tin định danh và dữ liệu hoạt động phỏng vấn của người dùng
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : detailQuery.data ? (
            <div className="space-y-4 py-2">
              {/* User Identity Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-muted/20">
                <div
                  className={cn(
                    'size-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0',
                    detailQuery.data.role === ROLES.ADMIN
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {detailQuery.data.fullName?.charAt(0) || detailQuery.data.email.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-foreground truncate">
                      {detailQuery.data.fullName || 'Chưa cập nhật tên'}
                    </h4>
                    <Badge variant={detailQuery.data.enabled ? 'outline' : 'destructive'} className="text-[10px]">
                      {detailQuery.data.enabled ? 'Hoạt động' : 'Đã khóa'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate">{detailQuery.data.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Tham gia ngày: {new Date(detailQuery.data.createdAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Data Metrics Grid */}
              <div>
                <h5 className="text-xs font-semibold text-foreground mb-2">Dữ liệu phỏng vấn liên kết</h5>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl border border-border/80 bg-card">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[11px] font-medium">Hồ sơ CV (Active)</span>
                      <FileText className="size-3.5 text-blue-500" />
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {detailQuery.data.activeCvCount}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-border/80 bg-card">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[11px] font-medium">Vị trí JD (Active)</span>
                      <Briefcase className="size-3.5 text-purple-500" />
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {detailQuery.data.activeJdCount}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-border/80 bg-card">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[11px] font-medium">Tổng số phiên</span>
                      <MessageSquareText className="size-3.5 text-primary" />
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {detailQuery.data.totalSessionCount}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-border/80 bg-card">
                    <div className="flex items-center justify-between text-muted-foreground mb-1">
                      <span className="text-[11px] font-medium">Phiên hoàn thành</span>
                      <Flame className="size-3.5 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {detailQuery.data.completedSessionCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Confirm Lock / Unlock Alert Dialog */}
      <AlertDialog open={Boolean(userToToggle)} onOpenChange={(open) => !open && setUserToToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold flex items-center gap-2">
              {userToToggle?.enabled ? (
                <>
                  <Lock className="size-4 text-destructive" />
                  <span>Xác nhận khóa tài khoản</span>
                </>
              ) : (
                <>
                  <Unlock className="size-4 text-emerald-600" />
                  <span>Xác nhận mở khóa tài khoản</span>
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed">
              {userToToggle?.enabled ? (
                <>
                  Bạn có chắc chắn muốn khóa tài khoản <strong>{userToToggle?.email}</strong>?
                  Khi bị khóa, toàn bộ phiên đăng nhập hiện tại của người dùng sẽ bị thu hồi và họ không thể tiếp tục sử dụng hệ thống.
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn mở lại quyền truy cập cho tài khoản <strong>{userToToggle?.email}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleConfirmToggleStatus()}
              disabled={updateStatusMutation.isPending}
              className={cn(
                'text-xs h-8 font-medium',
                userToToggle?.enabled ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'bg-emerald-600 text-white hover:bg-emerald-700',
              )}
            >
              {updateStatusMutation.isPending ? 'Đang xử lý...' : userToToggle?.enabled ? 'Xác nhận khóa' : 'Mở khóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
