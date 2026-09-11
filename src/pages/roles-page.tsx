import { useState } from 'react'
import {
  Briefcase,
  Globe,
  Lock,
  Search,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Empty,
  EmptyContent,
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
import type { InterviewTemplate, InterviewTemplateSummary } from '@/types/template'

const SENIORITIES = ['ALL', 'INTERN', 'FRESHER', 'JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD'] as const
const PAGE_SIZE = 6

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<'mine' | 'public'>('mine')
  const [searchQuery, setSearchQuery] = useState('')
  const [seniorityFilter, setSeniorityFilter] = useState<string>('ALL')

  const [minePage, setMinePage] = useState(0)
  const [publicPage, setPublicPage] = useState(0)

  const [detailRoleId, setDetailRoleId] = useState<number | null>(null)
  const [practiceTemplate, setPracticeTemplate] = useState<InterviewTemplate | null>(null)
  const [practiceDialogOpen, setPracticeDialogOpen] = useState(false)

  const mineQuery = useInterviewTemplates('mine', 0, 100)
  const publicQuery = useInterviewTemplates('public', 0, 100)

  const currentQuery = activeTab === 'mine' ? mineQuery : publicQuery
  const currentList = currentQuery.data?.content || []

  const currentPage = activeTab === 'mine' ? minePage : publicPage
  const setCurrentPage = activeTab === 'mine' ? setMinePage : setPublicPage

  const filteredRoles = currentList.filter((role) => {
    if (role.archivedAt) return false
    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !q ||
      role.title?.toLowerCase().includes(q) ||
      role.jobTitle?.toLowerCase().includes(q)

    const matchesSeniority =
      seniorityFilter === 'ALL' ||
      role.targetSeniority?.toUpperCase() === seniorityFilter.toUpperCase()

    return matchesSearch && matchesSeniority
  })

  const totalPages = Math.ceil(filteredRoles.length / PAGE_SIZE) || 1
  const safePage = Math.min(currentPage, totalPages - 1)
  const paginatedRoles = filteredRoles.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  )

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
        // Fallback
        setPracticeTemplate(null)
      }
    }
  }

  function renderContent() {
    if (currentQuery.isPending) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      )
    }

    if (currentQuery.isError) {
      return (
        <ErrorState
          message={getErrorMessage(currentQuery.error)}
          onRetry={() => void currentQuery.refetch()}
        />
      )
    }

    if (filteredRoles.length === 0) {
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
                  : 'Chưa có vị trí phỏng vấn công khai nào'}
            </EmptyTitle>
            <EmptyDescription>
              {activeTab === 'mine'
                ? 'Tải lên tài liệu mô tả công việc (JD) để AI thiết lập khung năng lực và tiêu chí phỏng vấn.'
                : 'Các vị trí được ban quản trị công khai sẽ xuất hiện ở đây để mọi người cùng luyện tập.'}
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            {activeTab === 'mine' && (
              <CreateRoleDialog
                trigger={
                  <Button className="gap-2">
                    <Sparkles className="size-4" />
                    Tạo vị trí mới từ JD
                  </Button>
                }
              />
            )}
          </EmptyContent>
        </Empty>
      )
    }

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginatedRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onViewDetail={(id) => setDetailRoleId(id)}
              onPractice={handleStartPractice}
            />
          ))}
        </div>

        <DataPagination
          page={safePage}
          totalPages={totalPages}
          totalElements={filteredRoles.length}
          pageSize={PAGE_SIZE}
          onPageChange={(newPage) => setCurrentPage(newPage)}
          itemName="vị trí"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Vị trí phỏng vấn"
        actions={
          <CreateRoleDialog
            trigger={
              <Button className="gap-2">
                <Sparkles className="size-4" />
                Tạo vị trí mới từ JD
              </Button>
            }
          />
        }
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'mine' | 'public')} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <TabsList className="h-10">
            <TabsTrigger value="mine" className="gap-2 px-3 text-sm">
              <Lock className="size-3.5" />
              Vị trí của tôi
              {mineQuery.data?.content && (
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {mineQuery.data.content.filter((r) => !r.archivedAt).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-2 px-3 text-sm">
              <Globe className="size-3.5" />
              Vị trí công khai
              {publicQuery.data?.content && (
                <span className="ml-1 rounded-full bg-muted-foreground/15 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {publicQuery.data.content.filter((r) => !r.archivedAt).length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Search and Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên vị trí..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setMinePage(0)
                  setPublicPage(0)
                }}
                className="pl-8 text-xs h-9"
              />
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
                  onClick={() => {
                    setSeniorityFilter(lvl)
                    setMinePage(0)
                    setPublicPage(0)
                  }}
                  className={`text-[11px] px-2 py-1 rounded-md transition-colors shrink-0 font-medium ${seniorityFilter === lvl
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {lvl === 'ALL' ? 'Tất cả' : lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <TabsContent value="mine" className="pt-6">
          {renderContent()}
        </TabsContent>

        <TabsContent value="public" className="pt-6">
          {renderContent()}
        </TabsContent>
      </Tabs>

      {/* Role Detail Modal */}
      <RoleDetailDialog
        templateId={detailRoleId}
        open={detailRoleId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailRoleId(null)
        }}
        onStartPractice={handleStartPractice}
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
