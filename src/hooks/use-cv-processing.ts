import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCv } from '@/api/cv'
import { cvKeys, profileKeys } from '@/hooks/query-keys'

export function useCvProcessing(cvId: number | null) {
  const queryClient = useQueryClient()
  const handledTerminalState = useRef<string | null>(null)
  const query = useQuery({
    queryKey: cvKeys.detail(cvId ?? 0),
    queryFn: () => getCv(cvId!),
    enabled: cvId !== null,
    refetchInterval: (currentQuery) => {
      const status = currentQuery.state.data?.status
      return status === 'UPLOADED' || status === 'PARSING' ? 2_000 : false
    },
  })

  useEffect(() => {
    const cv = query.data
    if (!cv || (cv.status !== 'PARSED' && cv.status !== 'FAILED')) return

    const terminalKey = `${cv.id}:${cv.status}:${cv.parsedAt ?? ''}`
    if (handledTerminalState.current === terminalKey) return

    handledTerminalState.current = terminalKey
    void queryClient.invalidateQueries({ queryKey: cvKeys.all, exact: true })
    void queryClient.invalidateQueries({ queryKey: profileKeys.all, exact: true })
  }, [query.data, queryClient])

  return query
}
