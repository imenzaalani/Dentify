import type { Patient } from "./patient"

export type LeadStatus = "pending" | "converted" | "rejected" | "no_response"

export type HearAboutUs =
  | "google"
  | "instagram_facebook"
  | "yelp"
  | "family_friend"
  | "walk_by"
  | "other"

export interface Lead {
  id: string
  requested_service: string
  requested_datetime: string
  booking_for: "myself" | "dependent" | "someone_else"
  patient_first_name: string
  patient_last_name: string
  patient_legal_sex?: string | null
  patient_dob: string
  patient_zip?: string | null
  contact_email: string
  contact_phone: string
  sms_consent: boolean
  comments?: string | null
  hear_about_us?: HearAboutUs | null
  source: string
  status: LeadStatus
  notes?: string | null
  converted_to_patient_id?: string | null
  created_at: string
  updated_at: string
}

export interface LeadCreateRequest {
  requested_service: string
  requested_datetime: string
  booking_for: "myself" | "dependent" | "someone_else"
  patient_first_name: string
  patient_last_name: string
  patient_legal_sex?: string | null
  patient_dob: string
  patient_zip?: string | null
  contact_email: string
  contact_phone: string
  sms_consent: boolean
  comments?: string | null
  hear_about_us?: HearAboutUs | null
}

export interface LeadUpdateRequest {
  status?: LeadStatus
  notes?: string
}

// Returned by POST /leads/{id}/convert — the lead (now status="converted")
// plus the Patient row that was created from it.
export interface LeadConvertResponse {
  lead: Lead
  patient: Patient
}