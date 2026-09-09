import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  Loader2,
  Mic,
  Play,
  RefreshCw,
  RotateCw,
  Send,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getErrorMessage } from '@/api/api-error'
import { transcribeAudio } from '@/api/speech'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useAudioRecorder } from '@/hooks/use-audio-recorder'
import { useResumeSession, useSubmitTextAnswer } from '@/hooks/use-interview-session'
import { stopAllInterviewAudio } from '@/hooks/use-turn-audio-player'
import { cn } from '@/lib/utils'
import type { InterviewSession } from '@/types/session'

interface InterviewAnswerInputProps {
  session: InterviewSession
  isSubmittingVoice?: boolean
  setIsSubmittingVoice?: (val: boolean) => void
}

export default function InterviewAnswerInput({
  session,
  isSubmittingVoice: externalIsSubmitting,
  setIsSubmittingVoice: externalSetIsSubmitting,
}: InterviewAnswerInputProps) {
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false)
  const isSubmittingVoice = externalIsSubmitting ?? internalIsSubmitting
  const setIsSubmittingVoice = externalSetIsSubmitting ?? setInternalIsSubmitting

  const [textInput, setTextInput] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cachedAudioBlob, setCachedAudioBlob] = useState<Blob | null>(null)
  const [cachedAnswerText, setCachedAnswerText] = useState<string | null>(null)
  const [cachedClientTurnId, setCachedClientTurnId] = useState<string | null>(null)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const submitAnswer = useSubmitTextAnswer(session.id)
  const resumeSession = useResumeSession(session.id)

  const {
    isRecording,
    duration,
    formattedDuration,
    isSpeaking,
    audioLevels,
    startRecording,
    stopRecording,
    cancelRecording,
    error: recorderError,
  } = useAudioRecorder()

  useEffect(() => {
    if (recorderError) {
      toast.error(recorderError)
    }
  }, [recorderError])

  const isPaused = session.status === 'PAUSED'
  const isEngineRetry = session.awaitingAction === 'ENGINE_RETRY'
  const isFailed = session.status === 'FAILED' || isEngineRetry
  const isEvaluating = session.awaitingAction === 'ENGINE_RESPONSE'

  // Tìm turn của interviewer và candidate gần nhất
  const lastInterviewerTurn = [...session.turns].reverse().find((t) => t.role === 'INTERVIEWER')
  const lastCandidateTurn = [...session.turns].reverse().find((t) => t.role === 'CANDIDATE')

  const expectedTurnIndex =
    session.currentTurnIndex ?? lastInterviewerTurn?.turnIndex ?? 0
  const promptTurnId = session.currentPrompt?.turnId ?? lastInterviewerTurn?.id ?? 0

  // Văn bản câu trả lời bị lỗi cần thử lại (chỉ lấy nếu có cache vừa gửi hoặc session đang ở trạng thái lỗi của candidate)
  const failedAnswerContent =
    cachedAnswerText || (isEngineRetry || isFailed ? lastCandidateTurn?.content : null)
  const hasFailureState = Boolean(submissionError || isFailed || isEngineRetry)

  function formatFriendlyError(rawMsg: string): string {
    const lower = rawMsg.toLowerCase()
    if (lower.includes('elevenlabs') || lower.includes('speech request')) {
      return 'Dịch vụ giọng nói ElevenLabs từ chối yêu cầu (mã 502: có thể do hết lượt dùng miễn phí (credits), giới hạn tài khoản hoặc âm thanh quá ngắn).'
    }
    if (lower.includes('empty transcription')) {
      return 'Không nhận diện được giọng nói trong bản ghi (âm thanh quá ngắn, quá nhỏ hoặc có tạp âm). Hãy thử nói to và rõ hơn nhé!'
    }
    if (lower.includes('could not map ai response') || lower.includes('interviewreplyresult') || lower.includes('malformed')) {
      return 'Mô hình AI phản hồi sai định dạng JSON có cấu trúc (thường xảy ra khi câu trả lời thử mic/chưa đúng ngữ cảnh kỹ thuật, hoặc mô hình AI miễn phí sinh thiếu trường).'
    }
    if (lower.includes('500') || lower.includes('server error') || lower.includes('internal error')) {
      return 'Máy chủ AI tạm thời quá tải hoặc quá thời gian phản hồi (mã lỗi 500).'
    }
    return rawMsg
  }

  useEffect(() => {
    if (isRecording) {
      stopAllInterviewAudio()
    }
  }, [isRecording])

  async function handleStartRecording() {
    // Dừng giọng đọc AI ngay lập tức khi người dùng bắt đầu trả lời
    stopAllInterviewAudio()
    if (isEvaluating || submitAnswer.isPending || isSubmittingVoice) return
    setSubmissionError(null)
    const started = await startRecording()
    if (!started && recorderError) {
      toast.error(recorderError)
    }
  }

  async function processAudioSubmission(audioBlob: Blob) {
    setIsSubmittingVoice(true)
    setSubmissionError(null)
    setCachedAudioBlob(audioBlob)

    try {
      // 1. Chuyển đổi giọng nói thành văn bản
      const sttRes = await transcribeAudio(session.id, audioBlob)
      const answerText = sttRes.text ? sttRes.text.trim() : ''

      if (!answerText) {
        toast.warning(
          'Không nhận diện được nội dung câu trả lời. Vui lòng thử nói to và rõ hơn nhé!',
        )
        setIsSubmittingVoice(false)
        return
      }

      // Lưu lại văn bản đã nhận diện để không bị mất nếu backend AI lỗi
      const clientTurnId = crypto.randomUUID()
      setCachedAnswerText(answerText)
      setCachedClientTurnId(clientTurnId)

      // 2. Gửi trực tiếp câu trả lời đến AI
      await submitAnswer.mutateAsync({
        promptTurnId,
        expectedTurnIndex,
        content: answerText,
        clientTurnId,
        expectedVersion: session.version,
      })

      // Gửi thành công -> xóa dữ liệu tạm
      setCachedAudioBlob(null)
      setCachedAnswerText(null)
      setCachedClientTurnId(null)
      setSubmissionError(null)
    } catch (error) {
      const rawMsg = getErrorMessage(error)
      const friendlyMsg = formatFriendlyError(rawMsg)
      setSubmissionError(friendlyMsg)
      toast.error('Chưa gửi được: ' + friendlyMsg)
    } finally {
      setIsSubmittingVoice(false)
    }
  }

  async function handleStopAndSubmit() {
    if (isSubmittingVoice || submitAnswer.isPending) return
    try {
      const audioBlob = await stopRecording()
      if (!audioBlob) {
        return
      }

      // Ngăn gửi nếu người dùng chỉ bấm bật/tắt ngay (dưới 1 giây hoặc file rỗng)
      if (duration < 1 || audioBlob.size < 800) {
        toast.info('Đoạn thu âm quá ngắn hoặc chưa có giọng nói. Vui lòng nói rõ câu trả lời.')
        return
      }

      await processAudioSubmission(audioBlob)
    } catch (err) {
      const msg = getErrorMessage(err)
      setSubmissionError(formatFriendlyError(msg))
    }
  }

  async function handleRetrySubmit() {
    stopAllInterviewAudio()
    // Nếu có văn bản nhận diện được -> gửi thẳng văn bản
    if (failedAnswerContent) {
      if (submitAnswer.isPending || isSubmittingVoice) return
      setIsSubmittingVoice(true)
      try {
        const clientTurnId =
          cachedClientTurnId ||
          lastCandidateTurn?.requestId ||
          crypto.randomUUID()

        const targetExpectedIndex = lastCandidateTurn
          ? Math.max(0, lastCandidateTurn.turnIndex - 1)
          : expectedTurnIndex

        await submitAnswer.mutateAsync({
          promptTurnId,
          expectedTurnIndex: targetExpectedIndex,
          content: failedAnswerContent,
          clientTurnId,
          expectedVersion: session.version,
        })

        setCachedAudioBlob(null)
        setCachedAnswerText(null)
        setCachedClientTurnId(null)
        setSubmissionError(null)
      } catch (error) {
        const rawMsg = getErrorMessage(error)
        const friendlyMsg = formatFriendlyError(rawMsg)
        setSubmissionError(friendlyMsg)
        toast.error('Thử lại chưa thành công: ' + friendlyMsg)
      } finally {
        setIsSubmittingVoice(false)
      }
      return
    }

    // Nếu chưa có văn bản nhưng còn file audio blob trong bộ nhớ -> thử gửi lại file audio đó
    if (cachedAudioBlob) {
      await processAudioSubmission(cachedAudioBlob)
    }
  }

  function handleDiscardAndReRecord() {
    stopAllInterviewAudio()
    setCachedAudioBlob(null)
    setCachedAnswerText(null)
    setCachedClientTurnId(null)
    setSubmissionError(null)
    void handleStartRecording()
  }

  async function handleSendText() {
    const content = textInput.trim()
    if (!content || submitAnswer.isPending || isSubmittingVoice || isEvaluating) return

    stopAllInterviewAudio()
    setIsSubmittingVoice(true)
    try {
      const clientTurnId = crypto.randomUUID()
      const targetExpectedIndex = lastCandidateTurn
        ? Math.max(0, lastCandidateTurn.turnIndex - 1)
        : expectedTurnIndex

      setTextInput('')
      setCachedAnswerText(content)
      setCachedClientTurnId(clientTurnId)
      setSubmissionError(null)

      await submitAnswer.mutateAsync({
        promptTurnId,
        expectedTurnIndex: targetExpectedIndex,
        content,
        clientTurnId,
        expectedVersion: session.version,
      })

      setCachedAnswerText(null)
      setCachedClientTurnId(null)
      setSubmissionError(null)
    } catch (error) {
      const rawMsg = getErrorMessage(error)
      const friendlyMsg = formatFriendlyError(rawMsg)
      setSubmissionError(friendlyMsg)
      setTextInput(content) // phục hồi lại văn bản cho người dùng nếu lỗi
      toast.error('Không thể gửi câu trả lời: ' + friendlyMsg)
    } finally {
      setIsSubmittingVoice(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSendText()
    }
  }

  async function handleResume() {
    try {
      await resumeSession.mutateAsync({ expectedVersion: session.version })
      toast.success('Đã tiếp tục buổi phỏng vấn.')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(session.id) })
      toast.success('Đã làm mới dữ liệu phiên phỏng vấn.')
    } finally {
      setIsRefreshing(false)
    }
  }

  // Khối giao diện thông báo lỗi & nút Thử lại
  if (hasFailureState) {
    const errorMessage =
      submissionError ||
      session.statusMessage ||
      'Quá thời gian phản hồi hoặc máy chủ AI gặp sự cố (mã 500).'

    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-left shadow-xs transition-all animate-in fade-in-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-destructive text-sm font-semibold">
            <AlertCircle className="size-4.5 shrink-0" />
            <span>Chưa gửi được câu trả lời tới AI</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            title="Làm mới trạng thái từ máy chủ"
          >
            <RefreshCw className={cn('size-3', isRefreshing && 'animate-spin')} />
            <span>Làm mới</span>
          </Button>
        </div>

        <p className="text-xs text-destructive/90 leading-relaxed font-medium">
          {errorMessage}
        </p>

        {failedAnswerContent && (
          <div className="rounded-xl border border-border/70 bg-background/80 p-3 text-xs">
            <span className="font-semibold text-muted-foreground block mb-1 text-[11px]">
              Nội dung giọng nói đã ghi nhận (không bị mất):
            </span>
            <p className="text-foreground leading-relaxed italic line-clamp-4 select-text">
              &ldquo;{failedAnswerContent}&rdquo;
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {failedAnswerContent ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => void handleRetrySubmit()}
              disabled={isSubmittingVoice || submitAnswer.isPending}
              className="gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              {isSubmittingVoice || submitAnswer.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Đang gửi lại...</span>
                </>
              ) : (
                <>
                  <RotateCw className="size-3.5" />
                  <span>Thử lại (gửi lại câu này)</span>
                </>
              )}
            </Button>
          ) : cachedAudioBlob ? (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => void handleRetrySubmit()}
              disabled={isSubmittingVoice || submitAnswer.isPending}
              className="gap-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
            >
              {isSubmittingVoice || submitAnswer.isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Đang gửi lại âm thanh...</span>
                </>
              ) : (
                <>
                  <RotateCw className="size-3.5" />
                  <span>Thử gửi lại đoạn âm thanh vừa thu</span>
                </>
              )}
            </Button>
          ) : null}

          {session.mode === 'TEXT' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setTextInput(failedAnswerContent || '')
                setSubmissionError(null)
                setCachedAnswerText(null)
              }}
              disabled={isSubmittingVoice || submitAnswer.isPending}
              className="gap-1.5 text-xs font-medium"
            >
              <span>Sửa lại câu trả lời</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscardAndReRecord}
              disabled={isSubmittingVoice || submitAnswer.isPending}
              className="gap-1.5 text-xs font-medium"
            >
              <Mic className="size-3.5" />
              <span>Thu âm lại</span>
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (isPaused) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center bg-muted/20">
        <p className="text-sm text-muted-foreground">
          Phiên phỏng vấn đang tạm dừng. Hãy bấm nút bên dưới khi bạn đã sẵn sàng tiếp tục.
        </p>
        <Button onClick={() => void handleResume()} disabled={resumeSession.isPending} className="gap-2">
          {resumeSession.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4 fill-current" />
          )}
          Tiếp tục phỏng vấn
        </Button>
      </div>
    )
  }

  /* Chế độ thuần văn bản (Chat) */
  if (session.mode === 'TEXT') {
    return (
      <div className="relative flex flex-col gap-2 rounded-2xl border border-border/80 bg-card p-2 shadow-xs transition-all focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10">
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isEvaluating || submitAnswer.isPending || isSubmittingVoice}
          placeholder={
            isEvaluating || submitAnswer.isPending || isSubmittingVoice
              ? 'AI đang suy nghĩ và chuẩn bị câu hỏi tiếp theo...'
              : 'Nhập câu trả lời của bạn tại đây (nhấn Enter để gửi, Shift + Enter để xuống dòng)...'
          }
          rows={2}
          className="w-full resize-none bg-transparent px-2.5 py-1.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60 max-h-32 overflow-y-auto"
        />

        <div className="flex items-center justify-between px-2 pt-1 border-t border-border/40 text-xs">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            💡 Nhấn <strong>Enter</strong> để gửi, <strong>Shift + Enter</strong> để xuống dòng
          </span>
          <span className="text-[11px] text-muted-foreground sm:hidden">
            {textInput.length} ký tự
          </span>

          <Button
            type="button"
            size="sm"
            onClick={() => void handleSendText()}
            disabled={!textInput.trim() || isEvaluating || submitAnswer.isPending || isSubmittingVoice}
            className="h-8 px-4 text-xs gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs shrink-0"
          >
            {isEvaluating || submitAnswer.isPending || isSubmittingVoice ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                <span>Gửi trả lời</span>
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex items-center gap-2 rounded-2xl border bg-card p-1.5 shadow-xs transition-all',
        isRecording
          ? 'border-primary/40 ring-2 ring-primary/10 bg-primary/5'
          : 'border-border/60',
      )}
    >
      {isRecording ? (
        /* Recording in progress banner - clean primary palette */
        <div className="flex flex-1 items-center justify-between gap-3 px-3 py-1.5 min-h-[46px]">
          <div className="flex items-center gap-3">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            <span className="font-mono text-xs font-semibold text-primary">
              {formattedDuration}
            </span>

            {/* Dynamic Sound Wave: Wavy bars when speaking, straight dots when silent */}
            <div className="flex items-center gap-1.5 h-6 px-1">
              {audioLevels.map((lvl, idx) => (
                <span
                  key={idx}
                  className={cn(
                    'rounded-full transition-all duration-150 ease-out',
                    isSpeaking
                      ? 'bg-primary'
                      : 'bg-muted-foreground/35',
                  )}
                  style={{
                    height: isSpeaking ? `${Math.max(4, Math.round(lvl * 22))}px` : '4px',
                    width: isSpeaking ? '3px' : '4px',
                  }}
                />
              ))}
            </div>

            <span className="text-xs text-muted-foreground hidden sm:inline">
              {isSpeaking ? 'Đang nhận giọng nói...' : 'Đang lắng nghe (nói vào micro)...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelRecording}
              disabled={isSubmittingVoice}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              title="Hủy ghi âm lượt này"
            >
              <Trash2 className="size-3.5" />
              <span>Hủy</span>
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => void handleStopAndSubmit()}
              disabled={isSubmittingVoice}
              className="h-8 px-3.5 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
              title="Hoàn tất và gửi câu trả lời trực tiếp"
            >
              <Send className="size-3.5" />
              <span>Hoàn tất & Gửi</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Ready to answer by voice - Clean, stable bar without premature AI thinking */
        <div className="flex flex-1 items-center justify-between gap-3 px-3 py-1.5 min-h-[46px]">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mic className="size-3.5" />
            </div>
            <div>
              <span className="font-semibold text-foreground mr-1.5">Trả lời bằng giọng nói</span>
              <span className="text-muted-foreground hidden sm:inline">
                {isSubmittingVoice || submitAnswer.isPending
                  ? '(Đang xử lý âm thanh và chuyển câu trả lời tới AI...)'
                  : isEvaluating
                    ? '(AI đang phân tích câu trả lời và chuẩn bị câu hỏi tiếp theo...)'
                    : '(Bấm nút bên cạnh để nói trực tiếp, không cần gõ văn bản)'}
              </span>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => void handleStartRecording()}
            disabled={isEvaluating || isSubmittingVoice || submitAnswer.isPending}
            className="h-8 px-4 text-xs gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs transition-all shrink-0 disabled:opacity-60"
          >
            {isSubmittingVoice || submitAnswer.isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang gửi câu trả lời...</span>
              </>
            ) : isEvaluating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>AI đang suy nghĩ...</span>
              </>
            ) : (
              <>
                <Mic className="size-3.5" />
                <span>Bắt đầu trả lời</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
