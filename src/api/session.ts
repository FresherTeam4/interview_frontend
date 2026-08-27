import { api } from '@/api/client'
import type { PageResponse } from '@/types/jd'
import type {
  CreateSessionRequest,
  InterviewRubric,
  InterviewSession,
  InterviewSessionAccepted,
  InterviewSessionSummary,
  RetrySessionRequest,
  SessionListScope,
  SessionVersionRequest,
  SubmitTextAnswerRequest,
  TextAnswerAccepted,
} from '@/types/session'

export async function createSession(
  idempotencyKey: string,
  data: CreateSessionRequest,
): Promise<InterviewSessionAccepted> {
  const res = await api.post<InterviewSessionAccepted>('/sessions', data, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return res.data
}

export async function getSession(sessionId: number): Promise<InterviewSession> {
  const res = await api.get<InterviewSession>(`/sessions/${sessionId}`)
  return res.data
}

export async function listSessions(
  scope: SessionListScope = 'ACTIVE',
  page = 0,
  size = 10,
): Promise<PageResponse<InterviewSessionSummary>> {
  const res = await api.get<PageResponse<InterviewSessionSummary>>('/sessions', {
    params: { scope, page, size },
  })
  return res.data
}

export async function getSessionRubric(sessionId: number): Promise<InterviewRubric> {
  const res = await api.get<InterviewRubric>(`/sessions/${sessionId}/rubric`)
  return res.data
}

export async function startSession(
  sessionId: number,
  data: SessionVersionRequest,
): Promise<InterviewSession> {
  const res = await api.post<InterviewSession>(`/sessions/${sessionId}/start`, data)
  return res.data
}

export async function pauseSession(
  sessionId: number,
  data: SessionVersionRequest,
): Promise<InterviewSession> {
  const res = await api.post<InterviewSession>(`/sessions/${sessionId}/pause`, data)
  return res.data
}

export async function resumeSession(
  sessionId: number,
  data: SessionVersionRequest,
): Promise<InterviewSession> {
  const res = await api.post<InterviewSession>(`/sessions/${sessionId}/resume`, data)
  return res.data
}

export async function submitTextAnswer(
  sessionId: number,
  data: SubmitTextAnswerRequest,
): Promise<TextAnswerAccepted> {
  const res = await api.post<TextAnswerAccepted>(`/sessions/${sessionId}/answers`, data)
  return res.data
}

export async function retrySession(
  sessionId: number,
  data: RetrySessionRequest,
): Promise<InterviewSessionAccepted> {
  const res = await api.post<InterviewSessionAccepted>(`/sessions/${sessionId}/retry`, data)
  return res.data
}
