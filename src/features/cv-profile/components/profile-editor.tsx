import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Save, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Link, useBlocker, useNavigate } from 'react-router'
import { toast } from 'sonner'
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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import CompareLayoutToggle from '@/features/cv-profile/components/compare-layout-toggle'
import CvPdfViewer from '@/features/cv-profile/components/cv-pdf-viewer'
import EducationListEditor from '@/features/cv-profile/components/education-list-editor'
import GuideTourButton from '@/features/cv-profile/components/guide-tour-button'
import OpenCvPdfButton from '@/features/cv-profile/components/open-cv-pdf-button'
import ProfileConfirmBadge from '@/features/cv-profile/components/profile-confirm-badge'
import ProfileGeneralForm from '@/features/cv-profile/components/profile-general-form'
import ProfileMetaPopover from '@/features/cv-profile/components/profile-meta-popover'
import ProjectListEditor from '@/features/cv-profile/components/project-list-editor'
import SkillListEditor from '@/features/cv-profile/components/skill-list-editor'
import {
  readStoredCompareLayout,
  storeCompareLayout,
} from '@/features/cv-profile/lib/compare-layout'
import type { CompareLayout } from '@/features/cv-profile/lib/compare-layout'
import {
  areProfileDraftsEqual,
  createProfileDraft,
  prepareProfilePayload,
} from '@/features/cv-profile/lib/profile-payload'
import type { ProfileDraft } from '@/features/cv-profile/lib/profile-payload'
import {
  mapServerFieldErrors,
  validateProfileDraft,
} from '@/features/cv-profile/lib/profile-validation'
import type { ProfileFieldErrors } from '@/features/cv-profile/lib/profile-validation'
import { PROFILE_EDITOR_TOUR_ID, profileEditorTourSteps } from '@/features/cv-profile/lib/tour'
import { useConfirmProfile, useUpdateProfile } from '@/hooks/use-profile'
import { isApiError } from '@/api/api-error'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import type { CandidateProfile } from '@/types/cv-profile'

interface ProfileEditorProps {
  profile: CandidateProfile
}

/** Tỉ lệ hai cột theo bố cục người dùng chọn; dưới lg luôn là một cột. */
const compareGridClasses: Record<CompareLayout, string> = {
  cv: 'lg:grid-cols-[minmax(0,1.75fr)_minmax(0,1fr)]',
  split: 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]',
  form: 'lg:grid-cols-1',
}

export default function ProfileEditor({ profile }: ProfileEditorProps) {
  const navigate = useNavigate()
  const initialDraft = createProfileDraft(profile)
  const [draft, setDraft] = useState<ProfileDraft>(initialDraft)
  const [savedDraft, setSavedDraft] = useState<ProfileDraft>(initialDraft)
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmedAt, setConfirmedAt] = useState(profile.confirmedAt)
  const [compareLayout, setCompareLayout] = useState<CompareLayout>(readStoredCompareLayout)
  const updateMutation = useUpdateProfile(profile.id)
  const confirmMutation = useConfirmProfile(profile.id)
  const isDirty = !areProfileDraftsEqual(draft, savedDraft)
  const isBusy = updateMutation.isPending || confirmMutation.isPending
  // Sau khi lưu xong ta chủ động rời trang, nên phải tắt cảnh báo "chưa lưu" cho lần điều hướng đó.
  const allowLeaveRef = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !allowLeaveRef.current && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      if (!isDirty) return
      event.preventDefault()
    }

    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [isDirty])

  function updateDraft(updater: (current: ProfileDraft) => ProfileDraft) {
    setDraft(updater)
    setFieldErrors({})
    setFormError(null)
  }

  function backToCvList() {
    allowLeaveRef.current = true
    navigate(ROUTES.cvs)
  }

  function changeCompareLayout(next: CompareLayout) {
    setCompareLayout(next)
    storeCompareLayout(next)
  }
  async function saveDraft(showSuccessToast = true): Promise<CandidateProfile | null> {
    const validationErrors = validateProfileDraft(draft)
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      setFormError('Vui lòng kiểm tra lại các trường được đánh dấu.')
      toast.error('Hồ sơ còn thông tin chưa hợp lệ.')
      return null
    }

    try {
      const savedProfile = await updateMutation.mutateAsync(prepareProfilePayload(draft))
      // Thay toàn bộ state bằng response để các mục mới nhận đúng id, tránh lưu lần sau bị nhân bản.
      const nextDraft = createProfileDraft(savedProfile)
      setDraft(nextDraft)
      setSavedDraft(nextDraft)
      setConfirmedAt(savedProfile.confirmedAt)
      setFieldErrors({})
      setFormError(null)
      if (showSuccessToast) toast.success('Đã lưu thay đổi hồ sơ.')
      return savedProfile
    } catch (error) {
      if (isApiError(error)) {
        const serverErrors = mapServerFieldErrors(error.fieldErrors)
        if (error.code === 'DUPLICATE_SKILL_NAME' && Object.keys(serverErrors).length === 0) {
          serverErrors.skills = 'Hồ sơ có kỹ năng trùng tên. Vui lòng kiểm tra lại.'
        }
        setFieldErrors(serverErrors)
        setFormError(error.message)
        toast.error(error.message)
      } else {
        setFormError('Không thể lưu hồ sơ. Vui lòng thử lại.')
        toast.error('Không thể lưu hồ sơ.')
      }
      return null
    }
  }

  async function handleSave() {
    const savedProfile = await saveDraft()
    if (savedProfile) backToCvList()
  }

  async function handleConfirm() {
    if (isDirty && !(await saveDraft(false))) return

    try {
      const confirmedProfile = await confirmMutation.mutateAsync()
      const nextDraft = createProfileDraft(confirmedProfile)
      setDraft(nextDraft)
      setSavedDraft(nextDraft)
      setConfirmedAt(confirmedProfile.confirmedAt)
      setFormError(null)
      toast.success('Đã lưu và xác nhận hồ sơ.')
      backToCvList()
    } catch (error) {
      const message = isApiError(error) ? error.message : 'Không thể xác nhận hồ sơ.'
      setFormError(message)
      toast.error(message)
    }
  }
  return (
    // Trang rộng hơn khung max-w-7xl của layout để hai cột đủ chỗ đối chiếu; canh giữa bằng margin
    // âm thay vì left/translate để còn dùng được position sticky. Chiều cao khung cố định trừ đi
    // 4rem header của site và 2rem*2 padding dọc của main.
    <div className="ml-[calc(50%-min(50vw-1rem,55rem))] flex w-[min(100vw-2rem,110rem)] flex-col gap-4 lg:sticky lg:top-24 lg:h-[calc(100dvh-8rem)]">
      {/* Header gói trong một hàng; mọi text phụ nằm trong popover để không lấn chiều cao khung CV. */}
      <header className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon-sm" asChild className="-ml-1">
          <Link to={ROUTES.cvs} aria-label="Về CV &amp; hồ sơ của tôi" title="CV &amp; hồ sơ của tôi">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="font-heading truncate text-lg font-semibold tracking-tight">
          Kiểm tra hồ sơ
        </h1>
        <ProfileMetaPopover profile={profile} />
        <GuideTourButton
          tourId={PROFILE_EDITOR_TOUR_ID}
          steps={profileEditorTourSteps}
          autoStartWhenReady
        />

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <ProfileConfirmBadge confirmed={Boolean(confirmedAt)} />
          {isDirty && <Badge variant="secondary">Chưa lưu</Badge>}
          <div data-tour="profile-layout">
            <CompareLayoutToggle value={compareLayout} onChange={changeCompareLayout} />
          </div>
          <OpenCvPdfButton
            cvId={profile.cvDocumentId}
            label="Mở CV"
            className={compareLayout === 'form' ? undefined : 'lg:hidden'}
          />
        </div>
      </header>

      <div
        className={cn(
          'grid items-start gap-5 lg:min-h-0 lg:flex-1 lg:items-stretch',
          compareGridClasses[compareLayout],
        )}
      >
        {compareLayout !== 'form' && (
          <div data-tour="profile-pdf" className="hidden min-h-0 lg:block">
            <CvPdfViewer
              cvId={profile.cvDocumentId}
              filename={profile.cvOriginalFilename}
              className="h-full"
            />
          </div>
        )}
        <form
          data-tour="profile-form"
          className="flex min-w-0 flex-col gap-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSave()
          }}
        >
          {formError && (
            <p className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              {formError}
            </p>
          )}

          <ProfileGeneralForm
            draft={draft}
            errors={fieldErrors}
            onChange={(field, value) => updateDraft((current) => ({ ...current, [field]: value }))}
          />

          <EducationListEditor
            items={draft.educations}
            errors={fieldErrors}
            onChange={(educations) => updateDraft((current) => ({ ...current, educations }))}
          />

          <SkillListEditor
            items={draft.skills}
            errors={fieldErrors}
            onChange={(skills) => updateDraft((current) => ({ ...current, skills }))}
          />

          <ProjectListEditor
            items={draft.projects}
            errors={fieldErrors}
            onChange={(projects) => updateDraft((current) => ({ ...current, projects }))}
          />
          <div
            data-tour="profile-actions"
            className="sticky bottom-3 z-20 flex flex-col gap-3 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="text-sm text-muted-foreground">
              {isDirty
                ? 'Có thay đổi chưa lưu. Sau khi lưu bạn sẽ trở về danh sách CV & hồ sơ.'
                : 'Mọi thay đổi đã được lưu.'}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" variant="outline" disabled={!isDirty || isBusy}>
                {updateMutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Lưu thay đổi
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirm()}
                disabled={isBusy || (Boolean(confirmedAt) && !isDirty)}
              >
                {confirmMutation.isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                {isDirty
                  ? 'Lưu và xác nhận'
                  : confirmedAt
                    ? 'Đã xác nhận'
                    : 'Xác nhận thông tin chính xác'}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <AlertDialog open={blocker.state === 'blocked'}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rời trang khi chưa lưu?</AlertDialogTitle>
            <AlertDialogDescription>
              Những thay đổi bạn vừa nhập sẽ bị mất nếu tiếp tục rời trang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>Ở lại chỉnh sửa</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => blocker.proceed?.()}>
              Rời trang
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

