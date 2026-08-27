import { FolderKanban, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import ProfileSection from '@/features/cv-profile/components/profile-section'
import { splitTechStack } from '@/features/cv-profile/lib/formatters'
import type { ProfileFieldErrors } from '@/features/cv-profile/lib/profile-validation'
import type { ProfileProjectInput } from '@/types/cv-profile'

const MAX_PROJECTS = 50
const MAX_DESCRIPTION = 5_000

interface ProjectListEditorProps {
  items: ProfileProjectInput[]
  errors: ProfileFieldErrors
  onChange: (items: ProfileProjectInput[]) => void
}

export default function ProjectListEditor({ items, errors, onChange }: ProjectListEditorProps) {
  function updateItem(index: number, patch: Partial<ProfileProjectInput>) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    if (items.length >= MAX_PROJECTS) return
    onChange([
      ...items,
      {
        name: '',
        description: null,
        roleInProject: null,
        techStack: null,
        startDate: null,
        endDate: null,
      },
    ])
  }

  return (
    <ProfileSection
      icon={FolderKanban}
      title="Dự án"
      description="Mô tả ngắn gọn vai trò và kết quả để buổi phỏng vấn đi vào trọng tâm."
      counter={`${items.length}/${MAX_PROJECTS}`}
      error={errors.projects}
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={items.length >= MAX_PROJECTS}
        >
          <Plus />
          Thêm
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Chưa có dự án nào.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((project, index) => {
            const prefix = `projects[${index}]`
            const techChips = splitTechStack(project.techStack)
            return (
              <li key={project.id ?? `new-project-${index}`} className="rounded-lg border p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Dự án {index + 1}
                    {project.name.trim() && (
                      <span className="normal-case"> · {project.name.trim()}</span>
                    )}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                    aria-label={`Xóa dự án ${index + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-12">
                  <Field className="sm:col-span-7" data-invalid={Boolean(errors[`${prefix}.name`])}>
                    <FieldLabel htmlFor={`${prefix}.name`}>Tên dự án *</FieldLabel>
                    <Input
                      id={`${prefix}.name`}
                      value={project.name}
                      maxLength={255}
                      placeholder="Ví dụ: Hệ thống phỏng vấn thử"
                      aria-invalid={Boolean(errors[`${prefix}.name`])}
                      onChange={(event) => updateItem(index, { name: event.target.value })}
                    />
                    <FieldError>{errors[`${prefix}.name`]}</FieldError>
                  </Field>

                  <Field
                    className="sm:col-span-5"
                    data-invalid={Boolean(errors[`${prefix}.roleInProject`])}
                  >
                    <FieldLabel htmlFor={`${prefix}.roleInProject`}>Vai trò</FieldLabel>
                    <Input
                      id={`${prefix}.roleInProject`}
                      value={project.roleInProject ?? ''}
                      maxLength={150}
                      placeholder="Ví dụ: Backend Developer"
                      aria-invalid={Boolean(errors[`${prefix}.roleInProject`])}
                      onChange={(event) => updateItem(index, { roleInProject: event.target.value })}
                    />
                    <FieldError>{errors[`${prefix}.roleInProject`]}</FieldError>
                  </Field>

                  <Field
                    className="sm:col-span-6"
                    data-invalid={Boolean(errors[`${prefix}.techStack`])}
                  >
                    <FieldLabel htmlFor={`${prefix}.techStack`}>Công nghệ sử dụng</FieldLabel>
                    <Input
                      id={`${prefix}.techStack`}
                      value={project.techStack ?? ''}
                      maxLength={500}
                      placeholder="React, TypeScript, Spring Boot"
                      aria-invalid={Boolean(errors[`${prefix}.techStack`])}
                      onChange={(event) => updateItem(index, { techStack: event.target.value })}
                    />
                    {techChips.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {techChips.map((tech, techIndex) => (
                          <span
                            key={`${tech}-${techIndex}`}
                            className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    <FieldError>{errors[`${prefix}.techStack`]}</FieldError>
                  </Field>

                  <Field
                    className="sm:col-span-3"
                    data-invalid={Boolean(errors[`${prefix}.startDate`])}
                  >
                    <FieldLabel htmlFor={`${prefix}.startDate`}>Ngày bắt đầu</FieldLabel>
                    <Input
                      id={`${prefix}.startDate`}
                      type="date"
                      value={project.startDate ?? ''}
                      aria-invalid={Boolean(errors[`${prefix}.startDate`])}
                      onChange={(event) => updateItem(index, { startDate: event.target.value })}
                    />
                    <FieldError>{errors[`${prefix}.startDate`]}</FieldError>
                  </Field>

                  <Field
                    className="sm:col-span-3"
                    data-invalid={Boolean(errors[`${prefix}.endDate`])}
                  >
                    <FieldLabel htmlFor={`${prefix}.endDate`}>Ngày kết thúc</FieldLabel>
                    <Input
                      id={`${prefix}.endDate`}
                      type="date"
                      value={project.endDate ?? ''}
                      aria-invalid={Boolean(errors[`${prefix}.endDate`])}
                      onChange={(event) => updateItem(index, { endDate: event.target.value })}
                    />
                    <FieldError>{errors[`${prefix}.endDate`]}</FieldError>
                  </Field>

                  <Field
                    className="sm:col-span-12"
                    data-invalid={Boolean(errors[`${prefix}.description`])}
                  >
                    <FieldLabel htmlFor={`${prefix}.description`}>Mô tả</FieldLabel>
                    <Textarea
                      id={`${prefix}.description`}
                      value={project.description ?? ''}
                      maxLength={MAX_DESCRIPTION}
                      rows={3}
                      placeholder="Bối cảnh, việc bạn làm và kết quả đạt được."
                      aria-invalid={Boolean(errors[`${prefix}.description`])}
                      onChange={(event) => updateItem(index, { description: event.target.value })}
                    />
                    <div className="flex justify-between gap-2">
                      <FieldError>{errors[`${prefix}.description`]}</FieldError>
                      <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                        {(project.description ?? '').length}/{MAX_DESCRIPTION}
                      </span>
                    </div>
                  </Field>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </ProfileSection>
  )
}
