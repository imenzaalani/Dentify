export type DocumentCategory = "imaging" | "consent_form" | "invoice" | "lab_report"

export interface ClinicDocument {
  id: string
  patient_id: string
  patient_name: string
  patient_avatar: string
  file_name: string
  category: DocumentCategory
  file_type: string
  file_size_kb: number
  notes?: string | null
  uploaded_by_name: string
  created_at: string
  updated_at: string
}

export interface DocumentUpdateRequest {
  category?: DocumentCategory
  notes?: string | null
}

export const documentCategoryLabels: Record<DocumentCategory, string> = {
  imaging: "Imaging",
  consent_form: "Consent Form",
  invoice: "Invoice",
  lab_report: "Lab Report",
}

export const documentCategoryOptions: DocumentCategory[] = [
  "imaging",
  "consent_form",
  "invoice",
  "lab_report",
]
