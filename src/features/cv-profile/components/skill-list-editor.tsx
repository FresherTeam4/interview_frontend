import { useState } from 'react'
import { Plus, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ProfileSection from '@/features/cv-profile/components/profile-section'
import { normalizeSkillName } from '@/features/cv-profile/lib/profile-validation'
import type { ProfileFieldErrors } from '@/features/cv-profile/lib/profile-validation'
import { cn } from '@/lib/utils'
import type { ProfileSkillInput } from '@/types/cv-profile'

const MAX_SKILLS = 100
const skillCategories = ['LANGUAGE', 'FRAMEWORK', 'DATABASE', 'TOOL', 'SOFT']

interface SkillListEditorProps {
  items: ProfileSkillInput[]
  errors: ProfileFieldErrors
  onChange: (items: ProfileSkillInput[]) => void
}

export default function SkillListEditor({ items, errors, onChange }: SkillListEditorProps) {
  const [draftName, setDraftName] = useState('')
  const [draftCategory, setDraftCategory] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const isFull = items.length >= MAX_SKILLS

  function updateItem(index: number, patch: Partial<ProfileSkillInput>) {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  /** Cho phép dán "Java, Spring Boot" để thêm nhiều kỹ năng một lượt. */
  function addDraftSkills() {
    const names = draftName
      .split(',')
      .map((name) => name.trim().replace(/\s+/g, ' '))
      .filter((name) => name.length > 0)
    if (names.length === 0) return

    const existing = new Set(items.map((item) => normalizeSkillName(item.name)))
    const category = draftCategory.trim() || null
    const accepted: ProfileSkillInput[] = []
    const duplicates: string[] = []

    for (const name of names) {
      const normalized = normalizeSkillName(name)
      if (existing.has(normalized)) {
        duplicates.push(name)
        continue
      }
      if (items.length + accepted.length >= MAX_SKILLS) break
      existing.add(normalized)
      accepted.push({ name, category })
    }

    if (accepted.length > 0) onChange([...items, ...accepted])
    setDuplicateWarning(
      duplicates.length > 0 ? `Đã bỏ qua kỹ năng trùng: ${duplicates.join(', ')}.` : null,
    )
    setDraftName('')
  }

  return (
    <ProfileSection
      icon={Sparkles}
      title="Kỹ năng"
      description="Nhập tên kỹ năng rồi nhấn Enter. Có thể dán nhiều kỹ năng cách nhau bằng dấu phẩy."
      counter={`${items.length}/${MAX_SKILLS}`}
      error={errors.skills}
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={draftName}
          maxLength={400}
          placeholder="Ví dụ: Java, Spring Boot"
          aria-label="Tên kỹ năng mới"
          disabled={isFull}
          onChange={(event) => setDraftName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter') return
            event.preventDefault()
            addDraftSkills()
          }}
        />
        <div className="flex gap-2">
          <Input
            list="skill-category-suggestions"
            value={draftCategory}
            maxLength={50}
            placeholder="Nhóm (tùy chọn)"
            aria-label="Nhóm kỹ năng mới"
            className="sm:w-44"
            disabled={isFull}
            onChange={(event) => setDraftCategory(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addDraftSkills}
            disabled={isFull || draftName.trim().length === 0}
          >
            <Plus />
            Thêm
          </Button>
        </div>
      </div>

      {duplicateWarning && <p className="mt-2 text-xs text-muted-foreground">{duplicateWarning}</p>}
      {isFull && (
        <p className="mt-2 text-xs text-muted-foreground">
          Hồ sơ đã đạt tối đa {MAX_SKILLS} kỹ năng.
        </p>
      )}

      {items.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Chưa có kỹ năng nào. Hãy thêm kỹ năng nổi bật nhất của bạn.
        </p>
      ) : (
        <ul className="mt-3 divide-y rounded-lg border">
          {items.map((skill, index) => {
            const prefix = `skills[${index}]`
            const nameError = errors[`${prefix}.name`]
            const categoryError = errors[`${prefix}.category`]
            return (
              <li key={skill.id ?? `new-skill-${index}`} className="p-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 shrink-0 text-center text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <Input
                    value={skill.name}
                    maxLength={80}
                    placeholder="Tên kỹ năng"
                    aria-label={`Tên kỹ năng ${index + 1}`}
                    className={cn('h-8 flex-1', nameError && 'border-destructive')}
                    aria-invalid={Boolean(nameError)}
                    onChange={(event) => updateItem(index, { name: event.target.value })}
                  />
                  <Input
                    list="skill-category-suggestions"
                    value={skill.category ?? ''}
                    maxLength={50}
                    placeholder="Nhóm"
                    aria-label={`Nhóm kỹ năng ${index + 1}`}
                    className="h-8 w-28 sm:w-44"
                    aria-invalid={Boolean(categoryError)}
                    onChange={(event) => updateItem(index, { category: event.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
                    aria-label={`Xóa kỹ năng ${index + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
                {(nameError || categoryError) && (
                  <p className="mt-1 pl-8 text-xs text-destructive">{nameError ?? categoryError}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <datalist id="skill-category-suggestions">
        {skillCategories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
    </ProfileSection>
  )
}
