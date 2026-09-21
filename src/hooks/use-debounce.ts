import { useEffect, useState } from 'react'

/**
 * Custom hook to debounce any fast-changing value (e.g. search input, filter text).
 * Delays updating the debounced value until after the specified delay has elapsed
 * since the last time the value changed.
 *
 * @param value The value to debounce
 * @param delay Milliseconds to wait before updating (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      window.clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
