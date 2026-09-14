import type { AwaitingAction, InterviewDifficulty, SessionMode, SessionStatus } from '@/types/session'

export const SESSION_STATUS = {
  CREATED: 'CREATED',
  SCRIPT_GENERATING: 'SCRIPT_GENERATING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  PREPARATION_FAILED: 'PREPARATION_FAILED',
  IN_PROGRESS: 'IN_PROGRESS',
  PAUSED: 'PAUSED',
  SCORING: 'SCORING',
  SCORING_FAILED: 'SCORING_FAILED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  ABANDONED: 'ABANDONED',
  FAILED: 'FAILED',
} as const

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  CREATED: 'Đã tạo',
  SCRIPT_GENERATING: 'Đang thiết lập kế hoạch',
  PREPARING: 'Đang chuẩn bị',
  READY: 'Sẵn sàng',
  PREPARATION_FAILED: 'Chuẩn bị lỗi',
  IN_PROGRESS: 'Đang phỏng vấn',
  PAUSED: 'Tạm dừng',
  SCORING: 'Đang chấm điểm',
  SCORING_FAILED: 'Chấm điểm lỗi',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
  ABANDONED: 'Đã huỷ',
  FAILED: 'Thất bại',
}

/** Trạng thái đang xử lý nền, cần poll. */
export const SESSION_IN_PROGRESS_STATUSES: SessionStatus[] = [
  SESSION_STATUS.CREATED,
  SESSION_STATUS.SCRIPT_GENERATING,
  SESSION_STATUS.PREPARING,
]

export const SESSION_MODE_LABEL: Record<SessionMode, string> & Record<string, string> = {
  TURN_BASED: 'Phỏng vấn theo lượt',
  VOICE_REALTIME: 'Giọng nói thời gian thực',
  TEXT: 'Phỏng vấn theo lượt',
  VOICE_TURN_BASED: 'Phỏng vấn theo lượt',
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
