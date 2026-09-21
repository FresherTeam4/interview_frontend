export type SessionStatus =
  | 'CREATED'
  | 'SCRIPT_GENERATING'
  | 'PREPARING'
  | 'READY'
  | 'PREPARATION_FAILED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'SCORING'
  | 'SCORING_FAILED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'ABANDONED'
  | 'FAILED'

export type SessionMode = 'TURN_BASED' | 'VOICE_REALTIME'

export type InterviewDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export type AwaitingAction =
  | 'START_SESSION'
  | 'CANDIDATE_ANSWER'
  | 'TRANSCRIPT_CONFIRMATION'
  | 'ENGINE_RESPONSE'
  | 'ENGINE_RETRY'
  | 'REPORT'
  | 'NONE'

export type InterviewSessionNextAction =
  | 'WAIT_FOR_PREPARATION'
  | 'RETRY_PREPARATION'
  | 'START'
  | 'CONTINUE'
  | 'WAIT_FOR_SCORING'
  | 'RETRY_SCORING'
  | 'VIEW_REPORT'
  | 'NONE'

export type TurnRole = 'INTERVIEWER' | 'CANDIDATE'
export type TurnInputMode = 'TEXT' | 'VOICE' | 'VOICE_REALTIME'

export type SessionListScope = 'ACTIVE' | 'HISTORY' | 'ALL'

export interface Turn {
  id: number
  turnIndex: number
  role: TurnRole
  inputMode: TurnInputMode
  content: string
  isFollowUp: boolean
  followUpDepth: number
  createdAt: string
  requestId?: string | null
  processingStatus?: 'PROCESSING' | 'COMPLETED' | 'FAILED' | null
  processingErrorCode?: string | null
}

export interface CurrentPrompt {
  turnId: number
  baseQuestionId: number
  ordinal: number
  text: string
  isFollowUp: boolean
  followUpDepth: number
  audioStatus?: string | null
}

export interface InterviewSession {
  id: number
  profile: { id: number; headline: string | null }
  jobDescription: { id: number; title: string }
  difficulty: InterviewDifficulty
  mode: SessionMode
  languageCode: string
  durationMinutes?: number
  deadlineAt?: string | null
  remainingSeconds?: number
  currentTurnIndex?: number
  status: SessionStatus
  awaitingAction: AwaitingAction
  version: number
  answeredQuestionCount?: number
  totalQuestionCount?: number
  currentPrompt: CurrentPrompt | null
  turns: Turn[]
  voiceDraft: unknown | null
  realtimeProvider?: string | null
  realtimeVoiceName?: string | null
  statusMessage: string | null
  lastActivityAt: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InterviewSessionAccepted {
  id: number
  status: SessionStatus
  awaitingAction: AwaitingAction
  version: number
  createdAt: string
}

export interface InterviewSessionSummary {
  id: number
  profileId: number
  profileHeadline: string | null
  jobDescriptionId: number
  jobDescriptionTitle: string
  difficulty: InterviewDifficulty
  mode: SessionMode
  durationMinutes?: number
  status: SessionStatus
  awaitingAction: AwaitingAction
  answeredQuestionCount?: number
  totalQuestionCount?: number
  overallScore: number | null
  lastActivityAt: string | null
  createdAt: string
}

export interface InterviewSessionSummaryResponse {
  id: number
  status: SessionStatus
  nextAction: InterviewSessionNextAction
  templateTitle: string
  profileName: string
  languageCode: string
  durationMinutes: number
  interviewerStyle: string
  mode: SessionMode
  overallScore: number | null
  technicalScore: number | null
  communicationScore: number | null
  startedAt: string | null
  deadlineAt: string | null
  endReason: string | null
  endedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface InterviewSessionPageResponse {
  items: InterviewSessionSummaryResponse[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface InterviewProgressResponse {
  periodFrom: string
  periodTo: string
  periodDays: number
  totalSessions: number
  completedSessions: number
  scoredSessions: number
  completionRate: number
  averages: {
    overall: number | null
    technical: number | null
    communication: number | null
  }
  overallChangeFromPreviousPeriod: number | null
  trend: Array<{
    sessionId: number
    templateTitle: string
    completedAt: string
    overall: number
    technical: number
    communication: number
  }>
  weakFocusAreas: Array<{
    code: string
    name: string
    averageScore: number
    scoredSessions: number
  }>
}

export type InterviewReadinessCheckStatus = 'PASS' | 'WARNING' | 'FAIL'

export interface InterviewReadinessCheck {
  code: string
  status: InterviewReadinessCheckStatus
  message: string
}

export interface InterviewReadinessResponse {
  ready: boolean
  requestedMode: SessionMode
  capabilities: {
    textInput: boolean
    pushToTalk: boolean
    realtimeVoice: boolean
    realtimeFallbackToTurnBased: boolean
  }
  checks: InterviewReadinessCheck[]
}

export interface CreateSessionRequest {
  profileId: number
  jobDescriptionId: number
  difficulty: InterviewDifficulty
  mode: SessionMode
  languageCode: string
}

export interface RetrySessionRequest {
  expectedVersion: number
}

export interface SessionVersionRequest {
  expectedVersion: number
}

export interface SubmitTextAnswerRequest {
  promptTurnId: number
  expectedTurnIndex?: number
  content: string
  clientTurnId: string
  expectedVersion: number
  inputMode?: 'TEXT' | 'VOICE'
}

export interface TextAnswerAccepted {
  sessionId: number
  candidateTurnId: number
  status: SessionStatus
  awaitingAction: AwaitingAction
  version: number
  candidateTurn?: Turn
  interviewerTurn?: Turn
}

export interface RubricCriterionLevel {
  levelNo: number
  label: string
  descriptor: string
  scoreValue: number
}

export interface RubricCriterion {
  code: string
  name: string
  description: string
  weight: number
  maxScore: number
  displayOrder: number
  levels: RubricCriterionLevel[]
}

export interface InterviewRubric {
  code: string
  name: string
  description: string
  version: number
  publishedAt: string | null
  criteria: RubricCriterion[]
}
