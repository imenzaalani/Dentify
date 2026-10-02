export type TreatmentPlanStatus = "planned" | "in_progress" | "completed" | "abandoned"

export type TreatmentStepStatus = "pending" | "completed"

export interface TreatmentStep {
  id: string
  label: string
  tooth?: string | null
  est_duration_minutes?: number | null
  status: TreatmentStepStatus
  position: number
  depends_on_step_id?: string | null
  requires_consent: boolean
  consent_signed_at?: string | null
  created_at: string
  updated_at: string
}

export interface TreatmentPlan {
  id: string
  patient_id: string
  title: string
  diagnosis?: string | null
  start_date: string
  end_date?: string | null
  status: TreatmentPlanStatus
  notes?: string | null
  steps: TreatmentStep[]
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
}

export interface TreatmentStepCreateRequest {
  label: string
  tooth?: string | null
  est_duration_minutes?: number | null
  requires_consent?: boolean
  depends_on_index?: number | null
}

export interface TreatmentPlanCreateRequest {
  patient_id: string
  title: string
  diagnosis?: string | null
  start_date: string
  end_date?: string | null
  notes?: string | null
  steps: TreatmentStepCreateRequest[]
}

export interface TreatmentPlanUpdateRequest {
  title?: string
  diagnosis?: string | null
  start_date?: string
  end_date?: string | null
  notes?: string | null
  steps?: TreatmentStepCreateRequest[]
}
