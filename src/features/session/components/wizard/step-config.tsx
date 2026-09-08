import { ArrowLeft, Bot, Briefcase, Clock, Flame, Globe, HeartHandshake, MessageSquare, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import ProfileSelector from '@/features/session/components/wizard/profile-selector'
import { cn } from '@/lib/utils'
import type { InterviewTemplate } from '@/types/template'
import type { ProfileSummary } from '@/types/profile'
import type { InterviewSessionOptions } from '@/types/template'

interface StepConfigProps {
  template: InterviewTemplate
  profiles: ProfileSummary[]
  selectedProfileId?: number
  onSelectProfile: (id: number) => void
  onRefreshProfiles: () => void
  options: InterviewSessionOptions
  config: {
    languageCode: string
    durationMinutes: number
    interviewerStyle: string
  }
  onChangeConfig: (updates: Partial<{
    languageCode: string
    durationMinutes: number
    interviewerStyle: string
  }>) => void
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

const STYLE_DETAILS: Record<string, { label: string; desc: string; icon: React.ReactNode }> = {
  FRIENDLY: {
    label: 'Thân thiện & Gợi mở',
    desc: 'Thoải mái, gợi ý khi gặp khó.',
    icon: <HeartHandshake className="size-4 text-emerald-500" />,
  },
  PROFESSIONAL: {
    label: 'Chuyên nghiệp & Chuẩn mực',
    desc: 'Chuẩn mực, hỏi sâu logic và giải pháp.',
    icon: <Briefcase className="size-4 text-blue-500" />,
  },
  CHALLENGING: {
    label: 'Khắt khe (Stress Test)',
    desc: 'Phản biện sâu, thử thách bản lĩnh kỹ thuật.',
    icon: <Flame className="size-4 text-amber-500" />,
  },
}


export default function StepConfig({
  template,
  profiles,
  selectedProfileId,
  onSelectProfile,
  onRefreshProfiles,
  options,
  config,
  onChangeConfig,
  onSubmit,
  onBack,
  isSubmitting,
}: StepConfigProps) {
  const languages = options.languages.length > 0 ? options.languages : [
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'en', name: 'English' },
  ]

  const durations = options.durations.length > 0 ? options.durations : [15, 30, 45]

  const styles = options.interviewerStyles.length > 0 ? options.interviewerStyles : [
    { code: 'FRIENDLY', name: 'Thân thiện' },
    { code: 'PROFESSIONAL', name: 'Chuyên nghiệp' },
    { code: 'CHALLENGING', name: 'Thách thức' },
  ]

  const canSubmit = !!selectedProfileId && !isSubmitting

  return (
    <div className="space-y-6">
      <Card className="border-border/80">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Cấu hình buổi phỏng vấn thử</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Selection */}
          <ProfileSelector
            profiles={profiles}
            selectedProfileId={selectedProfileId}
            onSelect={onSelectProfile}
            onRefreshProfiles={onRefreshProfiles}
          />

          {/* Session Settings */}
          <div className="pt-4 border-t border-border/70 space-y-5">
            {/* Language */}
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <Globe className="size-3.5 text-primary" />
                Ngôn ngữ phỏng vấn
              </label>
              <div className="flex gap-2.5">
                {languages.map((lang) => {
                  const isSelected = config.languageCode === lang.code
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => onChangeConfig({ languageCode: lang.code })}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                          : 'border-border/80 bg-card/60 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {lang.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <Clock className="size-3.5 text-primary" />
                Thời lượng phiên phỏng vấn
              </label>
              <div className="flex gap-2.5">
                {durations.map((d) => {
                  const isSelected = config.durationMinutes === d
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => onChangeConfig({ durationMinutes: d })}
                      className={cn(
                        'flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center',
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                          : 'border-border/80 bg-card/60 text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {d} phút
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Interviewer Style */}
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-2">
                <MessageSquare className="size-3.5 text-primary" />
                Phong cách phỏng vấn viên
              </label>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {styles.map((style) => {
                  const isSelected = config.interviewerStyle === style.code
                  const detail = STYLE_DETAILS[style.code] || {
                    label: style.name,
                    desc: '',
                    icon: <Bot className="size-4 text-primary" />,
                  }

                  return (
                    <div
                      key={style.code}
                      onClick={() => onChangeConfig({ interviewerStyle: style.code })}
                      className={cn(
                        'cursor-pointer p-3 rounded-lg border text-left transition-all space-y-1',
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-xs'
                          : 'border-border/80 bg-card/60 hover:border-primary/40',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <div className="shrink-0 flex items-center justify-center">{detail.icon}</div>
                        <span className="font-semibold text-xs text-foreground">
                          {detail.label}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                        {detail.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Summary Banner */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Briefcase className="size-4" />
          </div>
          <div>
            <div className="font-semibold text-foreground">
              {template.title} ({template.targetSeniority || 'JUNIOR'})
            </div>
            <div className="text-muted-foreground text-[11px]">
              {config.durationMinutes} phút · {config.languageCode === 'vi' ? 'Tiếng Việt' : 'English'} · Phong cách {config.interviewerStyle}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting} className="gap-2">
          <ArrowLeft className="size-4" />
          Quay lại chỉnh sửa mẫu
        </Button>
        <Button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="gap-2 px-6"
        >
          {isSubmitting ? (
            <>
              <Spinner className="size-4" />
              Đang khởi tạo phòng thi…
            </>
          ) : (
            <>
              <Play className="size-4 fill-current" />
              Bắt đầu phỏng vấn ngay
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
