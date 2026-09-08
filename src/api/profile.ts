import { api } from '@/api/client'
import type { CandidateProfile, ProfileSummary, UpdateProfileRequest } from '@/types/profile'

/** Chưa trích xuất CV nào thì trả `200 []`, không phải 404. */
export async function getCandidateProfiles(): Promise<ProfileSummary[]> {
  const res = await api.get<ProfileSummary[]>('/profiles')
  return res.data
}

export async function getCandidateProfile(profileId: number): Promise<CandidateProfile> {
  const res = await api.get<CandidateProfile>(`/profiles/${profileId}`)
  return res.data
}

export async function updateCandidateProfile(
  profileId: number,
  data: UpdateProfileRequest,
): Promise<CandidateProfile> {
  const res = await api.put<CandidateProfile>(`/profiles/${profileId}`, data)
  return res.data
}

/** Idempotent: bấm lần thứ hai không dịch mốc đã ghi. */
export async function confirmCandidateProfile(profileId: number): Promise<CandidateProfile> {
  const res = await api.post<CandidateProfile>(`/profiles/${profileId}/confirm`)
  return res.data
}
