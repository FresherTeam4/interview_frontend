import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Loader2,
  Mic,
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
import { useSubmitTextAnswer } from '@/hooks/use-interview-session'
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [cachedAudioBlob, setCachedAudioBlob] = useState<Blob | null>(null)
  const [failedTextAnswer, setFailedTextAnswer] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const queryClient = useQueryClient()
  const submitAnswer = useSubmitTextAnswer(session.id)

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

  const isEngineRetry = session.awaitingAction === 'ENGINE_RETRY'
  const isEvaluating = session.awaitingAction === 'ENGINE_RESPONSE'

  // Tìm turn của interviewer và candidate gần nhất
  const lastInterviewerTurn = [...session.turns].reverse().find((t) => t.role === 'INTERVIEWER')
  const lastCandidateTurn = [...session.turns].reverse().find((t) => t.role === 'CANDIDATE')

  const expectedTurnIndex = lastInterviewerTurn?.turnIndex ?? 0
  const promptTurnId = session.currentPrompt?.turnId ?? lastInterviewerTurn?.id ?? 0

  // Văn bản câu trả lời có thể thử gửi lại
  const retryableText = failedTextAnswer || (isEngineRetry && !textInput.trim() ? lastCandidateTurn?.content : null)

  function formatFriendlyError(rawMsg: string): string {
    const lower = rawMsg.toLowerCase()
    if (lower.includes('elevenlabs') || lower.includes('speech request')) {
      return 'Dịch vụ giọng nói ElevenLabs từ chối yêu cầu (mã 502: có thể do hết lượt dùng miễn phí (credits), giới hạn tài khoản hoặc âm thanh quá ngắn).'
    }
    if (lower.includes('empty transcription')) {
      return 'Không nhận diện được giọng nói trong bản ghi (âm thanh quá ngắn, quá nhỏ hoặc có tạp âm). Hãy thử nói to và rõ hơn nhé!'
    }
    if (
      lower.includes('ai_malformed_output') ||
      lower.includes('invalid or unparseable output') ||
      lower.includes('could not map ai response') ||
      lower.includes('interviewreplyresult') ||
      lower.includes('malformed')
    ) {
      return 'Mô hình AI phản hồi sai định dạng JSON có cấu trúc (thường xảy ra khi câu trả lời thử mic/chưa đúng ngữ cảnh kỹ thuật, hoặc mô hình AI miễn phí sinh thiếu trường).'
    }
    if (lower.includes('out of sequence') || lower.includes('does not match the current interviewer turn')) {
      return 'Thứ tự lượt trả lời chưa khớp với câu hỏi hiện tại. Hệ thống đã đồng bộ lại lượt, vui lòng bấm gửi lại!'
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
    if (isEvaluating || submitAnswer.isPending || isSubmittingVoice || isRetrying) return
    setCachedAudioBlob(null)
    setFailedTextAnswer(null)
    const started = await startRecording()
    if (!started && recorderError) {
      toast.error(recorderError)
    }
  }

  async function processAudioSubmission(audioBlob: Blob) {
    setIsSubmittingVoice(true)

    try {
      // 1. Chuyển đổi giọng nói thành văn bản
      const sttRes = await transcribeAudio(session.id, audioBlob)
      const answerText = sttRes.text ? sttRes.text.trim() : ''

      if (!answerText) {
        const errorMsg =
          'Không nhận diện được giọng nói trong bản ghi (âm thanh quá ngắn, quá nhỏ hoặc có tạp âm). Hãy thử nói to và rõ hơn nhé!'
        toast.error(errorMsg)
        setCachedAudioBlob(audioBlob)
        return
      }

      // 2. Gửi trực tiếp câu trả lời đến AI
      await submitAnswer.mutateAsync({
        promptTurnId,
        expectedTurnIndex,
        content: answerText,
        clientTurnId: crypto.randomUUID(),
        expectedVersion: session.version,
        inputMode: 'VOICE',
      })

      // Gửi thành công -> xóa dữ liệu tạm
      setCachedAudioBlob(null)
      setFailedTextAnswer(null)
    } catch (error) {
      setCachedAudioBlob(audioBlob)
      const rawMsg = getErrorMessage(error)
      const friendlyMsg = formatFriendlyError(rawMsg)
      toast.error('Chưa gửi được: ' + friendlyMsg)
    } finally {
      setIsSubmittingVoice(false)
    }
  }

  async function handleStopAndSubmit() {
    if (isSubmittingVoice || submitAnswer.isPending || isRetrying) return
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
      toast.error(formatFriendlyError(msg))
    }
  }

  async function handleRetry() {
    if (isSubmittingVoice || submitAnswer.isPending || isRetrying) return
    stopAllInterviewAudio()

    // 1. Nếu có file âm thanh bị lỗi STT -> gửi lại âm thanh
    if (cachedAudioBlob) {
      setIsRetrying(true)
      try {
        await processAudioSubmission(cachedAudioBlob)
      } finally {
        setIsRetrying(false)
      }
      return
    }

    // 2. Nếu có câu trả lời văn bản bị lỗi hoặc AI server gặp sự cố (ENGINE_RETRY)
    const textToRetry = (retryableText || textInput).trim()
    if (!textToRetry) return

    setIsRetrying(true)
    try {
      // Khi retry lượt candidate đã lưu trên DB bị FAILED (ENGINE_RETRY),
      // bắt buộc dùng lại đúng requestId, expectedTurnIndex (của interviewer turn),
      // và inputMode để backend khớp idempotency (reclaimExisting)
      const isRetryingFailedTurn = isEngineRetry && lastCandidateTurn?.processingStatus === 'FAILED'
      const clientTurnId =
        isRetryingFailedTurn && lastCandidateTurn?.requestId
          ? lastCandidateTurn.requestId
          : crypto.randomUUID()
      const inputMode =
        isRetryingFailedTurn && lastCandidateTurn?.inputMode === 'VOICE'
          ? 'VOICE'
          : 'TEXT'
      const content =
        isRetryingFailedTurn && lastCandidateTurn?.content
          ? lastCandidateTurn.content
          : textToRetry

      await submitAnswer.mutateAsync({
        promptTurnId,
        expectedTurnIndex,
        content,
        clientTurnId,
        expectedVersion: session.version,
        inputMode,
      })
      setFailedTextAnswer(null)
      setTextInput('')
      toast.success('Đã gửi lại câu trả lời thành công!')
    } catch (error) {
      const rawMsg = getErrorMessage(error)
      if (rawMsg.includes('INTERVIEW_TURN_OUT_OF_SEQUENCE') || rawMsg.includes('does not match the current interviewer turn')) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(session.id) })
      }
      const friendlyMsg = formatFriendlyError(rawMsg)
      toast.error('Thử lại chưa thành công: ' + friendlyMsg)
    } finally {
      setIsRetrying(false)
    }
  }

  async function handleSendText() {
    const content = textInput.trim()
    if (!content || submitAnswer.isPending || isSubmittingVoice || isEvaluating || isRetrying) return

    stopAllInterviewAudio()
    setIsSubmittingVoice(true)
    // Người dùng chủ động gửi câu khác -> xóa đoạn ghi âm và văn bản lỗi cũ
    setCachedAudioBlob(null)
    setFailedTextAnswer(null)

    try {
      const clientTurnId = crypto.randomUUID()
      const targetExpectedIndex = expectedTurnIndex

      setTextInput('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }

      await submitAnswer.mutateAsync({
        promptTurnId,
        expectedTurnIndex: targetExpectedIndex,
        content,
        clientTurnId,
        expectedVersion: session.version,
        inputMode: 'TEXT',
      })
    } catch (error) {
      const rawMsg = getErrorMessage(error)
      if (rawMsg.includes('INTERVIEW_TURN_OUT_OF_SEQUENCE') || rawMsg.includes('does not match the current interviewer turn')) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(session.id) })
      }
      const friendlyMsg = formatFriendlyError(rawMsg)
      setTextInput(content) // phục hồi lại văn bản cho người dùng nếu lỗi
      setFailedTextAnswer(content) // lưu lại để người dùng có thể bấm nút Thử gửi lại
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





  // Khi đang thu âm giọng nói
  if (isRecording) {
    return (
      <div className="relative flex items-center justify-between gap-3 rounded-full border border-primary/40 ring-2 ring-primary/10 bg-primary/5 px-4 py-2 min-h-[50px] shadow-xs transition-all w-full">
        <div className="flex items-center gap-3 min-w-0">
          <span className="relative flex size-2.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-red-500" />
          </span>
          <span className="font-mono text-xs font-semibold text-foreground shrink-0">
            {formattedDuration}
          </span>

          {/* Sound wave visualizer */}
          <div className="flex items-center gap-1 h-5 px-1 shrink-0">
            {audioLevels.map((lvl, idx) => (
              <span
                key={idx}
                className={cn(
                  'rounded-full transition-all duration-150 ease-out',
                  isSpeaking ? 'bg-primary' : 'bg-muted-foreground/35',
                )}
                style={{
                  height: isSpeaking ? `${Math.max(4, Math.round(lvl * 20))}px` : '4px',
                  width: isSpeaking ? '3px' : '3px',
                }}
              />
            ))}
          </div>

          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            {isSpeaking ? 'Đang nhận giọng nói...' : 'Đang lắng nghe (nói vào micro)...'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            disabled={isSubmittingVoice}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground gap-1.5 rounded-full"
            title="Hủy ghi âm"
          >
            <Trash2 className="size-3.5" />
            <span className="hidden sm:inline">Hủy</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => void handleStopAndSubmit()}
            disabled={isSubmittingVoice}
            className="h-8 px-3.5 text-xs gap-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs"
            title="Hoàn tất và gửi câu trả lời"
          >
            {isSubmittingVoice ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang gửi...</span>
              </>
            ) : (
              <>
                <Send className="size-3.5" />
                <span>Hoàn tất & Gửi</span>
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Khung nhập liệu hợp nhất (Unified capsule input bar kiểu Gemini / ChatGPT)
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Nút nhỏ góc phải để thử gửi lại câu trả lời hoặc đoạn ghi âm vừa rồi nếu có */}
      {(cachedAudioBlob || retryableText) && (
        <div className="flex justify-end w-full animate-in fade-in-50 duration-150 pr-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleRetry()}
            disabled={isSubmittingVoice || submitAnswer.isPending || isRetrying}
            className="h-7 px-3 text-xs font-medium gap-1.5 rounded-full border-border/80 bg-card text-foreground hover:bg-muted shadow-xs transition-all"
            title={cachedAudioBlob ? 'Thử gửi lại đoạn âm thanh vừa thu' : 'Thử gửi lại câu trả lời'}
          >
            {isRetrying ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                <span>Đang gửi lại...</span>
              </>
            ) : (
              <>
                <RotateCw className="size-3 text-muted-foreground" />
                <span>{cachedAudioBlob ? 'Thử lại đoạn ghi âm vừa rồi' : 'Thử gửi lại câu trả lời'}</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Khung capsule hợp nhất */}
      <div
        className={cn(
          'relative flex items-center gap-2 border border-border/80 bg-card px-3.5 py-1.5 shadow-xs transition-all w-full',
          'focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10',
          textInput.includes('\n') || textInput.length > 60
            ? 'rounded-2xl items-end'
            : 'rounded-full min-h-[50px]',
        )}
      >
        <textarea
          ref={textareaRef}
          value={textInput}
          onChange={(e) => {
            setTextInput(e.target.value)
            if (cachedAudioBlob) {
              setCachedAudioBlob(null)
            }
            if (failedTextAnswer) {
              setFailedTextAnswer(null)
            }
            e.target.style.height = 'auto'
            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
          }}
          onKeyDown={handleKeyDown}
          disabled={isEvaluating || submitAnswer.isPending || isSubmittingVoice || isRetrying}
          placeholder={
            isEvaluating || submitAnswer.isPending || isSubmittingVoice || isRetrying
              ? 'AI đang phân tích câu trả lời của bạn...'
              : 'Nhập câu trả lời (hoặc bấm biểu tượng micro để nói)...'
          }
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60 min-h-[36px] max-h-28 overflow-y-auto leading-relaxed"
        />

        <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
          {/* Nút Micro để thu âm ngay */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void handleStartRecording()}
            disabled={isEvaluating || submitAnswer.isPending || isSubmittingVoice || isRetrying}
            className="size-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Nói trực tiếp qua micro"
          >
            <Mic className="size-4" />
          </Button>

          {/* Nút Gửi câu trả lời */}
          <Button
            type="button"
            size="icon"
            onClick={() => void handleSendText()}
            disabled={!textInput.trim() || isEvaluating || submitAnswer.isPending || isSubmittingVoice || isRetrying}
            className={cn(
              'size-8 rounded-full transition-all shrink-0 shadow-xs',
              textInput.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground/40 cursor-not-allowed',
            )}
            title="Gửi câu trả lời"
          >
            {isSubmittingVoice || submitAnswer.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Send className="size-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
