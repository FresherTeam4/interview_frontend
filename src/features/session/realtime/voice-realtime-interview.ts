import { RealtimeBackendClient } from './backend-client'
import { GeminiLiveWebSocketClient } from './gemini-live-websocket'
import { MicrophonePcm16Capture } from './pcm-audio'
import type {
  RealtimeEvent,
  RealtimeEventType,
  RealtimeSessionGrant,
  RealtimeTransportClient,
  RealtimeTransportHandlers,
} from './types'

export type RealtimeConnectionState =
  | 'CONNECTING'
  | 'LIVE'
  | 'RECONNECTING'
  | 'FALLBACK'
  | 'STOPPED'

export interface VoiceRealtimeCallbacks {
  onState(state: RealtimeConnectionState): void
  onPartialUserTranscript(text: string): void
  onTurn(turn: {
    userTranscript?: string
    assistantTranscript?: string
    interrupted: boolean
  }): void
  onError(error: Error): void
  onUserVolume?(volume: number): void
  onAiVolume?(volume: number): void
}

export interface VoiceRealtimeOptions {
  workletUrl?: string
  maxResumeAttempts?: number
  createTransport?: (grant: RealtimeSessionGrant) => RealtimeTransportClient
}

export class VoiceRealtimeInterview {
  private readonly microphone = new MicrophonePcm16Capture()
  private transport?: RealtimeTransportClient
  private sessionId?: number
  private connectionId?: number
  private sequence = 0
  private pendingEvents: RealtimeEvent[] = []
  private flushPromise?: Promise<void>
  private resumptionHandle?: string
  private resumeAttempts = 0
  private reconnecting = false
  private stopped = false
  private isStarting = false
  private sentStartSignal = false
  private latencySamples: number[] = []
  private lastPartial = ''
  private lastPartialAt = 0
  private deadlineTimer?: number
  private readonly backend: RealtimeBackendClient
  private readonly callbacks: VoiceRealtimeCallbacks
  private readonly options: VoiceRealtimeOptions

  constructor(
    backend: RealtimeBackendClient,
    callbacks: VoiceRealtimeCallbacks,
    options: VoiceRealtimeOptions = {},
  ) {
    this.backend = backend
    this.callbacks = callbacks
    this.options = options
  }

  async start(sessionId: number, voiceName?: string): Promise<void> {
    if (this.isStarting) return
    this.isStarting = true
    this.stopped = false
    this.sessionId = sessionId
    this.callbacks.onState('CONNECTING')

    try {
      try {
        const startResult = await this.backend.startInterview(sessionId)
        if (this.stopped) return
        if (startResult?.deadlineAt) {
          this.scheduleDeadline(startResult.deadlineAt)
        }
      } catch (startErr) {
        if (this.stopped) return
        // Bỏ qua nếu phiên phỏng vấn đã được start trước đó (IN_PROGRESS)
        console.warn('[Realtime] startInterview note:', startErr)
      }

      if (this.stopped) return
      const grant = await this.backend.createGrant(sessionId, voiceName)
      if (this.stopped) return
      await this.connect(grant)
    } finally {
      this.isStarting = false
    }
  }

  async stop(fallbackToTurnBased = false): Promise<void> {
    if (this.stopped) return
    this.stopped = true
    if (this.deadlineTimer !== undefined) {
      window.clearTimeout(this.deadlineTimer)
    }
    this.transport?.endAudioStream()
    await this.microphone.stop()
    this.enqueue('SESSION_DISCONNECTED', undefined, 'CLIENT_STOPPED')
    try {
      await this.flush()
    } catch (err) {
      console.warn('[Realtime] Failed to flush final events during stop:', err)
    }
    if (this.sessionId !== undefined && this.connectionId !== undefined) {
      try {
        await this.backend.disconnect(
          this.sessionId,
          this.connectionId,
          this.disconnectPayload('CLIENT_STOPPED', fallbackToTurnBased),
        )
      } catch (err) {
        console.warn('[Realtime] Disconnect failed during stop:', err)
      }
    }
    this.transport?.close()
    this.callbacks.onState(fallbackToTurnBased ? 'FALLBACK' : 'STOPPED')
  }

  async finish(): Promise<void> {
    const sessionId = this.sessionId
    if (sessionId === undefined) return
    try {
      await this.stop(false)
    } catch (err) {
      console.warn('[Realtime] Error stopping session before finish:', err)
    }
    await this.backend.finishInterview(sessionId)
  }

  async whenPlaybackIdle(): Promise<void> {
    await this.transport?.whenPlaybackIdle?.()
  }

  private async connect(grant: RealtimeSessionGrant): Promise<void> {
    this.connectionId = grant.connectionId
    this.sequence = 0
    this.pendingEvents = []
    this.transport ??= (this.options.createTransport ?? ((g) => createDefaultTransport(g, this.callbacks)))(grant)
    await this.transport.connect(grant, this.handlers())
  }

  private handlers(): RealtimeTransportHandlers {
    return {
      onReady: () => void this.onReady(),
      onPartialUserTranscript: (text) => this.onPartial(text),
      onFinalTurn: (turn) => {
        const userText = turn.userTranscript?.trim()
        if (userText) {
          this.enqueue('USER_TRANSCRIPT_FINAL', userText)
        }
        const assistantText = turn.assistantTranscript?.trim()
        if (assistantText) {
          const latency =
            typeof turn.latencyMs === 'number' && !isNaN(turn.latencyMs)
              ? Math.max(0, Math.min(600000, Math.round(turn.latencyMs)))
              : undefined
          this.enqueue('ASSISTANT_TRANSCRIPT_FINAL', assistantText, undefined, latency)
        }
        if (turn.interrupted) {
          this.enqueue('ASSISTANT_INTERRUPTED')
        }
        if (typeof turn.latencyMs === 'number' && !isNaN(turn.latencyMs) && turn.latencyMs >= 0) {
          this.latencySamples.push(turn.latencyMs)
        }
        this.callbacks.onTurn(turn)
        void this.flush().catch((err) => {
          console.warn('[Realtime] Background flush on turn warning:', err)
        })
      },
      onResumptionHandle: (handle) => {
        const trimmed = handle?.trim()
        if (trimmed) {
          this.resumptionHandle = trimmed
          this.enqueue('SESSION_RESUMPTION_UPDATED', undefined, trimmed)
          void this.flush().catch((err) => {
            console.warn('[Realtime] Background flush on resumption warning:', err)
          })
        }
      },
      onReconnectRequested: () => void this.reconnect('PROVIDER_GO_AWAY'),
      onClose: (reason) => void this.reconnect(reason),
      onError: (error) => {
        const msg = error.message?.trim() || 'PROVIDER_ERROR'
        this.enqueue('PROVIDER_ERROR', undefined, msg)
        void this.flush().catch((err) => {
          console.warn('[Realtime] Background flush on error warning:', err)
        })
        this.callbacks.onError(error)
      },
    }
  }

  private async onReady(): Promise<void> {
    this.resumeAttempts = 0
    this.reconnecting = false
    this.enqueue('SESSION_CONNECTED')
    await this.flush()
    if (!this.sentStartSignal) {
      this.transport?.sendText('START_INTERVIEW')
      this.sentStartSignal = true
    }
    const workletUrl = this.options.workletUrl || '/pcm16-capture-worklet.js'
    await this.microphone.start(
      workletUrl,
      (chunk) => {
        this.transport?.sendAudio(chunk)
      },
      (vol) => {
        this.callbacks.onUserVolume?.(vol)
      },
    )
    this.callbacks.onState('LIVE')
  }

  private onPartial(text: string): void {
    this.callbacks.onPartialUserTranscript(text)
    const trimmed = text?.trim()
    if (!trimmed) return
    const now = performance.now()
    if (trimmed === this.lastPartial || now - this.lastPartialAt < 250) return
    this.lastPartial = trimmed
    this.lastPartialAt = now
    this.enqueue('USER_TRANSCRIPT_PARTIAL', trimmed)
  }

  private async reconnect(reason: string): Promise<void> {
    if (this.stopped || this.reconnecting) return
    this.reconnecting = true
    this.callbacks.onState('RECONNECTING')
    await this.microphone.stop()
    try {
      await this.flush()
      const maxAttempts = this.options.maxResumeAttempts ?? 2
      while (this.resumeAttempts < maxAttempts && this.resumptionHandle) {
        this.resumeAttempts++
        await delay(300 * this.resumeAttempts)
        try {
          const grant = await this.backend.resumeGrant(
            this.sessionId!,
            this.connectionId!,
            this.resumptionHandle,
          )
          await this.connect(grant)
          return
        } catch (error) {
          this.callbacks.onError(asError(error))
        }
      }
      await this.fallback(reason)
    } catch (error) {
      this.callbacks.onError(asError(error))
      await this.fallback(reason)
    } finally {
      this.reconnecting = false
    }
  }

  private async fallback(reason: string): Promise<void> {
    this.stopped = true
    if (this.sessionId !== undefined && this.connectionId !== undefined) {
      await this.backend.disconnect(
        this.sessionId,
        this.connectionId,
        this.disconnectPayload(reason.slice(0, 255), true),
      )
    }
    this.transport?.close()
    this.callbacks.onState('FALLBACK')
  }

  private enqueue(
    eventType: RealtimeEventType,
    transcriptText?: string,
    detail?: string,
    latencyMs?: number,
  ): void {
    const safeTranscript = transcriptText?.trim() ? transcriptText.trim().slice(0, 16000) : undefined
    const safeDetail = detail?.trim() ? detail.trim().slice(0, 65535) : undefined
    const safeLatency =
      typeof latencyMs === 'number' && !isNaN(latencyMs)
        ? Math.max(0, Math.min(600000, Math.round(latencyMs)))
        : undefined

    this.pendingEvents.push({
      providerEventId: crypto.randomUUID(),
      sequenceNumber: this.sequence++,
      eventType,
      transcriptText: safeTranscript,
      detail: safeDetail,
      latencyMs: safeLatency,
      occurredAt: new Date().toISOString(),
    })
  }

  private async flush(): Promise<void> {
    if (this.flushPromise) return this.flushPromise
    this.flushPromise = this.flushBatches().finally(() => {
      this.flushPromise = undefined
    })
    return this.flushPromise
  }

  private async flushBatches(): Promise<void> {
    while (this.pendingEvents.length > 0) {
      const batch = this.pendingEvents.slice(0, 100)
      if (this.sessionId !== undefined && this.connectionId !== undefined) {
        try {
          await this.backend.recordEvents(this.sessionId, this.connectionId, batch)
        } catch (err) {
          console.error('[Realtime] Failed to record events batch:', err)
          // Always advance queue so a bad batch doesn't permanently block stop or finish
          this.pendingEvents.splice(0, batch.length)
          throw err
        }
      }
      this.pendingEvents.splice(0, batch.length)
    }
  }

  private disconnectPayload(reason: string, fallbackToTurnBased: boolean) {
    const sorted = [...this.latencySamples].sort((a, b) => a - b)
    return {
      reason,
      fallbackToTurnBased,
      p50LatencyMs: percentile(sorted, 0.5),
      p95LatencyMs: percentile(sorted, 0.95),
    }
  }

  private scheduleDeadline(deadlineAt?: string): void {
    if (!deadlineAt) return
    const delayMs = Math.max(0, Date.parse(deadlineAt) - Date.now())
    this.deadlineTimer = window.setTimeout(() => {
      this.deadlineTimer = undefined
      void this.finish().catch((error) => this.callbacks.onError(asError(error)))
    }, Math.min(delayMs, 2_147_483_647))
  }
}

function createDefaultTransport(
  grant: RealtimeSessionGrant,
  callbacks?: VoiceRealtimeCallbacks,
): RealtimeTransportClient {
  if (grant.provider === 'gemini-live' && grant.transport === 'WEBSOCKET') {
    return new GeminiLiveWebSocketClient((vol) => callbacks?.onAiVolume?.(vol))
  }
  throw new Error(`Chưa hỗ trợ giao thức ${grant.provider}/${grant.transport}`)
}

function percentile(sorted: number[], ratio: number): number | undefined {
  if (sorted.length === 0) return undefined
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)]
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function asError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}
