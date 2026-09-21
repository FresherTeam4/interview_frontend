import { useState, useEffect, useCallback, useRef } from 'react'

interface UseInterviewTimerProps {
  deadlineAt?: string | null
  initialRemainingSeconds?: number
  durationMinutes?: number
  startedAt?: string | null
  isPaused: boolean
  onExpire?: () => void
}

export function useInterviewTimer({
  deadlineAt,
  initialRemainingSeconds,
  durationMinutes = 30,
  startedAt,
  isPaused,
  onExpire,
}: UseInterviewTimerProps) {
  // Tính toán số giây còn lại dựa trên mốc thời gian thực tế (Wall-Clock Time)
  const calculateSecondsLeft = useCallback((): number => {
    // 1. Nếu backend cung cấp deadlineAt chính xác
    if (deadlineAt) {
      const deadlineMs = new Date(deadlineAt).getTime()
      if (!isNaN(deadlineMs)) {
        return Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000))
      }
    }

    // 2. Nếu có startedAt từ backend
    if (startedAt) {
      const startMs = new Date(startedAt).getTime()
      if (!isNaN(startMs)) {
        const elapsed = Math.floor((Date.now() - startMs) / 1000)
        const total = (durationMinutes || 30) * 60
        return Math.max(0, total - elapsed)
      }
    }

    // 3. Nếu có initialRemainingSeconds
    if (initialRemainingSeconds !== undefined && initialRemainingSeconds >= 0) {
      return initialRemainingSeconds
    }

    return (durationMinutes || 30) * 60
  }, [deadlineAt, startedAt, durationMinutes, initialRemainingSeconds])

  const [secondsLeft, setSecondsLeft] = useState<number>(() => calculateSecondsLeft())
  const expiredNotifiedRef = useRef(false)

  // Đồng hồ chạy & tự động sync chính xác khi người dùng chuyển tab hoặc quay lại tab
  useEffect(() => {
    if (isPaused) return

    function sync() {
      const remaining = calculateSecondsLeft()
      setSecondsLeft(remaining)

      if (remaining <= 0 && !expiredNotifiedRef.current) {
        expiredNotifiedRef.current = true
        onExpire?.()
      }
    }

    // Bắt đầu cập nhật qua microtask để tránh cascading render
    const initialTimer = setTimeout(sync, 0)
    const interval = setInterval(sync, 1000)

    // Khi người dùng chuyển sang tab khác rồi quay lại, lập tức tính toán lại từ Date.now()
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        sync()
      }
    }

    function handleWindowFocus() {
      sync()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [isPaused, calculateSecondsLeft, onExpire])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const isUrgent = secondsLeft > 0 && secondsLeft <= 300 // dưới 5 phút
  const isExpired = secondsLeft === 0

  return {
    secondsLeft,
    formattedTime,
    isUrgent,
    isExpired,
  }
}
