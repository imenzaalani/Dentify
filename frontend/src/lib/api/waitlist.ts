import { apiRequest } from "./client"
import type {
  WaitlistEntry,
  WaitlistEntryCreateRequest,
  WaitlistEntryUpdateRequest,
  WaitlistListParams,
} from "@/types/waitlist"

export const waitlistApi = {
  async listWaitlist(params?: WaitlistListParams): Promise<WaitlistEntry[]> {
    const qs = params?.status ? `?status=${params.status}` : ""
    return apiRequest<WaitlistEntry[]>(`/waitlist/${qs}`)
  },

  async createWaitlistEntry(payload: WaitlistEntryCreateRequest): Promise<WaitlistEntry> {
    return apiRequest<WaitlistEntry>(`/waitlist/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateWaitlistEntry(id: string, payload: WaitlistEntryUpdateRequest): Promise<WaitlistEntry> {
    return apiRequest<WaitlistEntry>(`/waitlist/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async markContacted(id: string): Promise<WaitlistEntry> {
    return apiRequest<WaitlistEntry>(`/waitlist/${id}/contacted`, { method: "POST" })
  },

  async scheduleEntry(id: string, appointmentId: string): Promise<WaitlistEntry> {
    return apiRequest<WaitlistEntry>(`/waitlist/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ appointment_id: appointmentId }),
    })
  },

  async deleteWaitlistEntry(id: string): Promise<void> {
    return apiRequest<void>(`/waitlist/${id}`, { method: "DELETE" })
  },
}