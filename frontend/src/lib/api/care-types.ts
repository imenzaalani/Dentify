import { apiRequest } from "./client"
import type { CareType, CareTypeCreateRequest, CareTypeUpdateRequest } from "@/types/care-type"

export const careTypeApi = {
  async listCareTypes(includeInactive = false): Promise<CareType[]> {
    const qs = includeInactive ? "?include_inactive=true" : ""
    return apiRequest<CareType[]>(`/care-types/${qs}`)
  },

  async createCareType(payload: CareTypeCreateRequest): Promise<CareType> {
    return apiRequest<CareType>(`/care-types/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateCareType(id: string, payload: CareTypeUpdateRequest): Promise<CareType> {
    return apiRequest<CareType>(`/care-types/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async deleteCareType(id: string): Promise<void> {
    return apiRequest<void>(`/care-types/${id}`, { method: "DELETE" })
  },
}