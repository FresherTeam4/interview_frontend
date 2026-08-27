import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getErrorMessage } from '@/api/api-error'
import { useCreateSession } from '@/hooks/use-interview-session'
import { INTERVIEW_DIFFICULTY_LABEL, SESSION_MODE_LABEL } from '@/constants/session'
import RubricPreviewDialog from '@/features/session/components/rubric-preview-dialog'
import type { ProfileSummary } from '@/types/profile'
import type { JobDescriptionSummary } from '@/types/jd'
import type { InterviewDifficulty, SessionMode } from '@/types/session'

interface SessionSetupFormProps {
  confirmedProfiles: ProfileSummary[]
  readyJds: JobDescriptionSummary[]
}

export default function SessionSetupForm({ confirmedProfiles, readyJds }: SessionSetupFormProps) {
  const navigate = useNavigate()
  const createSession = useCreateSession()

  const [profileId, setProfileId] = useState<string>('')
  const [jdId, setJdId] = useState<string>('')
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>('MEDIUM')
  const [mode, setMode] = useState<SessionMode>('TEXT')

  const canSubmit = profileId && jdId && !createSession.isPending

  async function handleSubmit() {
    if (!profileId || !jdId) return

    const idempotencyKey = `${profileId}-${jdId}-${Date.now()}`
    try {
      const session = await createSession.mutateAsync({
        idempotencyKey,
        data: {
          profileId: Number(profileId),
          jobDescriptionId: Number(jdId),
          difficulty,
          mode,
          languageCode: 'vi',
        },
      })
      // Lưu lại ID phiên gần đây vào localStorage
      try {
        const key = 'recent_interview_sessions'
        const existing: number[] = JSON.parse(localStorage.getItem(key) ?? '[]')
        const updated = Array.from(new Set([session.id, ...existing])).slice(0, 10)
        localStorage.setItem(key, JSON.stringify(updated))
      } catch {
        // ignore storage errors
      }

      toast.success('Đã tạo phiên phỏng vấn. Đang sinh câu hỏi...')
      navigate(`/session/${session.id}`)
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="space-y-1">
          <CardTitle>Thiết lập phiên phỏng vấn</CardTitle>
          <CardDescription>
            Chọn hồ sơ và mô tả công việc để hệ thống sinh câu hỏi phỏng vấn riêng cho bạn.
          </CardDescription>
        </div>
        <RubricPreviewDialog />
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* Profile */}
        <div className="space-y-1.5">
          <Label htmlFor="session-profile">Hồ sơ ứng viên</Label>
          {confirmedProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có hồ sơ nào được xác nhận. Hãy xác nhận hồ sơ trước.
            </p>
          ) : (
            <Select value={profileId} onValueChange={setProfileId}>
              <SelectTrigger id="session-profile">
                <SelectValue placeholder="Chọn hồ sơ..." />
              </SelectTrigger>
              <SelectContent>
                {confirmedProfiles.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.headline ?? p.cvOriginalFilename ?? `Hồ sơ #${p.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* JD */}
        <div className="space-y-1.5">
          <Label htmlFor="session-jd">Mô tả công việc (JD)</Label>
          {readyJds.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có JD nào được xác nhận. Hãy tạo và xác nhận JD trước.
            </p>
          ) : (
            <Select value={jdId} onValueChange={setJdId}>
              <SelectTrigger id="session-jd">
                <SelectValue placeholder="Chọn JD..." />
              </SelectTrigger>
              <SelectContent>
                {readyJds.map((j) => (
                  <SelectItem key={j.id} value={String(j.id)}>
                    {j.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Difficulty */}
        <div className="space-y-1.5">
          <Label htmlFor="session-difficulty">Độ khó</Label>
          <Select value={difficulty} onValueChange={(v) => setDifficulty(v as InterviewDifficulty)}>
            <SelectTrigger id="session-difficulty">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(INTERVIEW_DIFFICULTY_LABEL) as [InterviewDifficulty, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Mode */}
        <div className="space-y-1.5">
          <Label htmlFor="session-mode">Hình thức</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as SessionMode)}>
            <SelectTrigger id="session-mode">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(SESSION_MODE_LABEL) as [SessionMode, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value} disabled={value === 'VOICE_TURN_BASED'}>
                    {label}{value === 'VOICE_TURN_BASED' ? ' (sắp có)' : ''}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-fit"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
        >
          {createSession.isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Đang tạo...
            </>
          ) : (
            <>
              <Sparkles className="size-4" />
              Tạo phiên phỏng vấn
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
