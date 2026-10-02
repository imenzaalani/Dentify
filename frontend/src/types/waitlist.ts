export type WaitlistPriority = "low" | "medium" | "high"
export type WaitlistStatus = "waiting" | "contacted" | "scheduled" | "cancelled"

export interface WaitlistEntry {
  id: string
  patient_id: string
  care_type_id: string
  desired_from: string // ISO date
  desired_to: string // ISO date
  priority: WaitlistPriority
  status: WaitlistStatus
  notes?: string | null
  appointment_id?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface WaitlistEntryCreateRequest {
  patient_id: string
  care_type_id: string
  desired_from: string
  desired_to: string
  priority?: WaitlistPriority
  notes?: string | null
}

export interface WaitlistEntryUpdateRequest {
  care_type_id?: string
  desired_from?: string
  desired_to?: string
  priority?: WaitlistPriority
  notes?: string | null
}

export interface WaitlistListParams {
  status?: WaitlistStatus
}