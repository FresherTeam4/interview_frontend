import { api } from '@/api/client'
import type { InterviewReport } from '@/types/report'
import type {
  CreateSessionRequest,
  InterviewProgressResponse,
  InterviewReadinessResponse,
  InterviewSession,
  InterviewSessionAccepted,
  InterviewSessionPageResponse,
  SessionListScope,
  SessionMode,
  SessionStatus,
  SessionVersionRequest,
  SubmitTextAnswerRequest,
  TextAnswerAccepted,
  TurnRole,
  TurnInputMode,
} from '@/types/session'

import { tokenStorage } from '@/api/token-storage'
import {
  getStoredSessions,
  saveStoredSessionDetail,
  updateStoredSessionSummary,
} from '@/features/session/services/session-mock-service'


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
  // Lấy dữ liệu hội thoại và phiên trực tiếp từ backend
  const [resConv, resStatus] = await Promise.all([
    api.get<{
      sessionId: number
      status: string
      startedAt: string | null
      deadlineAt: string | null
      remainingSeconds: number
      currentTurnIndex: number
      turns: Array<{
        id: number
        turnIndex: number
        role: TurnRole
        inputMode?: TurnInputMode
        action?: string
        content?: string
        contentText?: string
        requestId?: string | null
        processingStatus?: 'PROCESSING' | 'COMPLETED' | 'FAILED' | null
        processingErrorCode?: string | null
        createdAt: string
      }>
    }>(`/interview-sessions/${sessionId}/conversation`),
    api.get<{
      id: number
      status: string
      templateTitle?: string
      profileName?: string
      durationMinutes?: number
      interviewerStyle?: string
      mode?: SessionMode
      realtimeProvider?: string | null
      realtimeVoiceName?: string | null
    }>(`/interview-sessions/${sessionId}`).catch(() => null),
  ])

  const conv = resConv.data
  const statusData = resStatus?.data
  const title = statusData?.templateTitle || 'Vị trí phỏng vấn'
  const headline = statusData?.profileName || 'Ứng viên'
  const durationMinutes = statusData?.durationMinutes || 30

  // Ánh xạ trạng thái từ backend sang frontend
  const rawStatus = conv.status || statusData?.status || 'IN_PROGRESS'
  let mappedStatus: InterviewSession['status'] = 'IN_PROGRESS'
  if (rawStatus === 'PREPARING') {
    mappedStatus = 'SCRIPT_GENERATING'
  } else if (rawStatus === 'READY') {
    mappedStatus = 'READY'
  } else if (rawStatus === 'IN_PROGRESS') {
    mappedStatus = 'IN_PROGRESS'
  } else if (rawStatus === 'SCORING') {
    mappedStatus = 'SCORING'
  } else if (rawStatus === 'COMPLETED') {
    mappedStatus = 'COMPLETED'
  } else if (rawStatus === 'SCORING_FAILED') {
    mappedStatus = 'SCORING_FAILED'
  } else if (rawStatus === 'PREPARATION_FAILED') {
    mappedStatus = 'FAILED'
  } else if (rawStatus === 'CANCELLED' || rawStatus === 'EXPIRED') {
    mappedStatus = 'ABANDONED'
  }

  const mappedTurns = (conv.turns || []).map((t) => ({
    id: t.id,
    turnIndex: t.turnIndex,
    role: t.role,
    inputMode: (t.inputMode === ('VOICE_TURN_BASED' as unknown) ? 'VOICE' : t.inputMode) || 'TEXT',
    content: t.content || t.contentText || '',
    isFollowUp: t.action === 'FOLLOW_UP',
    followUpDepth: t.action === 'FOLLOW_UP' ? 1 : 0,
    requestId: t.requestId,
    processingStatus: t.processingStatus,
    processingErrorCode: t.processingErrorCode,
    createdAt: t.createdAt,
  }))

  const latestTurn = mappedTurns[mappedTurns.length - 1]

  let awaitingAction: InterviewSession['awaitingAction'] = 'NONE'
  let statusMessage: string | null = null

  if (mappedStatus === 'READY') {
    awaitingAction = 'START_SESSION'
  } else if (mappedStatus === 'IN_PROGRESS') {
    if (latestTurn?.role === 'INTERVIEWER') {
      awaitingAction = 'CANDIDATE_ANSWER'
    } else if (latestTurn?.role === 'CANDIDATE') {
      if (latestTurn.processingStatus === 'FAILED' || latestTurn.processingErrorCode) {
        awaitingAction = 'ENGINE_RETRY'
        statusMessage = 'Quá thời gian phản hồi hoặc AI gặp sự cố (500). Bạn có thể thử lại lượt này.'
      } else {
        awaitingAction = 'ENGINE_RESPONSE'
      }
    }
  } else if (mappedStatus === 'SCORING' || mappedStatus === 'COMPLETED') {
    awaitingAction = 'REPORT'
  }

  const currentUserId = tokenStorage.getUserId()
  // Cập nhật trạng thái mới nhất vào danh sách lưu trữ
  updateStoredSessionSummary(
    sessionId,
    {
      status: mappedStatus,
      awaitingAction,
    },
    currentUserId,
  )

  const storedSession = getStoredSessions(currentUserId).find((s) => s.id === sessionId)
  const rawMode = statusData?.mode || storedSession?.mode
  const sessionMode: SessionMode =
    rawMode === 'VOICE_REALTIME' ? 'VOICE_REALTIME' : 'TURN_BASED'

  return {
    id: sessionId,
    profile: { id: 1, headline },
    jobDescription: { id: 1, title },
    difficulty: 'MEDIUM',
    mode: sessionMode,
    languageCode: 'vi',
    durationMinutes,
    deadlineAt: conv.deadlineAt,
    remainingSeconds: conv.remainingSeconds,
    currentTurnIndex: conv.currentTurnIndex,
    status: mappedStatus,
    awaitingAction,
    version: 1,
    currentPrompt:
      latestTurn && latestTurn.role === 'INTERVIEWER'
        ? {
            turnId: latestTurn.id,
            baseQuestionId: latestTurn.id,
            ordinal: latestTurn.turnIndex + 1,
            text: latestTurn.content,
            isFollowUp: latestTurn.isFollowUp ?? false,
            followUpDepth: latestTurn.followUpDepth ?? 0,
          }
        : null,
    turns: mappedTurns,
    voiceDraft: null,
    realtimeProvider: statusData?.realtimeProvider || null,
    realtimeVoiceName: statusData?.realtimeVoiceName || null,
    statusMessage,
    lastActivityAt: new Date().toISOString(),
    startedAt: conv.startedAt,
    completedAt: conv.status === 'COMPLETED' ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

export async function listSessions(
  scope: SessionListScope = 'ACTIVE',
  page = 0,
  size = 10,
  _userId?: number | null,
  filters?: {
    keyword?: string
    status?: SessionStatus
    mode?: SessionMode
    createdFrom?: string
    createdTo?: string
  },
): Promise<InterviewSessionPageResponse> {
  const params: Record<string, unknown> = {
    page,
    size,
  }
  if (filters?.keyword?.trim()) {
    params.keyword = filters.keyword.trim()
  }
  if (filters?.status) {
    params.status = filters.status
  } else if (scope === 'HISTORY') {
    params.status = 'COMPLETED'
  }
  if (filters?.mode) {
    params.mode = filters.mode
  }
  if (filters?.createdFrom) {
    params.createdFrom = filters.createdFrom
  }
  if (filters?.createdTo) {
    params.createdTo = filters.createdTo
  }

  const res = await api.get<InterviewSessionPageResponse>('/interview-sessions', {
    params,
  })

  // Nếu là tab ACTIVE và không chỉ định status cụ thể, lọc các phiên chưa kết thúc
  if (scope === 'ACTIVE' && !filters?.status) {
    const activeItems = res.data.items.filter(
      (s) => s.status !== 'COMPLETED' && s.status !== 'CANCELLED' && s.status !== 'EXPIRED',
    )
    return {
      ...res.data,
      items: activeItems,
      totalElements: activeItems.length,
    }
  }

  return res.data
}

export async function startSession(
  sessionId: number,
  data: SessionVersionRequest,
): Promise<InterviewSession> {
  try {
    await api.post(`/interview-sessions/${sessionId}/start`)
    return await getSession(sessionId)
  } catch {
    try {
      const res = await api.post<InterviewSession>(`/sessions/${sessionId}/start`, data)
      return res.data
    } catch {
      const session = await getSession(sessionId)
      return {
        ...session,
        status: 'IN_PROGRESS',
        awaitingAction: 'CANDIDATE_ANSWER',
      }
    }
  }
}

export async function pauseSession(
  sessionId: number,
  data: SessionVersionRequest,
): Promise<InterviewSession> {
  try {
    const res = await api.post<InterviewSession>(`/sessions/${sessionId}/pause`, data)
    return res.data
  } catch {
    const session = await getSession(sessionId)
    const updated: InterviewSession = { ...session, status: 'PAUSED' }
    saveStoredSessionDetail(updated)
    return updated
  }
}

export async function resumeSession(
  sessionId: number,
  data: SessionVersionRequest,
): Promise<InterviewSession> {
  try {
    const res = await api.post<InterviewSession>(`/sessions/${sessionId}/resume`, data)
    return res.data
  } catch {
    const session = await getSession(sessionId)
    const updated: InterviewSession = { ...session, status: 'IN_PROGRESS' }
    saveStoredSessionDetail(updated)
    return updated
  }
}

export async function submitTextAnswer(
  sessionId: number,
  data: SubmitTextAnswerRequest,
): Promise<TextAnswerAccepted> {
  const idempotencyKey =
    data.clientTurnId || `ans-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  const res = await api.post<{
    sessionId: number
    status: string
    currentTurnIndex: number
    candidateTurn?: { id: number; turnIndex: number; inputMode?: TurnInputMode; content?: string; contentText?: string; createdAt?: string }
    interviewerTurn?: { id: number; turnIndex: number; inputMode?: TurnInputMode; content?: string; contentText?: string; createdAt?: string }
  }>(
    `/interview-sessions/${sessionId}/answers`,
    {
      expectedTurnIndex: data.expectedTurnIndex ?? 0,
      answer: data.content,
      inputMode: data.inputMode || 'TEXT',
    },
    {
      headers: { 'Idempotency-Key': idempotencyKey },
      timeout: 90_000,
    },
  )

  const candidateTurn = res.data?.candidateTurn
    ? {
        id: res.data.candidateTurn.id,
        turnIndex: res.data.candidateTurn.turnIndex,
        role: 'CANDIDATE' as const,
        inputMode: (res.data.candidateTurn.inputMode === ('VOICE_TURN_BASED' as unknown) ? 'VOICE' : res.data.candidateTurn.inputMode) || data.inputMode || 'TEXT',
        content: res.data.candidateTurn.content || res.data.candidateTurn.contentText || data.content,
        isFollowUp: false,
        followUpDepth: 0,
        createdAt: res.data.candidateTurn.createdAt || new Date().toISOString(),
      }
    : undefined

  const interviewerTurn = res.data?.interviewerTurn
    ? {
        id: res.data.interviewerTurn.id,
        turnIndex: res.data.interviewerTurn.turnIndex,
        role: 'INTERVIEWER' as const,
        inputMode: (res.data.interviewerTurn.inputMode === ('VOICE_TURN_BASED' as unknown) ? 'VOICE' : res.data.interviewerTurn.inputMode) || 'TEXT',
        content: res.data.interviewerTurn.content || res.data.interviewerTurn.contentText || '',
        isFollowUp: false,
        followUpDepth: 0,
        createdAt: res.data.interviewerTurn.createdAt || new Date().toISOString(),
      }
    : undefined

  return {
    sessionId,
    candidateTurnId: res.data?.candidateTurn?.id ?? (data.promptTurnId + 1),
    status: 'IN_PROGRESS',
    awaitingAction: 'CANDIDATE_ANSWER',
    version: data.expectedVersion + 1,
    candidateTurn,
    interviewerTurn,
  }
}

export async function retrySession(
  sessionId: number,
  data?: SessionVersionRequest,
): Promise<InterviewSessionAccepted> {
  const res = await api.post<{ id: number; status: string }>(
    `/interview-sessions/${sessionId}/preparation/retry`,
    data,
  )
  return {
    id: res.data.id,
    status: (res.data.status as InterviewSessionAccepted['status']) || 'SCRIPT_GENERATING',
    awaitingAction: 'NONE',
    version: data?.expectedVersion ? data.expectedVersion + 1 : 1,
    createdAt: new Date().toISOString(),
  }
}

export async function getSessionReport(sessionId: number): Promise<InterviewReport> {
  const res = await api.get<InterviewReport>(`/interview-sessions/${sessionId}/report`)
  const score = (res.data as { report?: { score?: number } })?.report?.score ?? res.data?.overallScore
  if (res.data?.status === 'COMPLETED') {
    updateStoredSessionSummary(sessionId, {
      status: 'COMPLETED',
      overallScore: score,
    })
  } else if (res.data?.status === 'SCORING_FAILED') {
    updateStoredSessionSummary(sessionId, {
      status: 'SCORING_FAILED',
    })
  }
  return res.data
}

export async function retryScoring(sessionId: number): Promise<InterviewReport> {
  const res = await api.post<InterviewReport>(`/interview-sessions/${sessionId}/scoring/retry`)
  const score = (res.data as { report?: { score?: number } })?.report?.score ?? res.data?.overallScore
  if (res.data?.status) {
    updateStoredSessionSummary(sessionId, {
      status: res.data.status,
      overallScore: score ?? null,
    })
  }
  return res.data
}

export async function completeSession(
  sessionId: number,
  data: SessionVersionRequest,
): Promise<InterviewSessionAccepted> {
  await api.post(`/interview-sessions/${sessionId}/finish`)
  updateStoredSessionSummary(sessionId, {
    status: 'SCORING',
    awaitingAction: 'REPORT',
  })
  return {
    id: sessionId,
    status: 'SCORING',
    awaitingAction: 'REPORT',
    version: data.expectedVersion + 1,
    createdAt: new Date().toISOString(),
  }
}

export async function abandonSession(
  sessionId: number,
  data: SessionVersionRequest,
): Promise<InterviewSessionAccepted> {
  try {
    const res = await api.post<InterviewSessionAccepted>(`/sessions/${sessionId}/abandon`, data)
    return res.data
  } catch {
    return {
      id: sessionId,
      status: 'ABANDONED',
      awaitingAction: 'NONE',
      version: data.expectedVersion + 1,
      createdAt: new Date().toISOString(),
    }
  }
}

export interface InterviewSessionHistoryParams {
  keyword?: string
  status?: SessionStatus
  mode?: SessionMode
  createdFrom?: string
  createdTo?: string
  page?: number
  size?: number
}

export async function getInterviewSessionsHistory(
  params?: InterviewSessionHistoryParams,
): Promise<InterviewSessionPageResponse> {
  const res = await api.get<InterviewSessionPageResponse>('/interview-sessions', {
    params,
  })
  return res.data
}

export async function getInterviewProgress(days = 30): Promise<InterviewProgressResponse> {
  const res = await api.get<InterviewProgressResponse>('/interview-sessions/progress', {
    params: { days },
  })
  return res.data
}

export async function checkInterviewReadiness(
  data: CreateSessionRequest,
): Promise<InterviewReadinessResponse> {
  const res = await api.post<InterviewReadinessResponse>('/interview-sessions/readiness', data)
  return res.data
}

export async function cancelInterviewSession(
  sessionId: number,
): Promise<{ id: number; status: SessionStatus }> {
  const res = await api.post<{ id: number; status: SessionStatus }>(
    `/interview-sessions/${sessionId}/cancel`,
  )
  return res.data
}

export async function retryFailedTurn(
  sessionId: number,
  turnId: number,
): Promise<{
  sessionId: number
  candidateTurnId: number
  status: SessionStatus
  awaitingAction: string
  version: number
}> {
  const res = await api.post<{
    sessionId: number
    candidateTurnId: number
    status: SessionStatus
    awaitingAction: string
    version: number
  }>(`/interview-sessions/${sessionId}/turns/${turnId}/retry`)
  return res.data
}
