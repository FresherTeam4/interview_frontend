import { api } from '@/api/client'

export interface SpeechTranscriptionResponse {
  text: string
  languageCode: string
}

/**
 * Transcribes candidate audio into text via backend Speech API.
 * Endpoint: POST /api/interview-sessions/{sessionId}/speech/transcriptions
 */
export async function transcribeAudio(
  sessionId: number,
  audioBlob: Blob,
): Promise<SpeechTranscriptionResponse> {
  const formData = new FormData()
  // Determine suitable filename based on MIME type
  const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm'
  formData.append('audio', audioBlob, `candidate-answer.${extension}`)

  const res = await api.post<SpeechTranscriptionResponse>(
    `/interview-sessions/${sessionId}/speech/transcriptions`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60_000,
    },
  )
  return res.data
}

/**
 * Generates or retrieves cached MP3 audio of an interviewer turn via backend TTS.
 * Endpoint: POST /api/interview-sessions/{sessionId}/speech/turns/{turnId}/audio
 */
export async function getInterviewerTurnAudio(
  sessionId: number,
  turnId: number,
): Promise<Blob> {
  const res = await api.post<Blob>(
    `/interview-sessions/${sessionId}/speech/turns/${turnId}/audio`,
    {},
    {
      responseType: 'blob',
      headers: {
        Accept: 'audio/mpeg',
      },
      timeout: 60_000,
    },
  )
  return res.data
}
