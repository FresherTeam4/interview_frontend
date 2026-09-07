import { useState } from 'react'
import { Plus, Trash2, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { KeySkill, SkillLevel } from '@/types/template'

interface SkillEditorProps {
  skills: KeySkill[]
  onChange: (skills: KeySkill[]) => void
}

export default function SkillEditor({ skills, onChange }: SkillEditorProps) {
  const [newSkillName, setNewSkillName] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('MUST_HAVE')

  function handleAdd() {
    const trimmed = newSkillName.trim()
    if (!trimmed) return
    if (skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      return
    }
    onChange([...skills, { name: trimmed, level: newSkillLevel }])
    setNewSkillName('')
  }

  function handleRemove(index: number) {
    onChange(skills.filter((_, i) => i !== index))
  }

  function handleToggleLevel(index: number) {
    onChange(
      skills.map((s, i) => {
        if (i !== index) return s
        return {
          ...s,
          level: s.level === 'MUST_HAVE' ? 'NICE_TO_HAVE' : 'MUST_HAVE',
        }
      }),
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <ListChecks className="size-3.5 text-primary" />
          Kỹ năng & Tiêu chí trọng tâm ({skills.length})
        </label>
        <span className="text-[11px] text-muted-foreground">
          Bấm vào nhãn để chuyển đổi Bắt buộc / Ưu tiên
        </span>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {skills.map((skill, idx) => (
          <div
            key={`${skill.name}-${idx}`}
            className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/70 bg-card/50 text-xs hover:border-border transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground truncate">{skill.name}</div>
              {skill.description && (
                <div className="text-[11px] text-muted-foreground truncate">{skill.description}</div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleToggleLevel(idx)}
                className="cursor-pointer transition-opacity hover:opacity-80"
              >
                {skill.level === 'MUST_HAVE' ? (
                  <Badge variant="default" className="text-[10px] px-2 py-0.5">
                    Bắt buộc
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                    Ưu tiên
                  </Badge>
                )}
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => handleRemove(idx)}
                className="text-muted-foreground hover:text-destructive size-7"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new skill inline */}
      <div className="flex items-center gap-2 pt-1">
        <Input
          placeholder="Thêm kỹ năng mới (vd: Docker, Redis, Unit Test...)"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          className="text-xs h-9"
        />
        <select
          value={newSkillLevel}
          onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
          className="text-xs h-9 rounded-md border border-input bg-background px-2 font-medium"
        >
          <option value="MUST_HAVE">Bắt buộc</option>
          <option value="NICE_TO_HAVE">Ưu tiên</option>
        </select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!newSkillName.trim()}
          className="shrink-0 h-9"
        >
          <Plus className="size-3.5 mr-1" />
          Thêm
        </Button>
      </div>
    </div>
  )
}
