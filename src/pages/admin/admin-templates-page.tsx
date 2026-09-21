import { useState, useEffect } from 'react'
import {
  Archive,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  FileCheck2,
  FileEdit,
  Globe,
  Lock,
  RefreshCw,
  Search,
  Sparkles,
  Star,
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
  useAdminPublishTemplateExtended,
  useAdminReviewTemplate,
  useAdminTemplateDetail,
  useAdminTemplates,
  useAdminUnpublishTemplateExtended,
  useUpdateAdminTemplateMetadata,
} from '@/hooks/use-admin'
import { toast } from 'sonner'
import { getErrorMessage } from '@/api/api-error'
import type { AdminTemplateModerationStatus, AdminTemplateSummaryResponse } from '@/types/admin'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 15

export default function AdminTemplatesPage() {
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 300)
  const [statusFilter, setStatusFilter] = useState<'ALL' | AdminTemplateModerationStatus>('ALL')
  const [page, setPage] = useState(0)

  // Modals state
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [reviewDialogTarget, setReviewDialogTarget] = useState<{
    template: AdminTemplateSummaryResponse
    action: 'APPROVE' | 'REJECT' | 'HIDE'
  } | null>(null)
  const [reviewReason, setReviewReason] = useState('')
  const [autoPublishOnApprove, setAutoPublishOnApprove] = useState(true)

  useEffect(() => {
    setPage(0)
  }, [debouncedKeyword, statusFilter])

  // Queries & Mutations
  const templatesQuery = useAdminTemplates({
    keyword: debouncedKeyword.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    size: PAGE_SIZE,
  })

  const detailQuery = useAdminTemplateDetail(selectedTemplateId)
  const reviewMutation = useAdminReviewTemplate()
  const publishMutation = useAdminPublishTemplateExtended()
  const unpublishMutation = useAdminUnpublishTemplateExtended()
  const metadataMutation = useUpdateAdminTemplateMetadata()

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPage(0)
    void templatesQuery.refetch()
  }

  function handleStatusChange(val: string) {
    setStatusFilter(val as 'ALL' | AdminTemplateModerationStatus)
    setPage(0)
  }

  async function handleConfirmReview() {
    if (!reviewDialogTarget) return
    try {
      const reviewed = await reviewMutation.mutateAsync({
        templateId: reviewDialogTarget.template.id,
        request: {
          action: reviewDialogTarget.action,
          reason: reviewReason.trim() || null,
          expectedVersion: reviewDialogTarget.template.version,
        },
      })

      if (reviewDialogTarget.action === 'APPROVE' && autoPublishOnApprove) {
        await publishMutation.mutateAsync({
          templateId: reviewDialogTarget.template.id,
          expectedVersion: reviewed.template.version,
        })
        toast.success(`Đã duyệt và xuất bản công khai mẫu "${reviewDialogTarget.template.title}" cho cộng đồng!`)
      } else if (reviewDialogTarget.action === 'APPROVE') {
        toast.success(`Đã duyệt mẫu "${reviewDialogTarget.template.title}" (trạng thái: riêng tư)`)
      } else if (reviewDialogTarget.action === 'REJECT') {
        toast.info(`Đã từ chối mẫu "${reviewDialogTarget.template.title}"`)
      }
    } catch (err) {
      toast.error('Xử lý kiểm duyệt thất bại: ' + getErrorMessage(err))
    } finally {
      setReviewDialogTarget(null)
      setReviewReason('')
    }
  }

  async function handleTogglePublish(template: AdminTemplateSummaryResponse) {
    if (template.archivedAt) {
      toast.info('Mẫu này đã được tác giả lưu trữ nên không thể thay đổi trạng thái công khai.')
      return
    }
    if (template.published) {
      await unpublishMutation.mutateAsync({
        templateId: template.id,
        expectedVersion: template.version,
      })
    } else {
      await publishMutation.mutateAsync({
        templateId: template.id,
        expectedVersion: template.version,
      })
    }
  }

  async function handleToggleFeatured(template: AdminTemplateSummaryResponse) {
    await metadataMutation.mutateAsync({
      templateId: template.id,
      request: {
        featured: !template.featured,
        category: template.category,
        displayOrder: 0,
        expectedVersion: template.version,
      },
    })
  }

  const items = templatesQuery.data?.items ?? []
  const totalElements = templatesQuery.data?.totalElements ?? 0
  const totalPages = Math.ceil(totalElements / PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight flex items-center gap-2">
            <FileCheck2 className="size-5 text-primary" />
            <span>Kiểm duyệt & Quản trị Mẫu phỏng vấn (Templates)</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Xét duyệt đề xuất công khai từ người dùng, gắn nhãn nổi bật và quản lý trạng thái xuất bản
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void templatesQuery.refetch()}
            disabled={templatesQuery.isFetching}
            className="gap-1.5 text-xs h-8"
          >
            <RefreshCw className={cn('size-3.5', templatesQuery.isFetching && 'animate-spin')} />
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
                placeholder="Tìm theo tiêu đề mẫu hoặc vị trí tuyển dụng..."
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

            {/* Status Filter */}
            <div className="w-full sm:w-64 shrink-0">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Trạng thái kiểm duyệt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái duyệt</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Chờ duyệt (PENDING_REVIEW)</SelectItem>
                  <SelectItem value="DRAFT">Bản nháp (DRAFT)</SelectItem>
                  <SelectItem value="APPROVED">Đã duyệt (APPROVED)</SelectItem>
                  <SelectItem value="REJECTED">Bị từ chối (REJECTED)</SelectItem>
                  <SelectItem value="HIDDEN">Bị ẩn (HIDDEN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" size="sm" className="h-9 text-xs px-4 shrink-0">
              Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card className="border border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-16 text-center text-xs">ID</TableHead>
                <TableHead className="text-xs">Tiêu đề mẫu</TableHead>
                <TableHead className="text-xs">Người tạo</TableHead>
                <TableHead className="text-xs">Trạng thái duyệt</TableHead>
                <TableHead className="text-xs">Công khai</TableHead>
                <TableHead className="text-xs">Nổi bật</TableHead>
                <TableHead className="text-xs">Ngày tạo</TableHead>
                <TableHead className="text-right text-xs">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templatesQuery.isLoading ? (
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
                    {statusFilter === 'PENDING_REVIEW' ? (
                      <div className="space-y-1.5 max-w-md mx-auto py-2">
                        <p className="font-semibold text-foreground text-xs">Không có mẫu nào đang chờ duyệt (PENDING_REVIEW)</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Hiện tại các mẫu trong hệ thống đều đang ở trạng thái Bản nháp (DRAFT). Ứng viên cần bấm &quot;Gửi duyệt công khai&quot; ở thẻ mẫu để gửi yêu cầu kiểm duyệt tới Admin.
                        </p>
                      </div>
                    ) : statusFilter === 'DRAFT' ? (
                      <p>Không tìm thấy mẫu phỏng vấn nào ở trạng thái Bản nháp (DRAFT).</p>
                    ) : (
                      <p>Không tìm thấy mẫu phỏng vấn nào phù hợp với bộ lọc.</p>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((template) => {
                  const isPending = template.moderationStatus === 'PENDING_REVIEW'
                  const isApproved = template.moderationStatus === 'APPROVED'
                  const isRejected = template.moderationStatus === 'REJECTED'
                  const isHidden = template.moderationStatus === 'HIDDEN'
                  const isDraft = template.moderationStatus === 'DRAFT'

                  return (
                    <TableRow key={template.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="text-center font-mono text-xs text-muted-foreground">
                        #{template.id}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-[240px]">
                          <div className="font-semibold text-xs text-foreground truncate">
                            {template.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate">
                            {template.jobTitle || 'Vị trí tự do'} {template.targetSeniority ? `· ${template.targetSeniority}` : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-[160px]">
                          <div className="font-medium text-xs text-foreground truncate">
                            {template.owner?.fullName || 'Hệ thống'}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate font-mono">
                            {template.owner?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isPending ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          >
                            <Clock className="size-2.5 animate-pulse" />
                            <span>Chờ duyệt</span>
                          </Badge>
                        ) : isApproved ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] gap-1 font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                          >
                            <CheckCircle2 className="size-2.5" />
                            <span>Đã duyệt</span>
                          </Badge>
                        ) : isRejected ? (
                          <Badge variant="destructive" className="text-[10px] gap-1 font-semibold">
                            <XCircle className="size-2.5" />
                            <span>Từ chối</span>
                          </Badge>
                        ) : isHidden ? (
                          <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                            <EyeOff className="size-2.5" />
                            <span>Bị ẩn</span>
                          </Badge>
                        ) : isDraft ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] gap-1 font-medium bg-muted/60 text-muted-foreground border border-border/70"
                          >
                            <FileEdit className="size-2.5" />
                            <span>Bản nháp (DRAFT)</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {template.moderationStatus}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell>
                        {template.archivedAt ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal gap-1 border border-destructive/30 text-destructive bg-destructive/5"
                          >
                            <Archive className="size-2.5" />
                            <span>Đã lưu trữ</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant={template.published ? 'secondary' : 'outline'}
                            className={cn(
                              'text-[10px] font-normal gap-1 border',
                              template.published
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                                : 'text-muted-foreground',
                            )}
                          >
                            {template.published ? (
                              <>
                                <Globe className="size-2.5" />
                                <span>Công khai</span>
                              </>
                            ) : (
                              <>
                                <Lock className="size-2.5" />
                                <span>Riêng tư</span>
                              </>
                            )}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={metadataMutation.isPending}
                          onClick={() => void handleToggleFeatured(template)}
                          className={cn(
                            'h-6 px-2 text-[10px] gap-1 rounded-full',
                            template.featured
                              ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-500/10'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                          title="Gắn / Bỏ nhãn nổi bật"
                        >
                          <Star className={cn('size-3', template.featured && 'fill-amber-500 text-amber-500')} />
                          <span className="hidden sm:inline">{template.featured ? 'Nổi bật' : 'Bình thường'}</span>
                        </Button>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(template.createdAt).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Nút Xem chi tiết */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedTemplateId(template.id)}
                            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                            title="Xem chi tiết nội dung & thông số mẫu"
                          >
                            <Eye className="size-3.5" />
                            <span className="hidden sm:inline">Xem</span>
                          </Button>

                          {/* Phê duyệt nhanh nếu đang pending */}
                          {isPending && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAutoPublishOnApprove(true)
                                  setReviewDialogTarget({ template, action: 'APPROVE' })
                                }}
                                className="h-7 px-2 text-xs gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 font-medium"
                                title="Phê duyệt và công khai mẫu này"
                              >
                                <CheckCircle2 className="size-3" />
                                <span>Duyệt</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setReviewDialogTarget({ template, action: 'REJECT' })}
                                className="h-7 px-2 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                title="Từ chối mẫu này"
                              >
                                <XCircle className="size-3" />
                                <span>Từ chối</span>
                              </Button>
                            </>
                          )}

                          {/* Đã duyệt -> Công khai / Gỡ công khai hoặc Đã lưu trữ */}
                          {isApproved && (
                            template.archivedAt ? (
                              <span className="text-[11px] text-muted-foreground/60 italic px-2">Đã lưu trữ</span>
                            ) : (
                              <Button
                                variant={template.published ? 'outline' : 'default'}
                                size="sm"
                                disabled={publishMutation.isPending || unpublishMutation.isPending}
                                onClick={() => void handleTogglePublish(template)}
                                className={cn(
                                  'h-7 px-2 text-xs gap-1',
                                  !template.published && 'bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs',
                                  template.published && 'text-muted-foreground hover:text-destructive',
                                )}
                                title={template.published ? 'Gỡ công khai' : 'Mẫu đã duyệt. Bấm để công khai ngay cho cộng đồng ứng viên'}
                              >
                                {template.published ? <EyeOff className="size-3" /> : <Globe className="size-3" />}
                                <span>{template.published ? 'Gỡ' : 'Công khai ngay'}</span>
                              </Button>
                            )
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
            Tổng cộng <strong>{totalElements}</strong> mẫu phỏng vấn
          </span>
          <DataPagination
            page={page}
            totalPages={totalPages}
            totalElements={totalElements}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemName="mẫu"
          />
        </div>
      </Card>

      {/* Review Dialog */}
      <Dialog open={Boolean(reviewDialogTarget)} onOpenChange={(open) => !open && setReviewDialogTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {reviewDialogTarget?.action === 'APPROVE'
                ? 'Phê duyệt mẫu phỏng vấn'
                : reviewDialogTarget?.action === 'REJECT'
                  ? 'Từ chối mẫu phỏng vấn'
                  : 'Ẩn mẫu phỏng vấn'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mẫu: <strong>{reviewDialogTarget?.template.title}</strong> (#{reviewDialogTarget?.template.id})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <label className="font-medium text-foreground block">
              Lý do hoặc ghi chú phản hồi cho tác giả (không bắt buộc khi duyệt):
            </label>
            <Textarea
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder={
                reviewDialogTarget?.action === 'REJECT'
                  ? 'Nêu rõ lý do từ chối để ứng viên chỉnh sửa lại...'
                  : 'Ghi chú kiểm duyệt...'
              }
              className="text-xs min-h-[80px]"
            />

            {reviewDialogTarget?.action === 'APPROVE' && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/80 bg-muted/40 mt-1">
                <input
                  type="checkbox"
                  id="autoPublishOnApprove"
                  checked={autoPublishOnApprove}
                  onChange={(e) => setAutoPublishOnApprove(e.target.checked)}
                  className="size-4 rounded border-border text-primary cursor-pointer"
                />
                <label htmlFor="autoPublishOnApprove" className="text-xs font-medium text-foreground cursor-pointer select-none">
                  Đồng thời xuất bản công khai cho cộng đồng ngay sau khi duyệt (Khuyến nghị)
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewDialogTarget(null)}
              disabled={reviewMutation.isPending}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              variant={reviewDialogTarget?.action === 'REJECT' ? 'destructive' : 'default'}
              onClick={() => void handleConfirmReview()}
              disabled={reviewMutation.isPending}
              className="text-xs gap-1.5"
            >
              {reviewMutation.isPending && <RefreshCw className="size-3 animate-spin" />}
              <span>Xác nhận</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={Boolean(selectedTemplateId)} onOpenChange={(open) => !open && setSelectedTemplateId(null)}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto no-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>Chi tiết mẫu #{selectedTemplateId}</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Nội dung bộ câu hỏi kỹ năng, thống kê sử dụng và thông tin kiểm duyệt
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detailQuery.data ? (
            <div className="space-y-4 py-2 text-xs">
              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl border border-border/80 bg-muted/20 text-center">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Lượt xem:</span>
                  <strong className="text-foreground font-semibold text-sm">
                    {detailQuery.data.totalViews}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Lượt yêu thích:</span>
                  <strong className="text-foreground font-semibold text-sm">
                    {detailQuery.data.favoriteCount}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Số phiên đã tạo:</span>
                  <strong className="text-primary font-semibold text-sm">
                    {detailQuery.data.interviewSessionCount}
                  </strong>
                </div>
              </div>

              {/* Template Info Card */}
              <div className="p-3.5 rounded-xl border border-border/80 bg-card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">
                      {detailQuery.data.template.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {detailQuery.data.template.jobTitle || 'Chưa đặt vị trí'} · Seniority:{' '}
                      {detailQuery.data.template.targetSeniority || 'All'}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    v{detailQuery.data.template.version}
                  </Badge>
                </div>

                {detailQuery.data.template.content?.summary && (
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {detailQuery.data.template.content.summary}
                  </p>
                )}
              </div>

              {/* Skills list */}
              {detailQuery.data.template.content?.keySkills && detailQuery.data.template.content.keySkills.length > 0 && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-foreground text-xs">Bộ kỹ năng trọng tâm:</h5>
                  <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {detailQuery.data.template.content.keySkills.map((skill, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2 rounded-lg border border-border/60 bg-muted/10 flex items-center justify-between gap-2 text-[11px]"
                      >
                        <span className="font-medium text-foreground">{skill.name}</span>
                        <Badge
                          variant={skill.level === 'MUST_HAVE' ? 'destructive' : 'secondary'}
                          className="text-[9px] px-1.5 py-0"
                        >
                          {skill.level}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Author & Reviewer Info */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground p-3 rounded-xl border border-border/80 bg-muted/10">
                <div>
                  <span className="block font-medium text-foreground">Tác giả:</span>
                  <span>{detailQuery.data.owner?.fullName || detailQuery.data.owner?.email}</span>
                </div>
                <div>
                  <span className="block font-medium text-foreground">Người duyệt:</span>
                  <span>{detailQuery.data.reviewedBy?.fullName || detailQuery.data.reviewedBy?.email || 'Chưa duyệt'}</span>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
