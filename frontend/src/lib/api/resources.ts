import { apiRequest } from "./client"
import type { Resource, ResourceCreateRequest, ResourceUpdateRequest } from "@/types/resource"

export const resourceApi = {
  async listResources(includeInactive = false): Promise<Resource[]> {
    const qs = includeInactive ? "?include_inactive=true" : ""
    return apiRequest<Resource[]>(`/resources/${qs}`)
  },

  async createResource(payload: ResourceCreateRequest): Promise<Resource> {
    return apiRequest<Resource>(`/resources/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateResource(id: string, payload: ResourceUpdateRequest): Promise<Resource> {
    return apiRequest<Resource>(`/resources/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async deleteResource(id: string): Promise<void> {
    return apiRequest<void>(`/resources/${id}`, { method: "DELETE" })
  },
}