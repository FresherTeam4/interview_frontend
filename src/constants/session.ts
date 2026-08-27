import type { AwaitingAction, InterviewDifficulty, SessionMode, SessionStatus } from '@/types/session'

export const SESSION_STATUS = {
  CREATED: 'CREATED',
  SCRIPT_GENERATING: 'SCRIPT_GENERATING',
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  SCORING: 'SCORING',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
  FAILED: 'FAILED',
} as const

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  CREATED: 'Đã tạo',
  SCRIPT_GENERATING: 'Đang sinh câu hỏi',
  READY: 'Sẵn sàng',
  IN_PROGRESS: 'Đang phỏng vấn',
  PAUSED: 'Tạm dừng',
  SCORING: 'Đang chấm điểm',
  COMPLETED: 'Hoàn thành',
  ABANDONED: 'Đã huỷ',
  FAILED: 'Thất bại',
}

/** Trạng thái đang xử lý nền, cần poll. */
export const SESSION_IN_PROGRESS_STATUSES: SessionStatus[] = [
  SESSION_STATUS.CREATED,
  SESSION_STATUS.SCRIPT_GENERATING,
]

export const SESSION_MODE_LABEL: Record<SessionMode, string> = {
  TEXT: 'Phỏng vấn văn bản',
  VOICE_TURN_BASED: 'Phỏng vấn giọng nói',
}

export const INTERVIEW_DIFFICULTY_LABEL: Record<InterviewDifficulty, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
}

export const AWAITING_ACTION_LABEL: Record<AwaitingAction, string> = {
  START_SESSION: 'Chờ bắt đầu',
  CANDIDATE_ANSWER: 'Chờ trả lời',
  TRANSCRIPT_CONFIRMATION: 'Xác nhận bản ghi',
  ENGINE_RESPONSE: 'Đang xử lý',
  ENGINE_RETRY: 'Cần thử lại',
  REPORT: 'Đang tạo báo cáo',
  NONE: '',
}
