export interface InterviewFeedbackResponse {
  id: number
  sessionId: number
  questionRating: number | null
  voiceRating: number | null
  reportRating: number | null
  comment: string | null
  createdAt: string
  updatedAt: string
}

export interface UpsertInterviewFeedbackRequest {
  questionRating?: number | null
  voiceRating?: number | null
  reportRating?: number | null
  comment?: string | null
}
