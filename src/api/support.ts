import { api } from '@/api/client'
import type {
  CreateSupportTicketRequest,
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
