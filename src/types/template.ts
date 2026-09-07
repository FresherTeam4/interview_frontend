export type SkillLevel = 'MUST_HAVE' | 'NICE_TO_HAVE'

export interface KeySkill {
  name: string
  level: SkillLevel
  description?: string
}

export interface JobAnalysis {
  sufficientJobContext: boolean
  sourceLanguage?: string
  jobTitle?: string
  targetSeniority?: string
  domain?: string
  summary?: string
  keySkills: KeySkill[]
}

export interface InterviewTemplate {
  id: number
  sourceJobDescriptionId?: number
  title: string
  jobTitle?: string
  targetSeniority?: string
  content?: JobAnalysis
  confirmed: boolean
  confirmedAt?: string
  published: boolean
  publishedAt?: string
  archivedAt?: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface InterviewTemplateSummary {
  id: number
  title: string
  jobTitle?: string
  targetSeniority?: string
  confirmed: boolean
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateInterviewTemplateRequest {
  expectedVersion: number
  title: string
  jobTitle?: string
  targetSeniority?: string
  content?: JobAnalysis
}

export interface InterviewOption {
  code: string
  name: string
}

export interface InterviewSessionOptions {
  languages: InterviewOption[]
  durations: number[]
  interviewerStyles: InterviewOption[]
}
