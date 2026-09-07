export type SessionStatus =
  | 'CREATED'
  | 'SCRIPT_GENERATING'
  | 'READY'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'SCORING'
  | 'SCORING_FAILED'
  | 'COMPLETED'
  | 'ABANDONED'
  | 'FAILED'

export type SessionMode = 'TEXT' | 'VOICE_TURN_BASED'

export type InterviewDifficulty = 'EASY' | 'MEDIUM' | 'HARD'

export type AwaitingAction =
  | 'START_SESSION'
  | 'CANDIDATE_ANSWER'
  | 'TRANSCRIPT_CONFIRMATION'
  | 'ENGINE_RESPONSE'
  | 'ENGINE_RETRY'
  | 'REPORT'
  | 'NONE'

export type TurnRole = 'INTERVIEWER' | 'CANDIDATE'
export type TurnInputMode = 'TEXT' | 'VOICE_TURN_BASED'

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
