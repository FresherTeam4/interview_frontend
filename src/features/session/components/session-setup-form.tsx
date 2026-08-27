import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <Card className="max-w-2xl mx-auto w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Thiết lập phiên phỏng vấn</CardTitle>
        <CardDescription>
          Chọn hồ sơ và mô tả công việc để hệ thống sinh câu hỏi phỏng vấn riêng cho bạn.
        </CardDescription>
        <CardAction>
          <RubricPreviewDialog />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 pt-2">
        {/* Profile */}
        <div className="space-y-1.5">
          <Label htmlFor="session-profile" className="font-medium text-sm">
            Hồ sơ ứng viên <span className="text-destructive">*</span>
          </Label>
          {confirmedProfiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có hồ sơ nào được xác nhận. Hãy xác nhận hồ sơ trước.
            </p>
          ) : (
            <Select value={profileId} onValueChange={setProfileId}>
              <SelectTrigger id="session-profile" className="w-full">
                <SelectValue placeholder="Chọn hồ sơ ứng viên..." />
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
          <Label htmlFor="session-jd" className="font-medium text-sm">
            Mô tả công việc (JD) <span className="text-destructive">*</span>
          </Label>
          {readyJds.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Chưa có JD nào được xác nhận. Hãy tạo và xác nhận JD trước.
            </p>
          ) : (
            <Select value={jdId} onValueChange={setJdId}>
              <SelectTrigger id="session-jd" className="w-full">
                <SelectValue placeholder="Chọn mô tả công việc (JD)..." />
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

        {/* 2-column Grid for Difficulty & Mode */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Difficulty */}
          <div className="space-y-1.5">
            <Label htmlFor="session-difficulty" className="font-medium text-sm">Độ khó</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as InterviewDifficulty)}>
              <SelectTrigger id="session-difficulty" className="w-full">
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
            <Label htmlFor="session-mode" className="font-medium text-sm">Hình thức</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as SessionMode)}>
              <SelectTrigger id="session-mode" className="w-full">
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
        </div>

        <div className="pt-2 border-t mt-1 flex items-center justify-end">
          <Button
            className="gap-2 px-5"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
          >
            {createSession.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Đang tạo phiên...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Tạo phiên phỏng vấn</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
