import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmCandidateProfile,
  getCandidateProfile,
  getCandidateProfiles,
  updateCandidateProfile,
} from '@/api/profile'
import { QUERY_KEYS } from '@/constants/query-keys'
import type { CandidateProfile, UpdateProfileRequest } from '@/types/profile'

export function useCandidateProfiles() {
  return useQuery({
    queryKey: QUERY_KEYS.profiles,
    queryFn: getCandidateProfiles,
  })
}

export function useCandidateProfile(profileId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.profile(profileId),
    queryFn: () => getCandidateProfile(profileId),
    // id lấy từ URL nên có thể là NaN — đừng bắn request rác trong trường hợp đó.
    enabled: Number.isInteger(profileId),
  })
}

export function useUpdateCandidateProfile(profileId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateCandidateProfile(profileId, data),
    onSuccess: (profile: CandidateProfile) => {
      // Response đã là hồ sơ đầy đủ vừa đọc lại từ DB (kèm id của những hàng mới thêm) nên
      // ghi thẳng vào cache; danh sách thì chỉ cần đánh dấu cũ vì nó đếm số mục con.
      queryClient.setQueryData(QUERY_KEYS.profile(profileId), profile)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
    },
  })
}

export function useConfirmCandidateProfile(profileId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => confirmCandidateProfile(profileId),
    onSuccess: (profile: CandidateProfile) => {
      queryClient.setQueryData(QUERY_KEYS.profile(profileId), profile)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
      // Dòng CV mang nhãn "đã xác nhận" nên phải làm mới theo.
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cvDocuments })
    },
  })
}
