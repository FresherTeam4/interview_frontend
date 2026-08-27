import { IdCard } from 'lucide-react'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import ProfileSection from '@/features/cv-profile/components/profile-section'
import type { ProfileDraft } from '@/features/cv-profile/lib/profile-payload'
import type { ProfileFieldErrors } from '@/features/cv-profile/lib/profile-validation'
import { cn } from '@/lib/utils'

type GeneralField = 'headline' | 'yearsExperience' | 'targetPosition' | 'seniorityLevel'

const seniorityOptions = ['STUDENT', 'FRESHER', 'JUNIOR', 'MID', 'SENIOR']

interface ProfileGeneralFormProps {
  draft: ProfileDraft
  errors: ProfileFieldErrors
  onChange: (field: GeneralField, value: string | number | null) => void
}

export default function ProfileGeneralForm({ draft, errors, onChange }: ProfileGeneralFormProps) {
  return (
    <ProfileSection
      icon={IdCard}
      title="Thông tin tổng quan"
      description="Những thông tin này định hướng câu hỏi trong buổi phỏng vấn thử."
    >
      <div className="grid gap-4 sm:grid-cols-12">
        <Field className="sm:col-span-12" data-invalid={Boolean(errors.headline)}>
          <FieldLabel htmlFor="headline">Tiêu đề hồ sơ</FieldLabel>
          <Input
            id="headline"
            value={draft.headline ?? ''}
            maxLength={255}
            placeholder="Ví dụ: Frontend Developer 1 năm kinh nghiệm"
            aria-invalid={Boolean(errors.headline)}
            onChange={(event) => onChange('headline', event.target.value)}
          />
          <FieldError>{errors.headline}</FieldError>
        </Field>

        <Field className="sm:col-span-6" data-invalid={Boolean(errors.targetPosition)}>
          <FieldLabel htmlFor="target-position">Vị trí mục tiêu</FieldLabel>
          <Input
            id="target-position"
            value={draft.targetPosition ?? ''}
            maxLength={150}
            placeholder="Ví dụ: React Developer"
            aria-invalid={Boolean(errors.targetPosition)}
            onChange={(event) => onChange('targetPosition', event.target.value)}
          />
          <FieldError>{errors.targetPosition}</FieldError>
        </Field>

        <Field className="sm:col-span-3" data-invalid={Boolean(errors.yearsExperience)}>
          <FieldLabel htmlFor="years-experience">Số năm kinh nghiệm</FieldLabel>
          <Input
            id="years-experience"
            type="number"
            min={0}
            max={99.9}
            step={0.1}
            value={draft.yearsExperience ?? ''}
            placeholder="0.0"
            aria-invalid={Boolean(errors.yearsExperience)}
            onChange={(event) =>
              onChange(
                'yearsExperience',
                event.target.value === '' ? null : Number(event.target.value),
              )
            }
          />
          <FieldError>{errors.yearsExperience}</FieldError>
        </Field>

        <Field className="sm:col-span-3" data-invalid={Boolean(errors.seniorityLevel)}>
          <FieldLabel htmlFor="seniority-level">Cấp độ</FieldLabel>
          <Input
            id="seniority-level"
            list="seniority-suggestions"
            value={draft.seniorityLevel ?? ''}
            maxLength={30}
            placeholder="Chọn hoặc nhập"
            aria-invalid={Boolean(errors.seniorityLevel)}
            onChange={(event) => onChange('seniorityLevel', event.target.value)}
          />
          <datalist id="seniority-suggestions">
            {seniorityOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <FieldError>{errors.seniorityLevel}</FieldError>
        </Field>

        <div className="flex flex-wrap gap-1.5 sm:col-span-12">
          {seniorityOptions.map((option) => {
            const isActive = draft.seniorityLevel === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange('seniorityLevel', isActive ? '' : option)}
                aria-pressed={isActive}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>
    </ProfileSection>
  )
}
