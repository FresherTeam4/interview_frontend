import { zodResolver } from '@hookform/resolvers/zod'
import { BadgeCheck, Save, TriangleAlert, Undo2 } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import SuggestionList from '@/components/suggestion-list'
import EducationFields from '@/features/profile/components/education-fields'
import ProfileTextField from '@/features/profile/components/profile-text-field'
import ProjectFields from '@/features/profile/components/project-fields'
import SkillFields from '@/features/profile/components/skill-fields'
import {
  profileSchema,
  toFormValues,
  toUpdateRequest,
  type ProfileFormValues,
} from '@/features/profile/profile-schema'
import { getErrorMessage } from '@/api/api-error'
import { useConfirmCandidateProfile, useUpdateCandidateProfile } from '@/hooks/use-candidate-profile'
import { formatDateTime } from '@/lib/format'
import {
  PROFILE_LIMITS,
  PROFILE_SOURCE_LABEL,
  SENIORITY_LEVEL_SUGGESTIONS,
} from '@/constants/profile'
import type { CandidateProfile } from '@/types/profile'

const SENIORITY_LIST_ID = 'seniority-level-options'

interface ProfileFormProps {
  profile: CandidateProfile
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const updateProfile = useUpdateCandidateProfile(profile.id)
  const confirmProfile = useConfirmCandidateProfile(profile.id)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(profile),
  })

  const { errors, isDirty } = form.formState
  const isBusy = updateProfile.isPending || confirmProfile.isPending

  const handleSave = form.handleSubmit(
    async (values) => {
      try {
        const saved = await updateProfile.mutateAsync(toUpdateRequest(values))
        // Response kèm id của những hàng vừa được thêm → reset để lần lưu sau sửa đúng hàng đó
        // thay vì thêm mới lần nữa.
        form.reset(toFormValues(saved))
        toast.success('Đã lưu hồ sơ.')
      } catch (error) {
        toast.error(getErrorMessage(error))
      }
    },
    () => toast.error('Vui lòng kiểm tra lại các trường được đánh dấu đỏ.'),
  )

  async function handleConfirm() {
    try {
      await confirmProfile.mutateAsync()
      toast.success('Đã xác nhận hồ sơ.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {profile.confirmedAt ? (
          <Alert>
            <BadgeCheck className="text-success" />
            <AlertTitle>Hồ sơ đã được xác nhận</AlertTitle>
            <AlertDescription>
              Xác nhận lúc {formatDateTime(profile.confirmedAt)}.{' '}
              {isDirty
                ? 'Bạn đang có thay đổi chưa lưu — lưu lại để buổi phỏng vấn dùng bản mới nhất.'
                : 'Hồ sơ này chọn được khi tạo buổi phỏng vấn thử.'}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <TriangleAlert />
            <AlertTitle>Hồ sơ chưa được xác nhận</AlertTitle>
            <AlertDescription>
              {isDirty
                ? 'Bạn đang có thay đổi chưa lưu. Lưu hồ sơ trước, rồi xác nhận.'
                : 'Soát lại thông tin AI bóc tách từ CV. Khi đã đúng, bấm xác nhận để mở khoá buổi phỏng vấn.'}
            </AlertDescription>
            <div className="col-start-2 mt-2">
              <Button type="button" size="sm" disabled={isDirty || isBusy} onClick={handleConfirm}>
                {confirmProfile.isPending ? <Spinner /> : <BadgeCheck className="size-4" />}
                Thông tin đã đúng
              </Button>
            </div>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Thông tin chung</CardTitle>
            <CardDescription>
              Quyết định độ khó và hướng câu hỏi mà AI sẽ dùng cho buổi phỏng vấn.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">{PROFILE_SOURCE_LABEL[profile.source]}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <ProfileTextField
              id="headline"
              label="Tiêu đề"
              placeholder="Backend developer 2 năm kinh nghiệm"
              error={errors.headline}
              {...form.register('headline')}
            />
            <ProfileTextField
              id="targetPosition"
              label="Vị trí mong muốn"
              placeholder="Java Backend Developer"
              error={errors.targetPosition}
              {...form.register('targetPosition')}
            />
            <ProfileTextField
              id="yearsExperience"
              label="Số năm kinh nghiệm"
              type="number"
              step="0.5"
              min={0}
              max={PROFILE_LIMITS.yearsExperienceMax}
              inputMode="decimal"
              placeholder="1.5"
              error={errors.yearsExperience}
              {...form.register('yearsExperience')}
            />
            <ProfileTextField
              id="seniorityLevel"
              label="Cấp độ"
              list={SENIORITY_LIST_ID}
              placeholder="JUNIOR"
              error={errors.seniorityLevel}
              {...form.register('seniorityLevel')}
            />
            <SuggestionList id={SENIORITY_LIST_ID} options={SENIORITY_LEVEL_SUGGESTIONS} />
          </CardContent>
        </Card>

        <EducationFields />
        <SkillFields />
        <ProjectFields />

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button type="submit" disabled={!isDirty || isBusy}>
            {updateProfile.isPending ? <Spinner /> : <Save className="size-4" />}
            Lưu thay đổi
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!isDirty || isBusy}
            onClick={() => form.reset(toFormValues(profile))}
          >
            <Undo2 className="size-4" />
            Hoàn tác
          </Button>
          <span className="text-xs text-muted-foreground">
            {isDirty
              ? 'Có thay đổi chưa lưu.'
              : `Cập nhật lần cuối: ${formatDateTime(profile.updatedAt)}`}
          </span>
        </div>
      </form>
    </FormProvider>
  )
}
