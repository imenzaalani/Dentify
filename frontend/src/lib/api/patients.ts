import { apiRequest } from "./client"
import type {
  Patient,
  PatientArchiveRequest,
  PatientCreateRequest,
  PatientListParams,
  PatientSelf,
  PatientSelfUpdateRequest,
  PatientUpdateRequest,
} from "@/types/patient"

export const patientApi = {
  async getMyRecord(): Promise<PatientSelf> {
    return apiRequest<PatientSelf>(`/patients/me`)
  },

  async updateMyRecord(payload: PatientSelfUpdateRequest): Promise<PatientSelf> {
    return apiRequest<PatientSelf>(`/patients/me`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async listPatients(params?: PatientListParams): Promise<Patient[]> {
    const search = new URLSearchParams()
    if (params?.q) search.set("q", params.q)
    if (params?.lifecycle_stage) search.set("lifecycle_stage", params.lifecycle_stage)
    if (params?.include_archived) search.set("include_archived", "true")
    const qs = search.toString()
    return apiRequest<Patient[]>(`/patients/${qs ? `?${qs}` : ""}`)
  },

  async getPatient(id: string): Promise<Patient> {
    return apiRequest<Patient>(`/patients/${id}`)
  },

  async createPatient(payload: PatientCreateRequest): Promise<Patient> {
    return apiRequest<Patient>(`/patients/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async updatePatient(id: string, payload: PatientUpdateRequest): Promise<Patient> {
    return apiRequest<Patient>(`/patients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async archivePatient(id: string, payload: PatientArchiveRequest = {}): Promise<Patient> {
    return apiRequest<Patient>(`/patients/${id}/archive`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async unarchivePatient(id: string): Promise<Patient> {
    return apiRequest<Patient>(`/patients/${id}/unarchive`, {
      method: "POST",
    })
  },

  async invitePatient(id: string): Promise<Patient> {
    return apiRequest<Patient>(`/patients/${id}/invite`, {
      method: "POST",
    })
  },

  async resendPatientInvite(id: string): Promise<Patient> {
    return apiRequest<Patient>(`/patients/${id}/resend-invite`, {
      method: "POST",
    })
  },

  async revokePortalAccess(id: string): Promise<Patient> {
    return apiRequest<Patient>(`/patients/${id}/revoke-portal-access`, {
      method: "POST",
    })
  },

  async restorePortalAccess(id: string): Promise<Patient> {
    return apiRequest<Patient>(`/patients/${id}/restore-portal-access`, {
      method: "POST",
    })
  },
}