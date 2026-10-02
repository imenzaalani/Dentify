import { apiRequest } from "./client"
import type {
  TreatmentPlan,
  TreatmentPlanCreateRequest,
  TreatmentPlanStatus,
  TreatmentPlanUpdateRequest,
  TreatmentStepStatus,
} from "@/types/treatment"

export const treatmentApi = {
  async listTreatmentPlans(): Promise<TreatmentPlan[]> {
    return apiRequest<TreatmentPlan[]>("/treatments/")
  },

  // For the patient portal — scoped server-side to the caller's own
  // patient record, same convention as patientApi.getMyRecord().
  async listMyTreatmentPlans(): Promise<TreatmentPlan[]> {
    return apiRequest<TreatmentPlan[]>("/treatments/me")
  },

  async getTreatmentPlan(id: string): Promise<TreatmentPlan> {
    return apiRequest<TreatmentPlan>(`/treatments/${id}`)
  },

  async createTreatmentPlan(payload: TreatmentPlanCreateRequest): Promise<TreatmentPlan> {
    return apiRequest<TreatmentPlan>("/treatments/", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updateTreatmentPlan(id: string, payload: TreatmentPlanUpdateRequest): Promise<TreatmentPlan> {
    return apiRequest<TreatmentPlan>(`/treatments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async updateTreatmentPlanStatus(id: string, statusValue: TreatmentPlanStatus): Promise<TreatmentPlan> {
    return apiRequest<TreatmentPlan>(`/treatments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: statusValue }),
    })
  },

  async updateStepStatus(
    planId: string,
    stepId: string,
    statusValue: TreatmentStepStatus
  ): Promise<TreatmentPlan> {
    return apiRequest<TreatmentPlan>(`/treatments/${planId}/steps/${stepId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: statusValue }),
    })
  },
}
