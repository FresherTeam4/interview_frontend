import { useState, useMemo } from 'react'
import { Check, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { InterviewTemplate } from '@/types/template'

interface TemplateCardSelectorProps {
  templates: InterviewTemplate[]
  selectedTemplateId?: number
  onSelect: (template: InterviewTemplate) => void
}

export default function TemplateCardSelector({
  templates,
  selectedTemplateId,
  onSelect,
}: TemplateCardSelectorProps) {
  const [search, setSearch] = useState('')

  const filteredTemplates = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return templates
    return templates.filter((t) => {
      const matchTitle = t.title?.toLowerCase().includes(query)
      const matchJob = t.jobTitle?.toLowerCase().includes(query)
      const matchSeniority = t.targetSeniority?.toLowerCase().includes(query)
      const matchSkills = t.content?.keySkills?.some((s) => s.name.toLowerCase().includes(query))
      return matchTitle || matchJob || matchSeniority || matchSkills
    })
  }, [templates, search])

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm mẫu phỏng vấn theo vị trí, kỹ năng (Java, React, QA...)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card/60"
        />
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-xl p-6 text-muted-foreground text-sm">
          Không tìm thấy template mẫu nào phù hợp với từ khóa &ldquo;{search}&rdquo;.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredTemplates.map((template) => {
            const isSelected = selectedTemplateId === template.id
            const skills = template.content?.keySkills || []

            return (
              <Card
                key={template.id}
                onClick={() => onSelect(template)}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/50 relative overflow-hidden',
                  isSelected && 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs',
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 size-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                    <Check className="size-3.5" />
                  </div>
                )}
                <CardHeader className="pb-2.5">
                  <div className="flex items-center gap-2 pr-6">
                    <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                      {template.title}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary" className="text-[11px] font-medium">
                      {template.targetSeniority || 'FRESHER'}
                    </Badge>
                    {template.content?.domain && (
                      <span className="text-xs text-muted-foreground truncate">
                        {template.content.domain}
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-xs line-clamp-2 pt-1">
                    {template.content?.summary || 'Mẫu phỏng vấn tiêu chuẩn thiết kế theo yêu cầu doanh nghiệp.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.slice(0, 3).map((s) => (
                      <span
                        key={s.name}
                        className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-foreground/80 font-medium"
                      >
                        {s.name}
                      </span>
                    ))}
                    {skills.length > 3 && (
                      <span className="text-[11px] text-muted-foreground self-center pl-0.5">
                        +{skills.length - 3} kỹ năng khác
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
