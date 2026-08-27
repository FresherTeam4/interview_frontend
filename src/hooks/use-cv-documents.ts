import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteCv, getCvDocuments, getCvFileUrl, retryParseCv, uploadCv } from '@/api/cv'
import { CV_IN_PROGRESS_STATUSES } from '@/constants/cv'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { CvDocument } from '@/types/cv'

/** Backend bóc tách ở luồng nền nên trạng thái chỉ đổi qua đường poll. */
const POLL_INTERVAL_MS = 2_000

export function isCvInProgress(cv: CvDocument): boolean {
  return CV_IN_PROGRESS_STATUSES.includes(cv.status)
}

/** Chỉ poll khi thật sự có CV đang chờ/đang bóc tách, xong là tự tắt. */
export function useCvDocuments() {
  return useQuery({
    queryKey: QUERY_KEYS.cvDocuments,
    queryFn: getCvDocuments,
    refetchInterval: (query) =>
      query.state.data?.some(isCvInProgress) ? POLL_INTERVAL_MS : false,
  })
}

export function useUploadCv() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadCv,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cvDocuments })
      // Trùng file đã bóc tách trước đó thì backend trả lại CV cũ, có thể kèm hồ sơ đã bị ẩn
      // theo CV vừa được bật lại.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
    },
  })
}

export function useRetryParseCv() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: retryParseCv,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cvDocuments })
    },
  })
}

export function useDeleteCv() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCv,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cvDocuments })
      // Hồ sơ đi cùng CV: xóa CV là hồ sơ rời khỏi danh sách theo.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
    },
  })
}

/** Link presigned sống 5 phút nên lấy theo từng lần bấm, không cache. */
export function useCvFileUrl() {
  return useMutation({ mutationFn: getCvFileUrl })
}
