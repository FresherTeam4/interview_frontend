type AudioStopListener = () => void

const listeners = new Set<AudioStopListener>()

/**
 * Global audio coordinator to stop audio across recording and playback
 * without polluting the global window object or DOM CustomEvents.
 */
export const audioBus = {
  subscribe(listener: AudioStopListener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  stopAll(): void {
    listeners.forEach((listener) => {
      try {
        listener()
      } catch (err) {
        console.warn('[AudioBus] Error stopping audio:', err)
      }
    })
  },
}

export function stopAllInterviewAudio(): void {
  audioBus.stopAll()
}
