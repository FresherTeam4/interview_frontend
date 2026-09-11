import { api } from '@/api/client'
import type {
  DisconnectRealtimeResult,
  RealtimeEvent,
  RealtimeSessionGrant,
} from './types'

export interface InterviewStartResult {
  deadlineAt?: string
  remainingSeconds?: number
}

export class RealtimeBackendClient {
  async startInterview(sessionId: number): Promise<InterviewStartResult> {
    const res = await api.post<InterviewStartResult>(`/interview-sessions/${sessionId}/start`)
    return res.data
  }

  async finishInterview(sessionId: number): Promise<void> {
    await api.post(`/interview-sessions/${sessionId}/finish`)
  }

  async createGrant(sessionId: number, voiceName?: string): Promise<RealtimeSessionGrant> {
    const res = await api.post<RealtimeSessionGrant>(
      `/interview-sessions/${sessionId}/realtime/session-grants`,
      { voiceName, clientPlatform: 'web' },
    )
    return res.data
  }

  async resumeGrant(
    sessionId: number,
    connectionId: number,
    resumptionHandle: string,
  ): Promise<RealtimeSessionGrant> {
    const res = await api.post<RealtimeSessionGrant>(
      `/interview-sessions/${sessionId}/realtime/connections/${connectionId}/resume-grants`,
      { resumptionHandle, clientPlatform: 'web' },
    )
    return res.data
  }

  async recordEvents(
    sessionId: number,
    connectionId: number,
    events: RealtimeEvent[],
  ): Promise<unknown> {
    const res = await api.post(
      `/interview-sessions/${sessionId}/realtime/connections/${connectionId}/events`,
      { events },
    )
    return res.data
  }

  async disconnect(
    sessionId: number,
    connectionId: number,
    body: {
      reason: string
      fallbackToTurnBased: boolean
      p50LatencyMs?: number
      p95LatencyMs?: number
    },
  ): Promise<DisconnectRealtimeResult> {
    const res = await api.post<DisconnectRealtimeResult>(
      `/interview-sessions/${sessionId}/realtime/connections/${connectionId}/disconnect`,
      body,
    )
    return res.data
  }
}
