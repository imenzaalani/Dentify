import { apiRequest } from "./client"
import type { ClinicDocument, DocumentUpdateRequest } from "@/types/document"

export interface UploadDocumentRequest {
  patientId: string
  category: string
  notes?: string
  file: File
}

export interface DocumentListParams {
  patient_id?: string
}

export const documentApi = {
  async listDocuments(params?: DocumentListParams): Promise<ClinicDocument[]> {
    const search = new URLSearchParams()
    if (params?.patient_id) search.set("patient_id", params.patient_id)
    const qs = search.toString()
    return apiRequest<ClinicDocument[]>(`/documents/${qs ? `?${qs}` : ""}`)
  },

  async uploadDocument(payload: UploadDocumentRequest): Promise<ClinicDocument> {
    const formData = new FormData()
    formData.append("patient_id", payload.patientId)
    formData.append("category", payload.category)
    if (payload.notes) formData.append("notes", payload.notes)
    formData.append("file", payload.file)

    return apiRequest<ClinicDocument>(`/documents/`, {
      method: "POST",
      body: formData,
    })
  },

  async updateDocument(id: string, payload: DocumentUpdateRequest): Promise<ClinicDocument> {
    return apiRequest<ClinicDocument>(`/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async deleteDocument(id: string): Promise<void> {
    return apiRequest<void>(`/documents/${id}`, {
      method: "DELETE",
    })
  },

  // Returns a same-origin, cookie-authenticated proxy URL — safe to drop
  // straight into an <a>/<img>/<iframe> src, since the browser sends the
  // httpOnly auth cookie on this navigation itself (unlike avatars, these
  // files aren't behind a public static mount).
  getFileUrl(id: string): string {
    return `/api/backend/documents/${id}/file`
  },
}
