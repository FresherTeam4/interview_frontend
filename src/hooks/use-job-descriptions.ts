import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmJobDescription,
  createFileJd,
  createTextJd,
  deleteJobDescription,
  getJdFileUrl,
  getJobDescription,
  getJobDescriptions,
  updateJobDescription,
} from '@/api/jd'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { CreateTextJdRequest, JobDescription, UpdateJdRequest } from '@/types/jd'

export function useJobDescriptions(page = 0, size = 10) {
  return useQuery({
    queryKey: [...QUERY_KEYS.jobDescriptions, { page, size }],
    queryFn: () => getJobDescriptions(page, size),
  })
}

export function useJobDescription(id: number) {
  return useQuery({
    queryKey: QUERY_KEYS.jobDescription(id),
    queryFn: () => getJobDescription(id),
    enabled: Number.isInteger(id),
  })
}

export function useCreateTextJd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTextJdRequest) => createTextJd(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobDescriptions })
    },
  })
}

export function useCreateFileJd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ title, file }: { title: string; file: File }) => createFileJd(title, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobDescriptions })
    },
  })
}

export function useUpdateJd(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateJdRequest) => updateJobDescription(id, data),
    onSuccess: (jd: JobDescription) => {
      queryClient.setQueryData(QUERY_KEYS.jobDescription(id), jd)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobDescriptions })
    },
  })
}

export function useConfirmJd(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => confirmJobDescription(id),
    onSuccess: (jd: JobDescription) => {
      queryClient.setQueryData(QUERY_KEYS.jobDescription(id), jd)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobDescriptions })
    },
  })
}

export function useDeleteJd() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteJobDescription,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobDescriptions })
    },
  })
}

/** Presigned URL sống vài phút — lấy theo từng lần bấm, không cache. */
export function useJdFileUrl() {
  return useMutation({ mutationFn: getJdFileUrl })
}
