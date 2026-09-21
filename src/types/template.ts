import type { TemplateModerationStatus } from './admin'

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
  moderationStatus?: TemplateModerationStatus
  moderationReason?: string
  submittedAt?: string
  reviewedAt?: string
  archivedAt?: string
  version: number
  createdAt: string
  updatedAt: string
}

export interface InterviewTemplateSummary {
  id: number
  sourceJobDescriptionId?: number
  title: string
  jobTitle?: string
  targetSeniority?: string
  confirmed: boolean
  published: boolean
  moderationStatus?: TemplateModerationStatus
  moderationReason?: string
  category?: string
  tagsJson?: string
  featured?: boolean
  archivedAt?: string
  createdAt?: string
  updatedAt: string
}

export interface TemplatePageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
}

export interface UpdateInterviewTemplateRequest {
  expectedVersion: number
  title: string
  jobTitle?: string
  targetSeniority?: string
  content?: JobAnalysis
}

export interface CloneInterviewTemplateRequest {
  title?: string
}

export interface TemplateFavoriteResponse {
  templateId: number
  favorite: boolean
}

export type TemplateScope = 'mine' | 'public' | 'favorites' | 'recent'

export interface TemplateListParams {
  scope?: TemplateScope
  keyword?: string
  seniority?: string
  language?: string
  technology?: string
  page?: number
  size?: number
}

export interface InterviewOption {
  code: string
  name: string
}

export interface InterviewSessionOptions {
  languages: InterviewOption[]
  durations: number[]
  interviewerStyles: InterviewOption[]
  modes?: InterviewOption[]
}
