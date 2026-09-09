import { useState, useRef, useCallback, useEffect } from 'react'
import { getInterviewerTurnAudio } from '@/api/speech'
import { getErrorMessage } from '@/api/api-error'
import { toast } from 'sonner'

interface UseTurnAudioPlayerResult {
  playingTurnId: number | null
  loadingTurnId: number | null
  playTurn: (turnId: number) => Promise<void>
  stopAudio: () => void
}

export function stopAllInterviewAudio() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('interview:stop-audio'))
  }
}

export function useTurnAudioPlayer(sessionId: number): UseTurnAudioPlayerResult {
  const [playingTurnId, setPlayingTurnId] = useState<number | null>(null)
  const [loadingTurnId, setLoadingTurnId] = useState<number | null>(null)

  const audioCacheRef = useRef<Map<number, string>>(new Map())
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  const stopAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    setPlayingTurnId(null)
    setLoadingTurnId(null)
  }, [])

  // Listen to global stop audio event
  useEffect(() => {
    const handleStop = () => stopAudio()
    window.addEventListener('interview:stop-audio', handleStop)
    return () => {
      window.removeEventListener('interview:stop-audio', handleStop)
    }
  }, [stopAudio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio()
      // Revoke all created object URLs to prevent memory leaks
      audioCacheRef.current.forEach((url) => URL.revokeObjectURL(url))
      audioCacheRef.current.clear()
    }
  }, [stopAudio])

  const playTurn = useCallback(
    async (turnId: number) => {
      // If clicking on the currently playing turn, toggle pause/stop
      if (playingTurnId === turnId) {
        stopAudio()
        return
      }

      // Stop any other currently playing audio
      stopAudio()

      // 1. Check if audio URL already cached in memory
      let audioUrl = audioCacheRef.current.get(turnId)

      if (!audioUrl) {
        setLoadingTurnId(turnId)
        try {
          const blob = await getInterviewerTurnAudio(sessionId, turnId)
          audioUrl = URL.createObjectURL(blob)
          audioCacheRef.current.set(turnId, audioUrl)
        } catch (err) {
          setLoadingTurnId(null)
          toast.error('Không thể phát giọng đọc câu hỏi: ' + getErrorMessage(err))
          return
        } finally {
          setLoadingTurnId(null)
        }
      }

      if (!audioUrl) return

      try {
        const audio = new Audio(audioUrl)
        currentAudioRef.current = audio

        audio.onplay = () => {
          setPlayingTurnId(turnId)
        }

        audio.onended = () => {
          setPlayingTurnId(null)
          currentAudioRef.current = null
        }

        audio.onerror = () => {
          setPlayingTurnId(null)
          currentAudioRef.current = null
          toast.error('Định dạng âm thanh không thể phát trên trình duyệt.')
        }

        await audio.play()
      } catch (playErr) {
        setPlayingTurnId(null)
        currentAudioRef.current = null
        console.warn('Audio playback prevented or failed:', playErr)
      }
    },
    [sessionId, playingTurnId, stopAudio],
  )

  return {
    playingTurnId,
    loadingTurnId,
    playTurn,
    stopAudio,
  }
}
