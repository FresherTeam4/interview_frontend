export type InterviewAssessmentConfidence = 'LOW' | 'MEDIUM' | 'HIGH'
export type InterviewEvidenceStatus = 'NOT_EXPLORED' | 'PARTIAL' | 'SUFFICIENT'
export type InterviewFocusPriority = 'HIGH' | 'MEDIUM' | 'LOW'

export interface ReportItem {
  title: string
  description: string
  evidenceTurnIds: number[]
}

export interface ActionPlanItem {
  priority: number
  action: string
  reason: string
  suggestion: string
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
  rationale: string
  strengths: string[]
  gaps: string[]
  feedback: string
  evidenceTurnIds: number[]
}

export interface InterviewReport {
  sessionId: number
  status: 'SCORING' | 'COMPLETED' | 'SCORING_FAILED'
  scoringErrorCode: string | null
  scoringErrorMessage: string | null
  technicalScore: number | null
  communicationScore: number | null
  overallScore: number | null
  coveragePercentage: number | null
  confidence: InterviewAssessmentConfidence | null
  overallSummary: string | null
  strengths: ReportItem[]
  improvements: ReportItem[]
  actionPlan: ActionPlanItem[]
  communicationFeedback: string | null
  focusAreas: FocusAreaResult[]
  completedAt: string | null
}
