import { api } from '@/api/client'
import type {
  CreateSupportTicketRequest,
  CreateSupportMessageRequest,
  SupportTicketMessageResponse,
  SupportTicketPageResponse,
  SupportTicketResponse,
} from '@/types/support'

export async function createSupportTicket(
  data: CreateSupportTicketRequest,
): Promise<SupportTicketResponse> {
  const res = await api.post<SupportTicketResponse>('/support-tickets', data)
  return res.data
}

export async function getSupportTickets(
  page = 0,
  size = 20,
): Promise<SupportTicketPageResponse> {
  const res = await api.get<SupportTicketPageResponse>('/support-tickets', {
    params: { page, size },
  })
  return res.data
}

export async function getSupportTicket(id: number): Promise<SupportTicketResponse> {
  const res = await api.get<SupportTicketResponse>(`/support-tickets/${id}`)
  return res.data
}

export async function getSupportTicketMessages(id: number): Promise<SupportTicketMessageResponse[]> {
  const res = await api.get<SupportTicketMessageResponse[]>(`/support-tickets/${id}/messages`)
  return res.data
}

export async function addSupportTicketMessage(
  id: number,
  data: CreateSupportMessageRequest,
): Promise<SupportTicketMessageResponse> {
  const res = await api.post<SupportTicketMessageResponse>(`/support-tickets/${id}/messages`, data)
  return res.data
}
