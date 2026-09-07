import { GraduationCap, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import FieldArraySection from '@/features/profile/components/field-array-section'
import ProfileTextField from '@/features/profile/components/profile-text-field'
import { EMPTY_EDUCATION, type ProfileFormValues } from '@/features/profile/profile-schema'
import { PROFILE_LIMITS } from '@/constants/profile'

export default function EducationFields() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'educations' })

  return (
    <FieldArraySection
      title="Học vấn"
      icon={GraduationCap}
      description="Trường, bằng cấp và thời gian học."
      addLabel="Thêm học vấn"
      emptyLabel="Chưa có mục học vấn nào."
      count={fields.length}
      max={PROFILE_LIMITS.educations}
      onAdd={() => append(EMPTY_EDUCATION)}
    >
      {fields.map((field, index) => {
        const rowErrors = errors.educations?.[index]

        return (
          <div key={field.id} className="rounded-lg border border-border p-4 bg-card/60">
            <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  {index + 1}
                </span>
                Học vấn {index + 1}
              </span>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                aria-label={`Xoá học vấn ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileTextField
                id={`educations.${index}.school`}
                label="Trường"
                placeholder="Đại học FPT"
                error={rowErrors?.school}
                {...register(`educations.${index}.school`)}
              />
              <ProfileTextField
                id={`educations.${index}.degree`}
                label="Bằng cấp"
                placeholder="Cử nhân"
                error={rowErrors?.degree}
                {...register(`educations.${index}.degree`)}
              />
              <ProfileTextField
                id={`educations.${index}.fieldOfStudy`}
                label="Chuyên ngành"
                placeholder="Kỹ thuật phần mềm"
                error={rowErrors?.fieldOfStudy}
                {...register(`educations.${index}.fieldOfStudy`)}
              />
              <div className="grid grid-cols-2 gap-3">
                <ProfileTextField
                  id={`educations.${index}.startYear`}
                  label="Năm bắt đầu"
                  type="number"
                  inputMode="numeric"
                  min={PROFILE_LIMITS.yearMin}
                  max={PROFILE_LIMITS.yearMax}
                  placeholder="2021"
                  error={rowErrors?.startYear}
                  {...register(`educations.${index}.startYear`)}
                />
                <ProfileTextField
                  id={`educations.${index}.endYear`}
                  label="Năm kết thúc"
                  type="number"
                  inputMode="numeric"
                  min={PROFILE_LIMITS.yearMin}
                  max={PROFILE_LIMITS.yearMax}
                  placeholder="2025"
                  error={rowErrors?.endYear}
                  {...register(`educations.${index}.endYear`)}
                />
              </div>
            </div>
          </div>
        )
      })}
    </FieldArraySection>
  )
}
