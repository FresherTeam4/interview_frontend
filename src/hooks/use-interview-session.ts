import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  abandonSession,
  completeSession,
  createSession,
  getSession,
  getSessionReport,
  listSessions,
  pauseSession,
  resumeSession,
  retryScoring,
  retrySession,
  startSession,
  submitTextAnswer,
} from '@/api/session'
import { QUERY_KEYS } from '@/constants/query-keys'
import type {
  CreateSessionRequest,
  InterviewSession,
  SessionListScope,
  SessionVersionRequest,
  SubmitTextAnswerRequest,
  Turn,
} from '@/types/session'

export function useSession(sessionId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.session(sessionId),
    queryFn: () => getSession(sessionId),
    enabled: Number.isInteger(sessionId) && sessionId > 0,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false

      // Auto poll when session preparation or AI scoring is in progress
      const isGenerating =
        data.status === 'CREATED' || data.status === 'SCRIPT_GENERATING'
      const isScoring = data.status === 'SCORING'

      if (isGenerating || isScoring) {
        return 2000
      }
      return false
    },
  })
}

export function useSessions(scope: SessionListScope = 'ACTIVE', page = 0, size = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.sessionList(scope, page, size),
    queryFn: () => listSessions(scope, page, size),
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      idempotencyKey,
      data,
    }: {
      idempotencyKey: string
      data: CreateSessionRequest
    }) => createSession(idempotencyKey, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useStartSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionVersionRequest) => startSession(sessionId, data),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(QUERY_KEYS.session(sessionId), updatedSession)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function usePauseSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionVersionRequest) => pauseSession(sessionId, data),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(QUERY_KEYS.session(sessionId), updatedSession)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useResumeSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionVersionRequest) => resumeSession(sessionId, data),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(QUERY_KEYS.session(sessionId), updatedSession)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useSubmitTextAnswer(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubmitTextAnswerRequest) => submitTextAnswer(sessionId, data),
    onMutate: async (newAnswer: SubmitTextAnswerRequest) => {
      // Hủy refetch để tránh race-condition
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.session(sessionId) })

      // Snapshot dữ liệu trước đó
      const previousSession = queryClient.getQueryData<InterviewSession>(QUERY_KEYS.session(sessionId))

      // Cập nhật tức thì câu trả lời của ứng viên lên UI
      if (previousSession) {
        const optimisticTurn: Turn = {
          id: Date.now(),
          turnIndex: (previousSession.currentTurnIndex ?? 0) + 1,
          role: 'CANDIDATE',
          inputMode: 'TEXT',
          content: newAnswer.content,
          isFollowUp: false,
          followUpDepth: 0,
          createdAt: new Date().toISOString(),
        }

        queryClient.setQueryData<InterviewSession>(QUERY_KEYS.session(sessionId), {
          ...previousSession,
          awaitingAction: 'ENGINE_RESPONSE',
          turns: [...previousSession.turns, optimisticTurn],
        })
      }

      return { previousSession }
    },
    onSuccess: (result) => {
      queryClient.setQueryData<InterviewSession>(QUERY_KEYS.session(sessionId), (prev) => {
        if (!prev) return prev

        const newTurns = prev.turns.filter((t) => t.id < 1000000000000 || t.role !== 'CANDIDATE')
        if (result.candidateTurn) {
          newTurns.push(result.candidateTurn)
        }
        if (result.interviewerTurn) {
          newTurns.push(result.interviewerTurn)
        }

        const latest = result.interviewerTurn || newTurns[newTurns.length - 1]
        return {
          ...prev,
          status: 'IN_PROGRESS',
          awaitingAction: 'CANDIDATE_ANSWER',
          currentTurnIndex: latest?.turnIndex ?? prev.currentTurnIndex,
          turns: newTurns,
          currentPrompt:
            latest && latest.role === 'INTERVIEWER'
              ? {
                  turnId: latest.id,
                  baseQuestionId: latest.id,
                  ordinal: latest.turnIndex + 1,
                  text: latest.content,
                  isFollowUp: false,
                  followUpDepth: 0,
                }
              : prev.currentPrompt,
        }
      })
    },
    onError: (_err, _newAnswer, context) => {
      if (context?.previousSession) {
        queryClient.setQueryData(QUERY_KEYS.session(sessionId), context.previousSession)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(sessionId) })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useRetrySession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data?: SessionVersionRequest) => retrySession(sessionId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(sessionId) })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useSessionReport(sessionId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: QUERY_KEYS.sessionReport(sessionId),
    queryFn: () => getSessionReport(sessionId),
    enabled: Number.isInteger(sessionId) && sessionId > 0 && enabled,
    refetchInterval: (query) => {
      const data = query.state.data
      // Poll every 2s while backend scoring worker is still running
      if (data?.status === 'SCORING') {
        return 2000
      }
      return false
    },
    staleTime: 0,
  })
}

export function useRetryScoring(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => retryScoring(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(sessionId) })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessionReport(sessionId) })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useCompleteSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionVersionRequest) => completeSession(sessionId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(sessionId) })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useAbandonSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionVersionRequest) => abandonSession(sessionId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(sessionId) })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}
