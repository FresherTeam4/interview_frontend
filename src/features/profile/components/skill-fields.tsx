import { Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import SuggestionList from '@/components/suggestion-list'
import FieldArraySection from '@/features/profile/components/field-array-section'
import { EMPTY_SKILL, type ProfileFormValues } from '@/features/profile/profile-schema'
import { PROFILE_LIMITS, SKILL_CATEGORY_SUGGESTIONS } from '@/constants/profile'

/** Một datalist dùng chung cho mọi dòng, thay vì một cái cho mỗi dòng. */
const CATEGORY_LIST_ID = 'skill-category-options'

export default function SkillFields() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'skills' })

  return (
    <FieldArraySection
      title="Kỹ năng"
      description="Ngôn ngữ, framework, database, công cụ… mà bạn thực sự dùng được."
      addLabel="Thêm kỹ năng"
      emptyLabel="Chưa có kỹ năng nào."
      count={fields.length}
      max={PROFILE_LIMITS.skills}
      onAdd={() => append(EMPTY_SKILL)}
    >
      <SuggestionList id={CATEGORY_LIST_ID} options={SKILL_CATEGORY_SUGGESTIONS} />

      {fields.map((field, index) => {
        const nameError = errors.skills?.[index]?.name
        const categoryError = errors.skills?.[index]?.category

        return (
          <div key={field.id} className="flex flex-wrap items-start gap-2">
            <div className="min-w-40 flex-1">
              <Input
                aria-label={`Tên kỹ năng ${index + 1}`}
                aria-invalid={nameError ? true : undefined}
                placeholder="Ví dụ: Java, React, PostgreSQL…"
                {...register(`skills.${index}.name`)}
              />
              <FieldError className="mt-1" errors={[nameError]} />
            </div>

            <div className="w-40">
              <Input
                aria-label={`Nhóm kỹ năng ${index + 1}`}
                aria-invalid={categoryError ? true : undefined}
                list={CATEGORY_LIST_ID}
                placeholder="Chưa phân loại"
                {...register(`skills.${index}.category`)}
              />
              <FieldError className="mt-1" errors={[categoryError]} />
            </div>

            <Button
              type="button"
              variant="destructive"
              size="icon"
              aria-label={`Xoá kỹ năng ${index + 1}`}
              onClick={() => remove(index)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        )
      })}
    </FieldArraySection>
  )
}
