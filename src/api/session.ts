import { api } from '@/api/client'
import type { PageResponse } from '@/types/jd'
import type { InterviewReport } from '@/types/report'
import type {
  CreateSessionRequest,
  InterviewSession,
  InterviewSessionAccepted,
  InterviewSessionSummary,
  SessionListScope,
  SessionVersionRequest,
  SubmitTextAnswerRequest,
  TextAnswerAccepted,
} from '@/types/session'

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
        role: 'INTERVIEWER' | 'CANDIDATE'
        contentText: string
        action?: 'OPENING' | 'EXPLORE' | 'FOLLOW_UP' | 'HANDLE_REQUEST' | 'CLOSE'
        focusAreaCode?: string | null
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

    const mappedTurns = (conv.turns || []).map((t: {
      id: number
      turnIndex: number
      role: 'INTERVIEWER' | 'CANDIDATE'
      content?: string
      contentText?: string
      action?: 'OPENING' | 'EXPLORE' | 'FOLLOW_UP' | 'HANDLE_REQUEST' | 'CLOSE'
      focusAreaCode?: string | null
      createdAt: string
    }) => ({
      id: t.id,
      turnIndex: t.turnIndex,
      role: t.role,
      inputMode: 'TEXT' as const,
      content: t.content || t.contentText || '',
      isFollowUp: t.action === 'FOLLOW_UP',
      followUpDepth: t.action === 'FOLLOW_UP' ? 1 : 0,
      createdAt: t.createdAt,
    }))

  const latestTurn = mappedTurns[mappedTurns.length - 1]

  let awaitingAction: InterviewSession['awaitingAction'] = 'NONE'
  if (mappedStatus === 'READY') {
    awaitingAction = 'START_SESSION'
  } else if (mappedStatus === 'IN_PROGRESS') {
    awaitingAction = latestTurn?.role === 'INTERVIEWER' ? 'CANDIDATE_ANSWER' : 'ENGINE_RESPONSE'
  } else if (mappedStatus === 'SCORING' || mappedStatus === 'COMPLETED') {
    awaitingAction = 'REPORT'
  }

  // Cập nhật trạng thái mới nhất vào danh sách lưu trữ
  updateStoredSessionSummary(sessionId, {
    status: mappedStatus,
    awaitingAction,
  })

  return {
    id: sessionId,
    profile: { id: 1, headline },
    jobDescription: { id: 1, title },
    difficulty: 'MEDIUM',
    mode: 'TEXT',
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
    statusMessage: null,
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
): Promise<PageResponse<InterviewSessionSummary>> {
  const all = getStoredSessions()

  // Đồng bộ trạng thái thực tế từ backend cho danh sách các phiên
  await Promise.allSettled(
    all.map(async (s) => {
      try {
        const res = await api.get<{
          id: number
          status: string
          templateTitle?: string
          profileName?: string
          durationMinutes?: number
        }>(`/interview-sessions/${s.id}`)

        const rawStatus = res.data?.status
        if (!rawStatus) return

        let updatedStatus = s.status
        if (rawStatus === 'PREPARING') updatedStatus = 'SCRIPT_GENERATING'
        else if (rawStatus === 'READY') updatedStatus = 'READY'
        else if (rawStatus === 'IN_PROGRESS') updatedStatus = 'IN_PROGRESS'
        else if (rawStatus === 'SCORING') updatedStatus = 'SCORING'
        else if (rawStatus === 'COMPLETED') updatedStatus = 'COMPLETED'
        else if (rawStatus === 'SCORING_FAILED') updatedStatus = 'SCORING_FAILED'
        else if (rawStatus === 'PREPARATION_FAILED') updatedStatus = 'FAILED'
        else if (rawStatus === 'CANCELLED' || rawStatus === 'EXPIRED') updatedStatus = 'ABANDONED'

        let overallScore = s.overallScore
        if (updatedStatus === 'COMPLETED' && overallScore == null) {
          try {
            const rep = await api.get<{ overallScore?: number }>(`/interview-sessions/${s.id}/report`)
            if (typeof rep.data?.overallScore === 'number') {
              overallScore = rep.data.overallScore
            }
          } catch {
            // report chưa xong
          }
        }

        const durationMinutes = res.data?.durationMinutes ?? s.durationMinutes
        const templateTitle = res.data?.templateTitle ?? s.jobDescriptionTitle
        const profileHeadline = res.data?.profileName ?? s.profileHeadline

        const hasChanged =
          updatedStatus !== s.status ||
          overallScore !== s.overallScore ||
          (durationMinutes !== undefined && durationMinutes !== s.durationMinutes) ||
          (templateTitle && templateTitle !== s.jobDescriptionTitle) ||
          (profileHeadline && profileHeadline !== s.profileHeadline)

        if (hasChanged) {
          s.status = updatedStatus
          s.overallScore = overallScore
          if (durationMinutes !== undefined) s.durationMinutes = durationMinutes
          if (templateTitle) s.jobDescriptionTitle = templateTitle
          if (profileHeadline) s.profileHeadline = profileHeadline
          updateStoredSessionSummary(s.id, {
            status: updatedStatus,
            overallScore,
            durationMinutes: s.durationMinutes,
            jobDescriptionTitle: s.jobDescriptionTitle,
            profileHeadline: s.profileHeadline,
          })
        }
      } catch {
        // bỏ qua lỗi nếu không kết nối được
      }
    }),
  )

  const filtered = all.filter((s) => {
    if (scope === 'ACTIVE') {
      return (
        s.status === 'READY' ||
        s.status === 'IN_PROGRESS' ||
        s.status === 'PAUSED' ||
        s.status === 'CREATED' ||
        s.status === 'SCRIPT_GENERATING'
      )
    }
    if (scope === 'HISTORY') {
      return (
        s.status === 'COMPLETED' ||
        s.status === 'SCORING' ||
        s.status === 'SCORING_FAILED' ||
        s.status === 'ABANDONED' ||
        s.status === 'FAILED'
      )
    }
    return true
  })
  return {
    items: filtered.slice(page * size, (page + 1) * size),
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size) || 1,
    page,
    size,
  }
}


export async function startSession(
  sessionId: number,
  data: SessionVersionRequest,
): Promise<InterviewSession> {
  try {
    // Thử backend InterviewConversationController
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
  const idempotencyKey = `ans-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  // Gửi trực tiếp đến endpoint AI của backend: POST /api/interview-sessions/{id}/answers
  const res = await api.post<{
    sessionId: number
    status: string
    currentTurnIndex: number
    candidateTurn?: { id: number; turnIndex: number; content?: string; contentText?: string; createdAt?: string }
    interviewerTurn?: { id: number; turnIndex: number; content?: string; contentText?: string; createdAt?: string }
  }>(
    `/interview-sessions/${sessionId}/answers`,
    {
      expectedTurnIndex: data.expectedTurnIndex ?? 0,
      answer: data.content,
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
        inputMode: 'TEXT' as const,
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
        inputMode: 'TEXT' as const,
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
  if (res.data?.overallScore !== undefined) {
    updateStoredSessionSummary(sessionId, {
      status: 'COMPLETED',
      overallScore: res.data.overallScore,
    })
  }
  return res.data
}

export async function retryScoring(sessionId: number): Promise<InterviewReport> {
  const res = await api.post<InterviewReport>(`/interview-sessions/${sessionId}/scoring/retry`)
  if (res.data?.overallScore !== undefined) {
    updateStoredSessionSummary(sessionId, {
      status: 'COMPLETED',
      overallScore: res.data.overallScore,
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
