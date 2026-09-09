import { useState, useRef, useCallback, useEffect } from 'react'
import { stopAllInterviewAudio } from '@/hooks/use-turn-audio-player'

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

function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
        const tracks = streamRef.current?.getTracks()
        tracks?.forEach((t) => t.stop())
        streamRef.current = null

        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        setIsRecording(false)

        if (stopResolverRef.current) {
          if (audioChunksRef.current.length > 0) {
            const finalBlob = new Blob(audioChunksRef.current, {
              type: mediaRecorder.mimeType || 'audio/webm',
            })
            stopResolverRef.current(finalBlob)
          } else {
            stopResolverRef.current(null)
          }
          stopResolverRef.current = null
        }
      }

      // Setup real-time audio analysis for voice activity & sound wave
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        if (AudioContextClass) {
          const audioContext = new AudioContextClass()
          audioContextRef.current = audioContext

          const analyser = audioContext.createAnalyser()
          analyser.fftSize = 64
          analyser.smoothingTimeConstant = 0.5
          analyserRef.current = analyser

          const source = audioContext.createMediaStreamSource(stream)
          sourceRef.current = source
          source.connect(analyser)

          const bufferLength = analyser.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)

          const analyze = () => {
            if (!analyserRef.current) return

            analyserRef.current.getByteFrequencyData(dataArray)

            // Compute overall amplitude
            let sum = 0
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i]
            }
            const avg = sum / bufferLength

            // Speaking threshold
            const speaking = avg > 10
            setIsSpeaking(speaking)

            // Sample 7 frequency bands
            const step = Math.max(1, Math.floor(bufferLength / 7))
            const levels = [0, 1, 2, 3, 4, 5, 6].map((i) => {
              const val = dataArray[Math.min(bufferLength - 1, i * step)] || 0
              return Math.min(1, Math.max(0.15, val / 150))
            })

            setAudioLevels(speaking ? levels : DEFAULT_AUDIO_LEVELS)

            rafRef.current = requestAnimationFrame(analyze)
          }

          rafRef.current = requestAnimationFrame(analyze)
        }
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
    formattedDuration: formatTime(duration),
    isSpeaking,
    audioLevels,
    startRecording,
    stopRecording,
    cancelRecording,
    error,
  }
}
