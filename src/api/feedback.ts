import { api } from '@/api/client'
import type {
  InterviewFeedbackResponse,
  UpsertInterviewFeedbackRequest,
} from '@/types/feedback'

export async function getSessionFeedback(sessionId: number): Promise<InterviewFeedbackResponse | null> {
  try {
    const res = await api.get<InterviewFeedbackResponse>(`/interview-sessions/${sessionId}/feedback`)
    return res.data
  } catch (err: unknown) {
    if (typeof err === 'object' && err !== null && 'status' in err && (err as { status: number }).status === 404) {
      return null
    }
    throw err
  }
}

export async function upsertSessionFeedback(
  sessionId: number,
  data: UpsertInterviewFeedbackRequest,
): Promise<InterviewFeedbackResponse> {
  const res = await api.put<InterviewFeedbackResponse>(
    `/interview-sessions/${sessionId}/feedback`,
    data,
  )
  return res.data
}
