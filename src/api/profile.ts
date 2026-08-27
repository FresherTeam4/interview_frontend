import { api } from '@/api/client'
import type {
  CandidateProfile,
  ProfileSummary,
  ProfileUpdatePayload,
} from '@/types/cv-profile'

export async function getProfiles(): Promise<ProfileSummary[]> {
  const response = await api.get<ProfileSummary[]>('/profiles')
  return response.data
}

export async function getProfile(profileId: number): Promise<CandidateProfile> {
  const response = await api.get<CandidateProfile>(`/profiles/${profileId}`)
  return response.data
}

export async function updateProfile(
  profileId: number,
  payload: ProfileUpdatePayload,
): Promise<CandidateProfile> {
  const response = await api.put<CandidateProfile>(`/profiles/${profileId}`, payload)
  return response.data
}

export async function confirmProfile(profileId: number): Promise<CandidateProfile> {
  const response = await api.post<CandidateProfile>(`/profiles/${profileId}/confirm`)
  return response.data
}
