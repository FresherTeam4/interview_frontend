import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { confirmProfile, getProfile, getProfiles, updateProfile } from '@/api/profile'
import { cvKeys, profileKeys } from '@/hooks/query-keys'
import type { ProfileUpdatePayload } from '@/types/cv-profile'

export function useProfiles() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: getProfiles,
  })
}

export function useProfile(profileId: number | null) {
  return useQuery({
    queryKey: profileKeys.detail(profileId ?? 0),
    queryFn: () => getProfile(profileId!),
    enabled: profileId !== null,
  })
}

export function useUpdateProfile(profileId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ProfileUpdatePayload) => updateProfile(profileId, payload),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.detail(profile.id), profile)
      void queryClient.invalidateQueries({ queryKey: profileKeys.all, exact: true })
      void queryClient.invalidateQueries({ queryKey: cvKeys.all, exact: true })
    },
  })
}

export function useConfirmProfile(profileId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => confirmProfile(profileId),
    onSuccess: (profile) => {
      queryClient.setQueryData(profileKeys.detail(profile.id), profile)
      void queryClient.invalidateQueries({ queryKey: profileKeys.all, exact: true })
      void queryClient.invalidateQueries({ queryKey: cvKeys.all, exact: true })
    },
  })
}
