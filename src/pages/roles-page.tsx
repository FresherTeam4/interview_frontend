import { useState, useEffect } from 'react'
import {
  Briefcase,
  Globe,
  Heart,
  History,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import PageHeader from '@/components/page-header'
import ErrorState from '@/components/error-state'
import RoleCard from '@/features/template/components/role-card'
import RoleDetailDialog from '@/features/template/components/role-detail-dialog'
import CreateRoleDialog from '@/features/template/components/create-role-dialog'
import CreateInterviewDialog from '@/features/session/components/wizard/create-interview-dialog'
import { useInterviewTemplates } from '@/hooks/use-interview-templates'
import { getErrorMessage } from '@/api/api-error'
import { getInterviewTemplate } from '@/api/template'
import DataPagination from '@/components/data-pagination'
import { useDebounce } from '@/hooks/use-debounce'
import type { InterviewTemplate, InterviewTemplateSummary, TemplateScope } from '@/types/template'

const SENIORITIES = ['ALL', 'INTERN', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD'] as const
const PAGE_SIZE = 9

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<TemplateScope>('mine')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 300)
  const [seniorityFilter, setSeniorityFilter] = useState<string>('ALL')
  const [page, setPage] = useState(0)

  const [detailRoleId, setDetailRoleId] = useState<number | null>(null)
  const [practiceTemplate, setPracticeTemplate] = useState<InterviewTemplate | null>(null)
  const [practiceDialogOpen, setPracticeDialogOpen] = useState(false)

  // Reset về trang 1 khi đổi tab hoặc bộ lọc
  useEffect(() => {
    setPage(0)
  }, [activeTab, debouncedSearchQuery, seniorityFilter])

  const templatesQuery = useInterviewTemplates(
    {
      scope: activeTab,
      keyword: debouncedSearchQuery.trim() || undefined,
      seniority: seniorityFilter === 'ALL' ? undefined : seniorityFilter,
      page,
      size: PAGE_SIZE,
    },
    page,
    PAGE_SIZE,
  )

  const templateList = templatesQuery.data?.content || []
  const totalElements = templatesQuery.data?.totalElements ?? templateList.length
  const totalPages = Math.ceil(totalElements / PAGE_SIZE) || 1

  async function handleStartPractice(roleSummaryOrTemplate: InterviewTemplateSummary | InterviewTemplate) {
    if ('content' in roleSummaryOrTemplate && roleSummaryOrTemplate.content) {
      setPracticeTemplate(roleSummaryOrTemplate as InterviewTemplate)
      setPracticeDialogOpen(true)
    } else {
      try {
        const full = await getInterviewTemplate(roleSummaryOrTemplate.id)
        setPracticeTemplate(full)
        setPracticeDialogOpen(true)
      } catch {
        setPracticeTemplate(null)
      }
    }
  }

  function renderContent() {
    if (templatesQuery.isPending) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )
    }

    if (templatesQuery.isError) {
      return (
        <ErrorState
          message={getErrorMessage(templatesQuery.error)}
          onRetry={() => void templatesQuery.refetch()}
        />
      )
    }

    if (templateList.length === 0) {
      return (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Briefcase />
            </EmptyMedia>
            <EmptyTitle>
              {searchQuery || seniorityFilter !== 'ALL'
                ? 'Không tìm thấy vị trí phỏng vấn phù hợp'
                : activeTab === 'mine'
                  ? 'Chưa có vị trí phỏng vấn nào của bạn'
                  : activeTab === 'favorites'
                    ? 'Chưa có vị trí phỏng vấn yêu thích'
                    : activeTab === 'recent'
                      ? 'Chưa có vị trí xem gần đây'
                      : 'Chưa có vị trí phỏng vấn công khai nào'}
            </EmptyTitle>
            <EmptyDescription>
              {searchQuery || seniorityFilter !== 'ALL'
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc cấp độ.'
                : activeTab === 'mine'
                  ? 'Tải lên mô tả công việc (JD) hoặc tạo mẫu phỏng vấn đầu tiên của bạn.'
                  : activeTab === 'favorites'
                    ? 'Bấm nút trái tim ở các vị trí cộng đồng để lưu lại và truy cập nhanh tại đây.'
                    : activeTab === 'recent'
                      ? 'Các vị trí bạn mở xem chi tiết sẽ tự động lưu lại ở đây.'
                      : 'Các vị trí do cộng đồng và ban quản trị duyệt công khai sẽ xuất hiện tại đây.'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templateList.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onViewDetail={(id) => setDetailRoleId(id)}
              onPractice={handleStartPractice}
              isFavorited={activeTab === 'favorites'}
              isCommunity={activeTab === 'public'}
            />
          ))}
        </div>

        <DataPagination
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={PAGE_SIZE}
          onPageChange={(newPage) => setPage(newPage)}
          itemName="vị trí"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <PageHeader
        title="Vị trí phỏng vấn"
        actions={<CreateRoleDialog />}
      />

      {/* Tabs and Filters */}
      <div className="flex flex-col gap-4 border-b pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <Tabs
            value={activeTab}
            onValueChange={(val) => setActiveTab(val as TemplateScope)}
            className="w-auto"
          >
            <TabsList className="bg-muted/70 p-1 flex-wrap h-auto">
              <TabsTrigger value="mine" className="gap-1.5 text-xs font-medium px-3 py-1.5">
                <Briefcase className="size-3.5" />
                Của tôi
              </TabsTrigger>
              <TabsTrigger value="public" className="gap-1.5 text-xs font-medium px-3 py-1.5">
                <Globe className="size-3.5" />
                Cộng đồng
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-1.5 text-xs font-medium px-3 py-1.5">
                <Heart className="size-3.5 text-rose-500 fill-rose-500/20" />
                Yêu thích
              </TabsTrigger>
              <TabsTrigger value="recent" className="gap-1.5 text-xs font-medium px-3 py-1.5">
                <History className="size-3.5" />
                Gần đây
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search and Seniority Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm vị trí hoặc kỹ năng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Seniority Badges */}
            <div className="flex items-center gap-1 overflow-x-auto max-w-full py-1">
              <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1 shrink-0">
                <SlidersHorizontal className="size-3" /> Cấp độ:
              </span>
              {SENIORITIES.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setSeniorityFilter(lvl)}
                  className={`text-[11px] px-2 py-1 rounded-md transition-colors shrink-0 font-medium ${
                    seniorityFilter === lvl
                      ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {lvl === 'ALL' ? 'Tất cả' : lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Role Detail Modal */}
      <RoleDetailDialog
        templateId={detailRoleId}
        open={detailRoleId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailRoleId(null)
        }}
        onStartPractice={handleStartPractice}
        isCommunity={activeTab === 'public'}
      />

      {/* Practice Interview Dialog */}
      {practiceDialogOpen && (
        <CreateInterviewDialog
          open={practiceDialogOpen}
          onOpenChange={setPracticeDialogOpen}
          initialTemplate={practiceTemplate ?? undefined}
          initialTemplateId={practiceTemplate?.id}
        />
      )}
    </div>
  )
}
