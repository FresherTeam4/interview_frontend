export type InterviewAssessmentConfidence = 'LOW' | 'MEDIUM' | 'HIGH'
export type InterviewEvidenceStatus = 'NOT_EXPLORED' | 'PARTIAL' | 'SUFFICIENT'
export type InterviewFocusPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ImprovementItem {
  title: string
  summary: string
}

export interface FocusAreaResult {
  focusAreaId: number
  code: string
  name: string
  priority: InterviewFocusPriority
  displayOrder: number
  score: number | null
  confidence: InterviewAssessmentConfidence
  evidenceStatus: InterviewEvidenceStatus
  summary: string
}

export interface ReportScoreFeedback {
  score: number | null
  feedback?: string | null
}

export interface ReportFocusArea {
  name: string
  score: number | null
}

export interface ReportDetails {
  score: number | null
  summary: string | null
  scores?: {
    technical?: ReportScoreFeedback
    communication?: ReportScoreFeedback
  }
  focusAreas?: ReportFocusArea[]
  recommendations?: string[]
}

export interface InterviewReport {
  sessionId: number
  status: 'SCORING' | 'COMPLETED' | 'SCORING_FAILED'
  scoringErrorCode: string | null
  scoringErrorMessage: string | null
  report?: ReportDetails | null
  technicalScore?: number | null
  communicationScore?: number | null
  overallScore?: number | null
  coveragePercentage?: number | null
  confidence?: InterviewAssessmentConfidence | null
  overallSummary?: string | null
  improvements?: ImprovementItem[]
  communicationFeedback?: string | null
  focusAreas?: FocusAreaResult[]
  completedAt: string | null
}
