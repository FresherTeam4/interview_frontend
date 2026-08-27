import { useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getCvFileUrl } from '@/api/cv'
import { cvKeys } from '@/hooks/query-keys'

const EXPIRY_BUFFER_MS = 15_000

export const POPUP_BLOCKED_ERROR = 'POPUP_BLOCKED'

export function useCvFile(cvId: number | null, enabled = true) {
  const query = useQuery({
    queryKey: cvKeys.file(cvId ?? 0),
    queryFn: () => getCvFileUrl(cvId!),
    enabled: enabled && cvId !== null,
    staleTime: 0,
    refetchOnMount: 'always',
  })
  const expiresAt = query.data?.expiresAt
  const refetch = query.refetch

  useEffect(() => {
    if (!expiresAt) return

    const expiresAtMs = new Date(expiresAt).getTime()
    if (Number.isNaN(expiresAtMs)) return

    const refreshAfter = Math.max(0, expiresAtMs - Date.now() - EXPIRY_BUFFER_MS)
    const timeoutId = window.setTimeout(() => {
      void refetch()
    }, refreshAfter)

    return () => window.clearTimeout(timeoutId)
  }, [expiresAt, refetch])

  return query
}

/**
 * Mở PDF ở tab mới. URL chỉ được lấy mới mỗi lần mở nên không cache vào query,
 * và tab phải được mở ngay trong lượt click — nếu chờ request xong mới mở thì trình duyệt chặn popup.
 */
export function useOpenCvPdf() {
  return useMutation({
    mutationFn: async (cvId: number) => {
      const tab = window.open('about:blank', '_blank')
      if (!tab) throw new Error(POPUP_BLOCKED_ERROR)

      try {
        const file = await getCvFileUrl(cvId)
        tab.location.replace(file.url)
      } catch (error) {
        tab.close()
        throw error
      }
    },
  })
}

export function isPopupBlockedError(error: unknown): boolean {
  return error instanceof Error && error.message === POPUP_BLOCKED_ERROR
}
