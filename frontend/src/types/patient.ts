export type LifecycleStage = "new" | "active" | "recall" | "inactive" | "archived"

export type CreatedVia = "online_form" | "phone_call" | "walk_in"

export type PreferredContactMethod = "whatsapp" | "email" | "sms" | "phone"

export type PortalStatus = "not_invited" | "pending" | "active" | "revoked"

export interface Patient {
  id: string
  patient_number: string
  first_name: string
  last_name: string
  dob: string
  phone?: string | null
  email?: string | null
  address?: string | null
  user_id?: string | null
  portal_status: PortalStatus
  avatar_url?: string | null
  primary_contact_user_id?: string | null
  preferred_contact_method?: PreferredContactMethod | null
  lifecycle_stage: LifecycleStage
  created_via: CreatedVia
  no_show_count: number
  allergies?: string[] | null
  medical_history?: string | null
  current_medications?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  archived_at?: string | null
  archived_by?: string | null
  archived_reason?: string | null
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
  // NOTE: the Patient ORM model also has legal_sex and zip_code columns,
  // but app/schemas/patient.py's PatientOut doesn't expose them yet — so
  // they're intentionally left out here too. Add them once the backend
  // schema includes them, or the field will silently be undefined.
}

export interface PatientSelf {
  address?: string | null
  preferred_contact_method?: PreferredContactMethod | null
  allergies?: string[] | null
  medical_history?: string | null
  current_medications?: string | null
}

export interface PatientSelfUpdateRequest {
  address?: string | null
  preferred_contact_method?: PreferredContactMethod | null
  allergies?: string[] | null
  medical_history?: string | null
  current_medications?: string | null
}

export interface PatientArchiveRequest {
  reason?: string | null
}

export interface PatientListParams {
  q?: string
  lifecycle_stage?: LifecycleStage
  include_archived?: boolean
}

export interface PatientCreateRequest {
  first_name: string
  last_name: string
  dob: string
  phone?: string | null
  email?: string | null
  address?: string | null
  preferred_contact_method?: PreferredContactMethod | null
  created_via: CreatedVia
  allergies?: string[] | null
  medical_history?: string | null
  current_medications?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
}

// All optional — send only the fields you're changing (PATCH semantics).
// allergies/medical_history/current_medications are dentist/owner only on
// the backend; a receptionist sending those gets a 403.
export interface PatientUpdateRequest {
  first_name?: string
  last_name?: string
  dob?: string
  phone?: string | null
  email?: string | null
  address?: string | null
  preferred_contact_method?: PreferredContactMethod | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  allergies?: string[] | null
  medical_history?: string | null
  current_medications?: string | null
}