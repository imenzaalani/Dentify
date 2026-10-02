export type ReferralStatus = "pending" | "sent" | "completed" | "cancelled"

export interface Referral {
  id: string
  patient_id: string
  specialist_name: string
  specialty: string
  reason: string
  date: string
  status: ReferralStatus
  notes?: string | null
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
}

export interface ReferralCreateRequest {
  patient_id: string
  specialist_name: string
  specialty: string
  reason: string
  date: string
  notes?: string | null
}

export interface ReferralUpdateRequest {
  specialist_name?: string
  specialty?: string
  reason?: string
  date?: string
  notes?: string | null
}
