export class Pcm16Player {
  private readonly context: AudioContext
  private readonly analyser: AnalyserNode
  private readonly analyserData: Uint8Array<ArrayBuffer>
  private readonly active = new Set<AudioBufferSourceNode>()
  private readonly sourceSampleRate: number
  private nextStartAt = 0
  private onVolumeChange?: (volume: number) => void
  private volumeInterval?: number

  constructor(
    sourceSampleRate: number,
    onVolume?: (volume: number) => void,
  ) {
    this.sourceSampleRate = sourceSampleRate
    this.context = new AudioContext()
    this.analyser = this.context.createAnalyser()
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.4
    this.analyser.connect(this.context.destination)
    this.analyserData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount))
    this.onVolumeChange = onVolume
  }

  async resume(): Promise<void> {
    if (this.context.state === 'suspended') {
      await this.context.resume()
    }
  }

  enqueue(base64Pcm: string): void {
    const bytes = base64ToBytes(base64Pcm)
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    const samples = Math.floor(bytes.byteLength / 2)
    const buffer = this.context.createBuffer(1, samples, this.sourceSampleRate)
    const channel = buffer.getChannelData(0)
    
    for (let index = 0; index < samples; index++) {
      channel[index] = view.getInt16(index * 2, true) / 32768
    }

    const source = this.context.createBufferSource()
    source.buffer = buffer
    source.connect(this.analyser)
    const startAt = Math.max(this.context.currentTime, this.nextStartAt)
    this.nextStartAt = startAt + buffer.duration
    this.active.add(source)
    this.startVolumeMonitoring()

    source.onended = () => {
      this.active.delete(source)
      if (this.active.size === 0) {
        this.stopVolumeMonitoring()
        if (this.onVolumeChange) {
          this.onVolumeChange(0)
        }
      }
    }
    source.start(startAt)
  }

  private startVolumeMonitoring(): void {
    if (this.volumeInterval !== undefined) return
    this.volumeInterval = window.setInterval(() => {
      if (this.active.size === 0) {
        this.stopVolumeMonitoring()
        this.onVolumeChange?.(0)
        return
      }
      this.analyser.getByteFrequencyData(this.analyserData)
      let sum = 0
      for (let i = 0; i < this.analyserData.length; i++) {
        sum += this.analyserData[i]
      }
      const avg = sum / (this.analyserData.length * 255)
      this.onVolumeChange?.(Math.min(1, avg * 2.8))
    }, 50)
  }

  private stopVolumeMonitoring(): void {
    if (this.volumeInterval !== undefined) {
      window.clearInterval(this.volumeInterval)
      this.volumeInterval = undefined
    }
  }

  interrupt(): void {
    for (const source of this.active) {
      try {
        source.stop()
      } catch {
        // Source may already have ended
      }
    }
    this.active.clear()
    this.nextStartAt = this.context.currentTime
    this.stopVolumeMonitoring()
    if (this.onVolumeChange) {
      this.onVolumeChange(0)
    }
  }

  whenIdle(timeoutMs = 15000): Promise<void> {
    if (this.active.size === 0) return Promise.resolve()
    return new Promise((resolve) => {
      const startTime = Date.now()
      const check = setInterval(() => {
        if (this.active.size === 0 || Date.now() - startTime > timeoutMs) {
          clearInterval(check)
          resolve()
        }
      }, 100)
    })
  }

  async close(): Promise<void> {
    this.interrupt()
    this.stopVolumeMonitoring()
    if (this.context.state !== 'closed') {
      await this.context.close()
    }
  }
}

export class MicrophonePcm16Capture {
  private context?: AudioContext
  private stream?: MediaStream

  async start(
    workletUrl: string,
    onChunk: (chunk: ArrayBuffer) => void,
    onVolume?: (volume: number) => void,
  ): Promise<void> {
    if (this.context) return
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    this.context = new AudioContext()
    await this.context.audioWorklet.addModule(workletUrl)
    const source = this.context.createMediaStreamSource(this.stream)
    const capture = new AudioWorkletNode(this.context, 'pcm16-capture', {
      processorOptions: { targetSampleRate: 16000, chunkSamples: 320 },
    })
    const silent = this.context.createGain()
    silent.gain.value = 0

    let smoothedRms = 0
    let chunkCounter = 0

    capture.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      const buffer = event.data
      if (onVolume) {
        const view = new Int16Array(buffer)
        let sumSq = 0
        for (let i = 0; i < view.length; i++) {
          const norm = view[i] / 32768
          sumSq += norm * norm
        }
        const currentRms = Math.sqrt(sumSq / view.length)
        smoothedRms = smoothedRms * 0.65 + currentRms * 0.35
        chunkCounter++
        // Throttle volume updates to ~60ms to prevent high-frequency React re-renders
        if (chunkCounter % 3 === 0) {
          onVolume(Math.min(1, smoothedRms * 3.5))
        }
      }
      onChunk(buffer)
    }

    source.connect(capture).connect(silent).connect(this.context.destination)
    await this.context.resume()
  }

  async stop(): Promise<void> {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = undefined
    if (this.context && this.context.state !== 'closed') {
      await this.context.close()
    }
    this.context = undefined
  }
}

export function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}
