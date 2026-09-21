import { FolderGit2, Trash2 } from 'lucide-react'
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import FieldArraySection from '@/features/profile/components/field-array-section'
import ProfileTextField from '@/features/profile/components/profile-text-field'
import { EMPTY_PROJECT, type ProfileFormValues } from '@/features/profile/profile-schema'
import { PROFILE_LIMITS } from '@/constants/profile'

export default function ProjectFields() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ProfileFormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'projects' })

  return (
    <FieldArraySection
      title="Dự án thực tế"
      icon={FolderGit2}
      addLabel="Thêm dự án"
      emptyLabel="Chưa có dự án nào."
      count={fields.length}
      max={PROFILE_LIMITS.projects}
      onAdd={() => append(EMPTY_PROJECT)}
    >
      {fields.map((field, index) => {
        const rowErrors = errors.projects?.[index]
        const descriptionId = `projects.${index}.description`

        return (
          <div key={field.id} className="rounded-lg border border-border p-4 bg-card/60">
            <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  {index + 1}
                </span>
                Dự án {index + 1}
              </span>
              <Button
                type="button"
                variant="destructive"
                size="icon-sm"
                aria-label={`Xoá dự án ${index + 1}`}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileTextField
                id={`projects.${index}.name`}
                label="Tên dự án"
                placeholder="Hệ thống phỏng vấn thử"
                error={rowErrors?.name}
                {...register(`projects.${index}.name`)}
              />
              <ProfileTextField
                id={`projects.${index}.roleInProject`}
                label="Vai trò"
                placeholder="Backend developer"
                error={rowErrors?.roleInProject}
                {...register(`projects.${index}.roleInProject`)}
              />
              <ProfileTextField
                id={`projects.${index}.startDate`}
                label="Ngày bắt đầu"
                type="date"
                error={rowErrors?.startDate}
                {...register(`projects.${index}.startDate`)}
              />
              <ProfileTextField
                id={`projects.${index}.endDate`}
                label="Ngày kết thúc"
                type="date"
                error={rowErrors?.endDate}
                {...register(`projects.${index}.endDate`)}
              />
              <div className="sm:col-span-2">
                <ProfileTextField
                  id={`projects.${index}.techStack`}
                  label="Công nghệ sử dụng"
                  placeholder="Spring Boot, MySQL, Redis…"
                  error={rowErrors?.techStack}
                  {...register(`projects.${index}.techStack`)}
                />
              </div>
              <Field className="sm:col-span-2" data-invalid={rowErrors?.description ? true : undefined}>
                <FieldLabel htmlFor={descriptionId}>Mô tả</FieldLabel>
                <Textarea
                  id={descriptionId}
                  rows={3}
                  placeholder="Bạn đã làm gì trong dự án này?"
                  aria-invalid={rowErrors?.description ? true : undefined}
                  {...register(`projects.${index}.description`)}
                />
                <FieldError errors={[rowErrors?.description]} />
              </Field>
            </div>
          </div>
        )
      })}
    </FieldArraySection>
  )
}
