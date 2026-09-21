import { useState } from 'react'
import {
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  Globe,
  Lock,
  Play,
  TriangleAlert,
  Eye,
  MoreVertical,
  Archive,
  Copy,
  Heart,
  Send,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDateTime } from '@/lib/format'
import { getInterviewTemplate } from '@/api/template'
import {
  useArchiveInterviewTemplate,
  useCloneInterviewTemplate,
  useFavoriteInterviewTemplate,
  usePublishInterviewTemplate,
  useSubmitTemplateForReview,
  useUnfavoriteInterviewTemplate,
  useUnpublishInterviewTemplate,
} from '@/hooks/use-interview-templates'
import { useAuth } from '@/hooks/use-auth'
import { ROLES } from '@/constants/roles'
import { getErrorMessage } from '@/api/api-error'
import type { InterviewTemplateSummary } from '@/types/template'

interface RoleCardProps {
  role: InterviewTemplateSummary
  onViewDetail: (roleId: number) => void
  onPractice: (role: InterviewTemplateSummary) => void
  onArchive?: (role: InterviewTemplateSummary) => void
  isFavorited?: boolean
  isCommunity?: boolean
}

export default function RoleCard({
  role,
  onViewDetail,
  onPractice,
  onArchive,
  isFavorited = false,
  isCommunity = false,
}: RoleCardProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === ROLES.ADMIN

  const archiveMutation = useArchiveInterviewTemplate()
  const publishMutation = usePublishInterviewTemplate()
  const unpublishMutation = useUnpublishInterviewTemplate()
  const cloneMutation = useCloneInterviewTemplate()
  const favoriteMutation = useFavoriteInterviewTemplate()
  const unfavoriteMutation = useUnfavoriteInterviewTemplate()
  const submitReviewMutation = useSubmitTemplateForReview()

  const [isArchiving, setIsArchiving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [favorited, setFavorited] = useState(isFavorited)

  async function handleSubmitReview() {
    setIsSubmittingReview(true)
    try {
      const full = await getInterviewTemplate(role.id)
      await submitReviewMutation.mutateAsync({
        id: role.id,
        expectedVersion: full.version,
      })
      toast.success(`Đã gửi mẫu "${role.title}" vào danh sách chờ duyệt của ban quản trị`)
    } catch (err) {
      toast.error('Gửi kiểm duyệt thất bại: ' + getErrorMessage(err))
    } finally {
      setIsSubmittingReview(false)
    }
  }

  async function handleToggleFavorite() {
    try {
      if (favorited) {
        await unfavoriteMutation.mutateAsync(role.id)
        setFavorited(false)
        toast.success(`Đã bỏ yêu thích: ${role.title}`)
      } else {
        await favoriteMutation.mutateAsync(role.id)
        setFavorited(true)
        toast.success(`Đã thêm vào mục yêu thích: ${role.title}`)
      }
    } catch (err) {
      toast.error('Thao tác yêu thích thất bại: ' + getErrorMessage(err))
    }
  }

  async function handleClone() {
    setIsCloning(true)
    try {
      const cloned = await cloneMutation.mutateAsync({
        id: role.id,
        data: { title: `${role.title} (Bản sao)` },
      })
      toast.success(`Đã nhân bản thành công vị trí: ${cloned.title}`)
    } catch (err) {
      toast.error('Nhân bản vị trí thất bại: ' + getErrorMessage(err))
    } finally {
      setIsCloning(false)
    }
  }

  async function handleTogglePublish() {
    setIsPublishing(true)
    try {
      const full = await getInterviewTemplate(role.id)
      if (role.published) {
        await unpublishMutation.mutateAsync({
          id: role.id,
          expectedVersion: full.version,
        })
        toast.success(`Đã chuyển "${role.title}" về trạng thái riêng tư`)
      } else {
        await publishMutation.mutateAsync({
          id: role.id,
          expectedVersion: full.version,
        })
        toast.success(`Đã công khai "${role.title}" cho cộng đồng`)
      }
    } catch (err) {
      toast.error('Cập nhật trạng thái công khai thất bại: ' + getErrorMessage(err))
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleQuickArchive() {
    const confirmed = window.confirm(`Bạn có chắc muốn lưu trữ vị trí "${role.title}"? Vị trí này sẽ được ẩn khỏi danh sách.`)
    if (!confirmed) return

    setIsArchiving(true)
    try {
      if (onArchive) {
        onArchive(role)
      } else {
        const full = await getInterviewTemplate(role.id)
        await archiveMutation.mutateAsync({
          id: role.id,
          expectedVersion: full.version,
        })
        toast.success(`Đã lưu trữ vị trí: ${role.title}`)
      }
    } catch (err) {
      toast.error('Lưu trữ vị trí thất bại: ' + getErrorMessage(err))
    } finally {
      setIsArchiving(false)
    }
  }

  return (
    <Card className="flex flex-col justify-between hover:shadow-md transition-all border-border/80 group py-0 gap-0">
      <div className="p-3.5 space-y-2">
        {/* Top badges & action menu */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {role.published ? (
              <Badge variant="secondary" className="gap-1 text-[11px] bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200">
                <Globe className="size-3" />
                Công khai
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground">
                <Lock className="size-3" />
                Riêng tư
              </Badge>
            )}

            {role.targetSeniority && (
              <Badge variant="outline" className="text-[11px] font-semibold">
                {role.targetSeniority}
              </Badge>
            )}

            {/* Trạng thái tiêu chí của ứng viên */}
            {!role.confirmed ? (
              <Badge variant="outline" className="gap-1 text-[11px] text-amber-600 border-amber-300 bg-amber-50/50 dark:bg-amber-950/30" title="Ứng viên chưa chốt tiêu chí phỏng vấn">
                <TriangleAlert className="size-3" />
                Chưa chốt tiêu chí
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-[11px] text-emerald-600 border-emerald-300/80 bg-emerald-50/30 dark:bg-emerald-950/20" title="Tiêu chí phỏng vấn đã được xác nhận sẵn sàng">
                <BadgeCheck className="size-3" />
                Tiêu chí sẵn sàng
              </Badge>
            )}

            {/* Trạng thái kiểm duyệt của Admin */}
            {role.moderationStatus === 'PENDING_REVIEW' && (
              <Badge variant="outline" className="gap-1 text-[11px] text-amber-600 border-amber-500/40 bg-amber-500/10" title="Đang trong hàng đợi chờ Admin kiểm duyệt công khai">
                <Clock className="size-3 animate-pulse" />
                Chờ Admin duyệt
              </Badge>
            )}
            {role.moderationStatus === 'APPROVED' && !role.published && (
              <Badge variant="outline" className="gap-1 text-[11px] text-emerald-600 border-emerald-500/40 bg-emerald-500/10" title="Admin đã duyệt, chờ công khai">
                <CheckCircle2 className="size-3" />
                Admin đã duyệt
              </Badge>
            )}
            {role.moderationStatus === 'REJECTED' && (
              <Badge variant="destructive" className="gap-1 text-[11px]" title={role.moderationReason ? `Lý do: ${role.moderationReason}` : 'Bị Admin từ chối duyệt'}>
                <XCircle className="size-3" />
                Bị từ chối
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-rose-500 transition-colors"
              onClick={() => void handleToggleFavorite()}
              title={favorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
            >
              <Heart
                className={`size-3.5 ${favorited ? 'fill-rose-500 text-rose-500' : ''}`}
              />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                  title="Thao tác khác"
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 text-xs">
                <DropdownMenuItem onClick={() => onViewDetail(role.id)} className="gap-2 cursor-pointer">
                  <Eye className="size-3.5" />
                  <span>{isCommunity || role.published || role.confirmed ? 'Xem tiêu chí' : 'Xem & sửa tiêu chí'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onPractice(role)} className="gap-2 cursor-pointer">
                  <Play className="size-3.5 fill-current" />
                  Luyện tập vị trí này
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => void handleClone()}
                  disabled={isCloning}
                  className="gap-2 cursor-pointer"
                >
                  <Copy className="size-3.5" />
                  <span>{isCommunity ? 'Nhân bản về kho của tôi' : 'Nhân bản vị trí'}</span>
                </DropdownMenuItem>

                {/* Các tính năng chỉ khả dụng ở tab cá nhân ("Của tôi") */}
                {!isCommunity && (
                  <>
                    {/* Trạng thái gửi duyệt công khai */}
                    {role.published ? (
                      <DropdownMenuItem disabled className="gap-2 text-blue-600/80 font-medium">
                        <Globe className="size-3.5" />
                        Đã công khai trên cộng đồng
                      </DropdownMenuItem>
                    ) : role.moderationStatus === 'PENDING_REVIEW' ? (
                      <DropdownMenuItem disabled className="gap-2 text-amber-600/80 font-medium">
                        <Clock className="size-3.5" />
                        Đang chờ Admin duyệt công khai
                      </DropdownMenuItem>
                    ) : role.moderationStatus === 'APPROVED' ? (
                      <DropdownMenuItem disabled className="gap-2 text-emerald-600/80 font-medium">
                        <CheckCircle2 className="size-3.5" />
                        Admin đã duyệt (chờ xuất bản)
                      </DropdownMenuItem>
                    ) : role.moderationStatus === 'REJECTED' ? (
                      <DropdownMenuItem
                        onClick={() => void handleSubmitReview()}
                        disabled={isSubmittingReview || !role.confirmed}
                        className="gap-2 cursor-pointer text-amber-600 dark:text-amber-400 font-medium"
                      >
                        <Send className="size-3.5" />
                        Gửi duyệt lại công khai
                      </DropdownMenuItem>
                    ) : role.confirmed ? (
                      <DropdownMenuItem
                        onClick={() => void handleSubmitReview()}
                        disabled={isSubmittingReview}
                        className="gap-2 cursor-pointer text-amber-600 dark:text-amber-400 font-medium"
                      >
                        <Send className="size-3.5" />
                        Gửi duyệt công khai
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        disabled
                        className="gap-2 text-muted-foreground opacity-60"
                        title="Bạn cần xác nhận tiêu chí trước khi có thể gửi duyệt công khai"
                      >
                        <Send className="size-3.5" />
                        Chưa chốt tiêu chí để gửi duyệt
                      </DropdownMenuItem>
                    )}

                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => void handleTogglePublish()}
                          disabled={isPublishing}
                          className="gap-2 cursor-pointer text-blue-600 dark:text-blue-400"
                        >
                          <Globe className="size-3.5" />
                          {role.published ? 'Gỡ công khai' : 'Công khai vị trí'}
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => void handleQuickArchive()}
                      disabled={isArchiving}
                      className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                    >
                      <Archive className="size-3.5" />
                      Lưu trữ vị trí
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title & Job Title Subtitle */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground leading-snug truncate" title={role.title}>
            {role.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5" title={role.jobTitle || 'Trích xuất từ JD'}>
            <Briefcase className="size-3 shrink-0 text-muted-foreground/70" />
            <span className="truncate">
              {role.jobTitle && role.title.trim().toLowerCase() !== role.jobTitle.trim().toLowerCase()
                ? role.jobTitle
                : 'Trích xuất từ JD'}
            </span>
          </p>
        </div>
      </div>

      {/* Footer action buttons & timestamp */}
      <div className="p-3 pt-2 px-3.5 border-t border-border/40 bg-muted/5 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => onViewDetail(role.id)}
          >
            <Eye className="size-3.5" />
            Xem tiêu chí
          </Button>

          <Button
            size="sm"
            className="gap-1.5 text-xs font-semibold h-8 shadow-xs"
            onClick={() => onPractice(role)}
          >
            <Play className="size-3.5 fill-current" />
            Phỏng vấn
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground/60 text-right leading-none">
          {formatDateTime(role.updatedAt)}
        </div>
      </div>
    </Card>
  )
}
