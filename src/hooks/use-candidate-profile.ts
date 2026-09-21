import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmCandidateProfile,
  createManualProfile,
  getCandidateProfile,
  getCandidateProfiles,
  updateCandidateProfile,
} from '@/api/profile'
import { QUERY_KEYS } from '@/constants/query-keys'
import type {
  CandidateProfile,
  CreateCandidateProfileRequest,
  UpdateProfileRequest,
} from '@/types/profile'

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
    enabled: Number.isInteger(profileId),
  })
}

export function useCreateManualProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateCandidateProfileRequest) => createManualProfile(data),
    onSuccess: (profile: CandidateProfile) => {
      queryClient.setQueryData(QUERY_KEYS.profile(profile.id), profile)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
    },
  })
}

export function useUpdateCandidateProfile(profileId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileRequest) => updateCandidateProfile(profileId, data),
    onSuccess: (profile: CandidateProfile) => {
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
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cvDocuments })
    },
  })
}
