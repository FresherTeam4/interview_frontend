import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveInterviewTemplate,
  confirmInterviewTemplate,
  getInterviewTemplate,
  getInterviewTemplates,
  publishInterviewTemplate,
  unpublishInterviewTemplate,
  updateInterviewTemplate,
} from '@/api/template'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { UpdateInterviewTemplateRequest } from '@/types/template'

export function useInterviewTemplates(scope: 'mine' | 'public' = 'mine', page = 0, size = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.interviewTemplates(scope, page, size),
    queryFn: () => getInterviewTemplates(scope, page, size),
  })
}

export function useInterviewTemplate(id: number | null | undefined) {
  return useQuery({
    queryKey: id ? QUERY_KEYS.interviewTemplate(id) : ['interview-templates', 'none'],
    queryFn: () => {
      if (!id) throw new Error('Template ID is required')
      return getInterviewTemplate(id)
    },
    enabled: typeof id === 'number' && id > 0,
  })
}

export function useUpdateInterviewTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInterviewTemplateRequest }) =>
      updateInterviewTemplate(id, data),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interviewTemplate(updated.id) })
    },
  })
}

export function useConfirmInterviewTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, expectedVersion }: { id: number; expectedVersion: number }) =>
      confirmInterviewTemplate(id, expectedVersion),
    onSuccess: (confirmed) => {
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interviewTemplate(confirmed.id) })
    },
  })
}

export function usePublishInterviewTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, expectedVersion }: { id: number; expectedVersion: number }) =>
      publishInterviewTemplate(id, expectedVersion),
    onSuccess: (published) => {
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interviewTemplate(published.id) })
    },
  })
}

export function useUnpublishInterviewTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, expectedVersion }: { id: number; expectedVersion: number }) =>
      unpublishInterviewTemplate(id, expectedVersion),
    onSuccess: (unpublished) => {
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interviewTemplate(unpublished.id) })
    },
  })
}

export function useArchiveInterviewTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, expectedVersion }: { id: number; expectedVersion: number }) =>
      archiveInterviewTemplate(id, expectedVersion),
    onSuccess: (archived) => {
      void queryClient.invalidateQueries({ queryKey: ['interview-templates'] })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.interviewTemplate(archived.id) })
    },
  })
}
