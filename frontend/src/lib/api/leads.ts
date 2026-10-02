import { apiRequest } from "./client"
import type { Lead, LeadConvertResponse, LeadCreateRequest, LeadUpdateRequest } from "@/types/lead"

export const leadApi = {
  async createLead(payload: LeadCreateRequest): Promise<Lead> {
    return apiRequest<Lead>("/leads", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async listLeads(): Promise<Lead[]> {
    return apiRequest<Lead[]>("/leads")
  },

  async updateLead(id: string, payload: LeadUpdateRequest): Promise<Lead> {
    return apiRequest<Lead>(`/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  // Converting is NOT the same as PATCHing status to "converted" — this
  // creates the actual Patient row too. The backend rejects a plain PATCH
  // that tries to set status to "converted" for exactly this reason.
  async convertLead(id: string): Promise<LeadConvertResponse> {
    return apiRequest<LeadConvertResponse>(`/leads/${id}/convert`, {
      method: "POST",
    })
  },
}