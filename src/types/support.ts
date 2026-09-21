export type SupportTicketType =
  | 'GENERAL'
  | 'TECHNICAL'
  | 'INTERVIEW'
  | 'VOICE'
  | 'REPORT'
  | 'ACCOUNT'

export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface CreateSupportTicketRequest {
  type: SupportTicketType
  subject: string
  description: string
  sessionId?: number | null
  turnId?: number | null
}

export interface SupportTicketResponse {
  id: number
  referenceCode: string
  type: SupportTicketType
  status: SupportTicketStatus
  subject: string
  description: string
  sessionId: number | null
  turnId: number | null
  contextJson: string | null
  createdAt: string
  updatedAt: string
}

export interface SupportTicketPageResponse {
  content: SupportTicketResponse[]
  page: number
  size: number
  totalElements: number
}

export interface SupportTicketMessageResponse {
  id: number
  senderId: number
  senderName: string
  senderRole: string
  visibility: 'PUBLIC' | 'INTERNAL'
  message: string
  createdAt: string
}

export interface CreateSupportMessageRequest {
  message: string
}
