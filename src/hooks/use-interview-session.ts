import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSession,
  getSession,
  getSessionRubric,
  listSessions,
  pauseSession,
  resumeSession,
  retrySession,
  startSession,
  submitTextAnswer,
} from '@/api/session'
import { QUERY_KEYS } from '@/constants/query-keys'
import type {
  CreateSessionRequest,
  RetrySessionRequest,
  SessionListScope,
  SessionVersionRequest,
  SubmitTextAnswerRequest,
} from '@/types/session'

export function useSession(sessionId: number) {
  return useQuery({
    queryKey: QUERY_KEYS.session(sessionId),
    queryFn: () => getSession(sessionId),
    enabled: Number.isInteger(sessionId) && sessionId > 0,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false

      // Auto poll when script is generating, AI is evaluating turn, or scoring
      const isGenerating =
        data.status === 'CREATED' || data.status === 'SCRIPT_GENERATING'
      const isEvaluatingTurn =
        data.status === 'IN_PROGRESS' && data.awaitingAction === 'ENGINE_RESPONSE'
      const isScoring = data.status === 'SCORING'

      if (isGenerating || isEvaluatingTurn || isScoring) {
        return 1500
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

export function useSessionRubric(sessionId: number) {
  return useQuery({
    queryKey: ['session-rubric', sessionId],
    queryFn: () => getSessionRubric(sessionId),
    enabled: Number.isInteger(sessionId) && sessionId > 0,
    staleTime: Infinity,
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(sessionId) })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}

export function useRetrySession(sessionId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: RetrySessionRequest) => retrySession(sessionId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(sessionId) })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions })
    },
  })
}
