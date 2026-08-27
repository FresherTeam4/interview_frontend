export type CvStatus = 'UPLOADED' | 'PARSING' | 'PARSED' | 'FAILED'

export type ProfileSource = 'AUTO_PARSED' | 'USER_EDITED'

export interface CvDocument {
  id: number
  originalFilename: string
  contentType: string
  fileSizeBytes: number
  status: CvStatus
  statusMessage: string | null
  uploadedAt: string
  parsedAt: string | null
  profileId: number | null
  profileConfirmed: boolean
  profileHeadline: string | null
}

export interface CvFileUrl {
  url: string
  expiresAt: string
}

export interface ProfileSummary {
  id: number
  cvDocumentId: number
  cvOriginalFilename: string
  headline: string | null
  targetPosition: string | null
  seniorityLevel: string | null
  source: ProfileSource
  confirmedAt: string | null
  educationCount: number
  skillCount: number
  projectCount: number
  createdAt: string
  updatedAt: string
}

export interface ProfileEducation {
  id: number | null
  school: string
  degree: string | null
  fieldOfStudy: string | null
  startYear: number | null
  endYear: number | null
  userEdited: boolean
  displayOrder: number
}

export interface ProfileSkill {
  id: number | null
  name: string
  category: string | null
  userEdited: boolean
  displayOrder: number
}

export interface ProfileProject {
  id: number | null
  name: string
  description: string | null
  roleInProject: string | null
  techStack: string | null
  startDate: string | null
  endDate: string | null
  userEdited: boolean
  displayOrder: number
}

export interface CandidateProfile {
  id: number
  cvDocumentId: number
  cvOriginalFilename: string
  headline: string | null
  yearsExperience: number | null
  targetPosition: string | null
  seniorityLevel: string | null
  source: ProfileSource
  confirmedAt: string | null
  createdAt: string
  updatedAt: string
  educations: ProfileEducation[]
  skills: ProfileSkill[]
  projects: ProfileProject[]
}

export interface ProfileEducationInput {
  id?: number
  school: string
  degree: string | null
  fieldOfStudy: string | null
  startYear: number | null
  endYear: number | null
}

export interface ProfileSkillInput {
  id?: number
  name: string
  category: string | null
}

export interface ProfileProjectInput {
  id?: number
  name: string
  description: string | null
  roleInProject: string | null
  techStack: string | null
  startDate: string | null
  endDate: string | null
}

export interface ProfileUpdatePayload {
  headline: string | null
  yearsExperience: number | null
  targetPosition: string | null
  seniorityLevel: string | null
  educations: ProfileEducationInput[]
  skills: ProfileSkillInput[]
  projects: ProfileProjectInput[]
}
