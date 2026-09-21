import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  abandonSession,
  cancelInterviewSession,
  checkInterviewReadiness,
  completeSession,
  createSession,
  getInterviewProgress,
  getInterviewSessionsHistory,
  getSession,
  getSessionReport,
  listSessions,
  pauseSession,
  resumeSession,
  retryFailedTurn,
  retryScoring,
  retrySession,
  startSession,
  submitTextAnswer,
  type InterviewSessionHistoryParams,
} from '@/api/session'
import { QUERY_KEYS } from '@/constants/query-keys'
import { useAuth } from '@/hooks/use-auth'
import { tokenStorage } from '@/api/token-storage'
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
  const { user } = useAuth()
  const userId = user?.id ?? tokenStorage.getUserId()

  return useQuery({
    queryKey: QUERY_KEYS.sessionList(userId, scope, page, size),
    queryFn: () => listSessions(scope, page, size, userId),
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data?.items?.length) return false
      const hasPending = data.items.some(
        (s) =>
          s.status === 'SCRIPT_GENERATING' ||
          s.status === 'CREATED' ||
          s.status === 'SCORING',
      )
      return hasPending ? 3000 : false
    },
  })
}

export function useInterviewHistory(params?: InterviewSessionHistoryParams) {
  return useQuery({
    queryKey: QUERY_KEYS.sessionHistory(params),
    queryFn: () => getInterviewSessionsHistory(params),
    staleTime: 10_000,
  })
}

export function useInterviewProgress(days = 30) {
  return useQuery({
    queryKey: QUERY_KEYS.sessionProgress(days),
    queryFn: () => getInterviewProgress(days),
    staleTime: 30_000,
  })
}

export function useCheckReadiness() {
  return useMutation({
    mutationFn: (data: CreateSessionRequest) => checkInterviewReadiness(data),
  })
}

export function useCancelSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cancelInterviewSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(sessionId) })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useRetryTurn(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (turnId: number) => retryFailedTurn(sessionId, turnId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(sessionId) })
    },
  })
}

export function useCreateSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ idempotencyKey, data }: { idempotencyKey: string; data: CreateSessionRequest }) =>
      createSession(idempotencyKey, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useStartSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionVersionRequest) => startSession(sessionId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.session(sessionId), updated)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function usePauseSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionVersionRequest) => pauseSession(sessionId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.session(sessionId), updated)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useResumeSession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SessionVersionRequest) => resumeSession(sessionId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.session(sessionId), updated)
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useSubmitTextAnswer(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SubmitTextAnswerRequest) => submitTextAnswer(sessionId, data),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.session(sessionId) })
      const previous = queryClient.getQueryData<InterviewSession>(QUERY_KEYS.session(sessionId))
      if (!previous) return { previous }

      const tempCandidateTurn: Turn = {
        id: -Date.now(),
        turnIndex: (previous.currentTurnIndex ?? 0) + 1,
        role: 'CANDIDATE',
        inputMode: variables.inputMode || 'TEXT',
        content: variables.content,
        isFollowUp: false,
        followUpDepth: 0,
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<InterviewSession>(QUERY_KEYS.session(sessionId), {
        ...previous,
        currentTurnIndex: tempCandidateTurn.turnIndex,
        awaitingAction: 'ENGINE_RESPONSE',
        turns: [...previous.turns, tempCandidateTurn],
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.session(sessionId), context.previous)
      }
    },
    onSuccess: (accepted) => {
      const current = queryClient.getQueryData<InterviewSession>(QUERY_KEYS.session(sessionId))
      if (!current) return

      const cleanedTurns = current.turns.filter((t) => t.id > 0)
      const turns = [...cleanedTurns]
      if (accepted.candidateTurn) turns.push(accepted.candidateTurn)
      if (accepted.interviewerTurn) turns.push(accepted.interviewerTurn)

      queryClient.setQueryData<InterviewSession>(QUERY_KEYS.session(sessionId), {
        ...current,
        version: accepted.version,
        awaitingAction: accepted.awaitingAction,
        turns,
      })
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
      // Poll every 2.5s while backend scoring worker is still running
      if (data?.status === 'SCORING') {
        return 2500
      }
      return false
    },
    staleTime: 5000,
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
