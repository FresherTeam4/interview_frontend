import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import ProfileSection from '@/features/cv-profile/components/profile-section'
import type { ProfileFieldErrors } from '@/features/cv-profile/lib/profile-validation'
import type { ProfileEducationInput } from '@/types/cv-profile'

const MAX_EDUCATIONS = 20

interface EducationListEditorProps {
  items: ProfileEducationInput[]
  errors: ProfileFieldErrors
  onChange: (items: ProfileEducationInput[]) => void
}

export default function EducationListEditor({
  items,
  errors,
  onChange,
}: EducationListEditorProps) {
  function updateItem(index: number, patch: Partial<ProfileEducationInput>) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  function addItem() {
    if (items.length >= MAX_EDUCATIONS) return
    onChange([
      ...items,
      { school: '', degree: null, fieldOfStudy: null, startYear: null, endYear: null },
    ])
  }

  return (
    <ProfileSection
      icon={GraduationCap}
      title="Học vấn"
      description="Thứ tự trong danh sách là thứ tự hiển thị của hồ sơ."
      counter={`${items.length}/${MAX_EDUCATIONS}`}
      error={errors.educations}
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={items.length >= MAX_EDUCATIONS}
        >
          <Plus />
          Thêm
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Chưa có thông tin học vấn.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((education, index) => {
            const prefix = `educations[${index}]`
            return (
              <li key={education.id ?? `new-education-${index}`} className="rounded-lg border p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Học vấn {index + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                    aria-label={`Xóa học vấn ${index + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-12">
                  <Field
                    className="sm:col-span-7"
                    data-invalid={Boolean(errors[`${prefix}.school`])}
                  >
                    <FieldLabel htmlFor={`${prefix}.school`}>Trường học *</FieldLabel>
                    <Input
                      id={`${prefix}.school`}
                      value={education.school}
                      maxLength={255}
                      placeholder="Ví dụ: FPT University"
                      aria-invalid={Boolean(errors[`${prefix}.school`])}
                      onChange={(event) => updateItem(index, { school: event.target.value })}
                    />
                    <FieldError>{errors[`${prefix}.school`]}</FieldError>
                  </Field>

                  <Field
                    className="sm:col-span-5"
                    data-invalid={Boolean(errors[`${prefix}.degree`])}
                  >
                    <FieldLabel htmlFor={`${prefix}.degree`}>Bằng cấp</FieldLabel>
                    <Input
                      id={`${prefix}.degree`}
                      value={education.degree ?? ''}
                      maxLength={150}
                      placeholder="Ví dụ: Cử nhân"
                      aria-invalid={Boolean(errors[`${prefix}.degree`])}
                      onChange={(event) => updateItem(index, { degree: event.target.value })}
                    />
                    <FieldError>{errors[`${prefix}.degree`]}</FieldError>
                  </Field>

                  <Field
                    className="sm:col-span-6"
                    data-invalid={Boolean(errors[`${prefix}.fieldOfStudy`])}
                  >
                    <FieldLabel htmlFor={`${prefix}.fieldOfStudy`}>Chuyên ngành</FieldLabel>
                    <Input
                      id={`${prefix}.fieldOfStudy`}
                      value={education.fieldOfStudy ?? ''}
                      maxLength={150}
                      placeholder="Ví dụ: Kỹ thuật phần mềm"
                      aria-invalid={Boolean(errors[`${prefix}.fieldOfStudy`])}
                      onChange={(event) => updateItem(index, { fieldOfStudy: event.target.value })}
                    />
                    <FieldError>{errors[`${prefix}.fieldOfStudy`]}</FieldError>
                  </Field>

                  <Field
                    className="sm:col-span-3"
                    data-invalid={Boolean(errors[`${prefix}.startYear`])}
                  >
                    <FieldLabel htmlFor={`${prefix}.startYear`}>Năm bắt đầu</FieldLabel>
                    <Input
                      id={`${prefix}.startYear`}
                      type="number"
                      min={1900}
                      max={2100}
                      placeholder="2022"
                      value={education.startYear ?? ''}
                      aria-invalid={Boolean(errors[`${prefix}.startYear`])}
                      onChange={(event) =>
                        updateItem(index, {
                          startYear: event.target.value === '' ? null : Number(event.target.value),
                        })
                      }
                    />
                    <FieldError>{errors[`${prefix}.startYear`]}</FieldError>
                  </Field>

                  <Field
                    className="sm:col-span-3"
                    data-invalid={Boolean(errors[`${prefix}.endYear`])}
                  >
                    <FieldLabel htmlFor={`${prefix}.endYear`}>Năm kết thúc</FieldLabel>
                    <Input
                      id={`${prefix}.endYear`}
                      type="number"
                      min={1900}
                      max={2100}
                      placeholder="2026"
                      value={education.endYear ?? ''}
                      aria-invalid={Boolean(errors[`${prefix}.endYear`])}
                      onChange={(event) =>
                        updateItem(index, {
                          endYear: event.target.value === '' ? null : Number(event.target.value),
                        })
                      }
                    />
                    <FieldError>{errors[`${prefix}.endYear`]}</FieldError>
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
