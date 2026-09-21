import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteCv, getCvDocuments, getCvFileUrl, retryParseCv, uploadCv } from '@/api/cv'
import { CV_IN_PROGRESS_STATUSES, CV_STATUS } from '@/constants/cv'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { CvDocument } from '@/types/cv'

/** Backend trích xuất ở luồng nền nên trạng thái chỉ đổi qua đường poll. */
const POLL_INTERVAL_MS = 2_000

export function isCvInProgress(cv: CvDocument): boolean {
  return CV_IN_PROGRESS_STATUSES.includes(cv.status)
}

/** Chỉ poll khi thật sự có CV đang chờ/đang trích xuất, xong là tự tắt. */
export function useCvDocuments() {
  const queryClient = useQueryClient()
  const prevParsedIdsRef = useRef<Set<number> | null>(null)
  const prevInProgressCountRef = useRef<number | null>(null)

  const query = useQuery({
    queryKey: QUERY_KEYS.cvDocuments,
    queryFn: getCvDocuments,
    refetchInterval: (query) =>
      query.state.data?.some(isCvInProgress) ? POLL_INTERVAL_MS : false,
  })

  useEffect(() => {
    if (!query.data) return

    const currentParsedIds = new Set(
      query.data.filter((d) => d.status === CV_STATUS.PARSED).map((d) => d.id)
    )
    const currentInProgressCount = query.data.filter(isCvInProgress).length

    // 1. Nếu có bất kỳ CV nào chuyển sang PARSED (vừa hoàn tất trích xuất)
    if (prevParsedIdsRef.current !== null) {
      const hasNewlyParsed = [...currentParsedIds].some((id) => !prevParsedIdsRef.current?.has(id))
      if (hasNewlyParsed) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
      }
    }

    // 2. Nếu số lượng CV đang trích xuất giảm xuống (hoàn tất quá trình trích xuất / retry)
    if (
      prevInProgressCountRef.current !== null &&
      prevInProgressCountRef.current > currentInProgressCount
    ) {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
    }

    prevParsedIdsRef.current = currentParsedIds
    prevInProgressCountRef.current = currentInProgressCount
  }, [query.data, queryClient])

  return query
}

export function useUploadCv() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: uploadCv,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cvDocuments })
      // Trùng file đã trích xuất trước đó thì backend trả lại CV cũ, có thể kèm hồ sơ đã bị ẩn
      // theo CV vừa được bật lại.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
    },
  })
}

export function useRetryParseCv() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: retryParseCv,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cvDocuments })
    },
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
