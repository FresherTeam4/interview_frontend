import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteCv, getCvs, retryCvParse, uploadCv } from '@/api/cv'
import { cvKeys, profileKeys } from '@/hooks/query-keys'
import type { CvDocument } from '@/types/cv-profile'

interface UploadCvVariables {
  file: File
  onProgress?: (percent: number) => void
}

export function useCvs() {
  return useQuery({
    queryKey: cvKeys.all,
    queryFn: getCvs,
  })
}

export function useUploadCv() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, onProgress }: UploadCvVariables) => uploadCv(file, onProgress),
    onSuccess: (cv) => {
      queryClient.setQueryData(cvKeys.detail(cv.id), cv)
      void queryClient.invalidateQueries({ queryKey: cvKeys.all, exact: true })
    },
  })
}

export function useRetryCvParse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: retryCvParse,
    onSuccess: (cv) => {
      queryClient.setQueryData(cvKeys.detail(cv.id), cv)
      void queryClient.invalidateQueries({ queryKey: cvKeys.all, exact: true })
    },
  })
}

export function useDeleteCv() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cv: CvDocument) => deleteCv(cv.id),
    onSuccess: (_, cv) => {
      queryClient.removeQueries({ queryKey: cvKeys.detail(cv.id) })
      queryClient.removeQueries({ queryKey: cvKeys.file(cv.id) })
      if (cv.profileId !== null) {
        queryClient.removeQueries({ queryKey: profileKeys.detail(cv.profileId) })
      }
      void queryClient.invalidateQueries({ queryKey: cvKeys.all, exact: true })
      void queryClient.invalidateQueries({ queryKey: profileKeys.all, exact: true })
    },
  })
}
