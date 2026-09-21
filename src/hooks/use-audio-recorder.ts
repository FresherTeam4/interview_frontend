import { useState, useRef, useCallback, useEffect } from 'react'
import { stopAllInterviewAudio } from '@/lib/audio-bus'
import { formatDurationSeconds } from '@/lib/format'

interface UseAudioRecorderResult {
  isRecording: boolean
  duration: number
  formattedDuration: string
  isSpeaking: boolean
  audioLevels: number[]
  startRecording: () => Promise<boolean>
  stopRecording: () => Promise<Blob | null>
  cancelRecording: () => void
  error: string | null
}

function getBestAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/aac',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return ''
}

const DEFAULT_AUDIO_LEVELS = [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1]

export function useAudioRecorder(): UseAudioRecorderResult {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioLevels, setAudioLevels] = useState<number[]>(DEFAULT_AUDIO_LEVELS)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const stopResolverRef = useRef<((blob: Blob | null) => void) | null>(null)

  // Web Audio API refs for real-time sound activity detection
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const rafRef = useRef<number | null>(null)

  const cleanupAudioAnalyser = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
    setIsSpeaking(false)
    setAudioLevels(DEFAULT_AUDIO_LEVELS)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudioAnalyser()
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [cleanupAudioAnalyser])

  const startRecording = useCallback(async (): Promise<boolean> => {
    // Dừng ngay lập tức bất kỳ giọng đọc AI nào đang phát để tránh lọt vào micro
    stopAllInterviewAudio()
    setError(null)
    setDuration(0)
    audioChunksRef.current = []

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Trình duyệt của bạn không hỗ trợ ghi âm trực tiếp.')
      return false
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream

      const mimeType = getBestAudioMimeType()
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const mime = mediaRecorder.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunksRef.current, { type: mime })
        if (stopResolverRef.current) {
          stopResolverRef.current(audioBlob)
          stopResolverRef.current = null
        }
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
        setIsRecording(false)
      }

      // Khởi tạo AnalyserNode để phân tích âm lượng và phát hiện giọng nói
      try {
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.4
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)

        audioContextRef.current = audioCtx
        analyserRef.current = analyser
        sourceRef.current = source

        const dataArray = new Uint8Array(analyser.frequencyBinCount)

        const updateAudioData = () => {
          if (!analyserRef.current) return
          analyserRef.current.getByteFrequencyData(dataArray)

          let sum = 0
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i]
          }
          const average = sum / dataArray.length
          const normalizedAverage = Math.min(1, average / 128)

          // Ngưỡng phát hiện người dùng đang nói
          setIsSpeaking(normalizedAverage > 0.15)

          // Chia làm 7 dải tần để vẽ visualization
          const barCount = 7
          const step = Math.floor(dataArray.length / barCount) || 1
          const levels: number[] = []

          for (let i = 0; i < barCount; i++) {
            let barSum = 0
            const count = Math.min(step, dataArray.length - i * step)
            for (let j = 0; j < count; j++) {
              barSum += dataArray[i * step + j]
            }
            const barAvg = count > 0 ? barSum / count : 0
            const val = Math.max(0.1, Math.min(1, barAvg / 180))
            levels.push(val)
          }

          setAudioLevels(levels)
          rafRef.current = requestAnimationFrame(updateAudioData)
        }

        rafRef.current = requestAnimationFrame(updateAudioData)
      } catch (analyserErr) {
        console.warn('Audio analyser init failed:', analyserErr)
      }

      // Collect data every 250ms for reliable chunks
      mediaRecorder.start(250)
      setIsRecording(true)

      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1)
      }, 1000)

      return true
    } catch (err: unknown) {
      cleanupAudioAnalyser()
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Quyền truy cập micro đã bị từ chối. Vui lòng cho phép quyền micro để ghi âm.')
        } else if (err.name === 'NotFoundError') {
          setError('Không tìm thấy thiết bị micro nào trên máy của bạn.')
        } else {
          setError('Không thể khởi động micro: ' + err.message)
        }
      } else {
        setError('Không thể khởi động micro ghi âm.')
      }
      return false
    }
  }, [cleanupAudioAnalyser])

  const stopRecording = useCallback((): Promise<Blob | null> => {
    cleanupAudioAnalyser()
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      if (!recorder || recorder.state === 'inactive') {
        resolve(null)
        return
      }

      stopResolverRef.current = resolve
      recorder.stop()
    })
  }, [cleanupAudioAnalyser])

  const cancelRecording = useCallback(() => {
    cleanupAudioAnalyser()
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    const recorder = mediaRecorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      // Discard resolver without returning blob
      stopResolverRef.current = null
      recorder.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    audioChunksRef.current = []
    setIsRecording(false)
    setDuration(0)
  }, [cleanupAudioAnalyser])

  return {
    isRecording,
    duration,
    formattedDuration: formatDurationSeconds(duration),
    isSpeaking,
    audioLevels,
    startRecording,
    stopRecording,
    cancelRecording,
    error,
  }
}
