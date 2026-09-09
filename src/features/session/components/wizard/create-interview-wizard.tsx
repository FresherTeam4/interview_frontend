import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { Briefcase, Check, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import StepRoleSelector from '@/features/session/components/wizard/step-role-selector'
import StepConfig from '@/features/session/components/wizard/step-config'
import { useCandidateProfiles } from '@/hooks/use-candidate-profile'
import { confirmCandidateProfile } from '@/api/profile'
import { confirmInterviewTemplate, getInterviewSessionOptions, getInterviewTemplate } from '@/api/template'
import { api } from '@/api/client'
import { getErrorMessage } from '@/api/api-error'
import { saveCreatedSession } from '@/features/session/services/session-mock-service'
import { sessionDetailPath } from '@/constants/routes'
import { cn } from '@/lib/utils'
import type { InterviewTemplate, InterviewSessionOptions } from '@/types/template'
import type { SessionMode } from '@/types/session'

const STEPS = [
  { step: 1, title: 'Vị trí phỏng vấn', icon: Briefcase },
  { step: 2, title: 'Hồ sơ & Cấu hình', icon: Settings2 },
]

interface CreateInterviewWizardProps {
  initialTemplateId?: number
  initialTemplate?: InterviewTemplate
  onSuccess?: (sessionId: number) => void
  onCancel?: () => void
}

export default function CreateInterviewWizard({
  initialTemplateId,
  initialTemplate,
  onSuccess,
}: CreateInterviewWizardProps = {}) {
  const navigate = useNavigate()
  const profilesQuery = useCandidateProfiles()
  const [currentStep, setCurrentStep] = useState<1 | 2>(initialTemplate ? 2 : 1)

  const [selectedTemplate, setSelectedTemplate] = useState<InterviewTemplate | null>(initialTemplate || null)
  const [selectedProfileId, setSelectedProfileId] = useState<number | undefined>(undefined)

  const [options, setOptions] = useState<InterviewSessionOptions>({
    languages: [],
    durations: [15, 30, 45],
    interviewerStyles: [],
  })

  const [config, setConfig] = useState<{
    languageCode: string
    durationMinutes: number
    interviewerStyle: string
    mode: SessionMode
  }>({
    languageCode: 'vi',
    durationMinutes: 30,
    interviewerStyle: 'FRIENDLY',
    mode: 'VOICE_TURN_BASED',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load template if only initialTemplateId provided
  useEffect(() => {
    if (initialTemplateId && !selectedTemplate) {
      void getInterviewTemplate(initialTemplateId)
        .then((tmpl) => {
          setSelectedTemplate(tmpl)
          setCurrentStep(2)
        })
        .catch(() => {
          // Ignored
        })
    }
  }, [initialTemplateId, selectedTemplate])

  // Load session options
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await getInterviewSessionOptions()
        setOptions(res)
        if (res.languages.length > 0 && !res.languages.some((l) => l.code === config.languageCode)) {
          setConfig((prev) => ({ ...prev, languageCode: res.languages[0].code }))
        }
        if (res.interviewerStyles.length > 0 && !res.interviewerStyles.some((s) => s.code === config.interviewerStyle)) {
          setConfig((prev) => ({ ...prev, interviewerStyle: res.interviewerStyles[0].code }))
        }
      } catch {
        // Use default options if endpoint fails
      }
    }
    void loadOptions()
  }, [config.languageCode, config.interviewerStyle])

  // Derive default profile when not explicitly selected
  const effectiveProfileId =
    selectedProfileId ??
    profilesQuery.data?.find((p) => p.confirmedAt !== null)?.id ??
    profilesQuery.data?.[0]?.id

  async function handleSubmit() {
    if (!selectedTemplate || !effectiveProfileId) {
      toast.error('Vui lòng chọn vị trí và hồ sơ ứng viên trước khi bắt đầu.')
      return
    }

    setIsSubmitting(true)
    const idempotencyKey = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    try {
      const realTemplateId = selectedTemplate.id

      // 1. Xác nhận hồ sơ ứng viên trên Backend (Bắt buộc theo nghiệp vụ)
      try {
        await confirmCandidateProfile(effectiveProfileId)
      } catch {
        // Bỏ qua nếu đã confirm
      }

      // 2. Xác nhận Template trên Backend nếu chưa xác nhận (Bắt buộc theo nghiệp vụ)
      if (!selectedTemplate.confirmed) {
        try {
          await confirmInterviewTemplate(realTemplateId, selectedTemplate.version ?? 0)
        } catch {
          // Bỏ qua nếu đã confirm
        }
      }

      // 3. Gọi API tạo session thực tế trên Backend
      const res = await api.post<{ id: number; status: string }>(
        '/interview-sessions',
        {
          templateId: realTemplateId,
          profileId: effectiveProfileId,
          languageCode: config.languageCode,
          durationMinutes: config.durationMinutes,
          interviewerStyle: config.interviewerStyle,
        },
        {
          headers: { 'Idempotency-Key': idempotencyKey },
        },
      )

      const sessionId = res.data.id
      const activeProfile = profilesQuery.data?.find((p) => p.id === effectiveProfileId)

      // Lưu tóm tắt phiên để hiển thị lịch sử trên dashboard
      saveCreatedSession({
        id: sessionId,
        profileId: effectiveProfileId,
        profileHeadline: activeProfile?.headline || selectedTemplate.title,
        title: selectedTemplate.title,
        durationMinutes: config.durationMinutes,
        mode: config.mode,
      })

      toast.info('Đã tạo phiên phỏng vấn. AI đang thiết lập kịch bản và câu hỏi...')
      if (onSuccess) {
        onSuccess(sessionId)
      } else {
        navigate(sessionDetailPath(sessionId))
      }
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Wizard Progress Stepper (2 Steps) */}
      <div className="flex items-center justify-between max-w-sm mx-auto px-4">
        {STEPS.map((s, idx) => {
          const isDone = currentStep > s.step
          const isCurrent = currentStep === s.step
          const Icon = s.icon

          return (
            <div key={s.step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (isDone) setCurrentStep(s.step as 1 | 2)
                  }}
                  disabled={!isDone && !isCurrent}
                  className={cn(
                    'size-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                    isDone
                      ? 'bg-primary text-primary-foreground shadow-xs cursor-pointer hover:opacity-90'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-xs'
                        : 'bg-muted text-muted-foreground cursor-not-allowed',
                  )}
                >
                  {isDone ? <Check className="size-4" /> : <Icon className="size-4" />}
                </button>
                <span
                  className={cn(
                    'text-xs font-medium',
                    isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground',
                  )}
                >
                  {s.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4 -mt-5 transition-colors',
                    isDone ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <div className="pt-2">
        {currentStep === 1 && (
          <StepRoleSelector
            selectedTemplate={selectedTemplate}
            onTemplateSelected={(tmpl) => setSelectedTemplate(tmpl)}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && selectedTemplate && (
          <StepConfig
            template={selectedTemplate}
            profiles={profilesQuery.data || []}
            selectedProfileId={effectiveProfileId}
            onSelectProfile={(id) => setSelectedProfileId(id)}
            onRefreshProfiles={() => void profilesQuery.refetch()}
            options={options}
            config={config}
            onChangeConfig={(updates) => setConfig((prev) => ({ ...prev, ...updates }))}
            onSubmit={() => void handleSubmit()}
            onBack={() => setCurrentStep(1)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  )
}
