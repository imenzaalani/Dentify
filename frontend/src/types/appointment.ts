export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "arrived"
  | "completed"
  | "cancelled"
  | "no_show"

export interface Appointment {
  id: string
  patient_id: string
  dentist_id: string
  care_type_id: string
  treatment_step_id?: string | null
  resource_id?: string | null
  series_id?: string | null
  series_occurrence_index?: number | null
  scheduled_at: string
  duration_minutes: number
  send_confirmation?: boolean
  // What happened when we tried to email the confirmation — separate from
  // `status`, which is the patient-facing appointment lifecycle state.
  confirmation_delivery_status: ConfirmationDeliveryStatus
  confirmation_sent_at?: string | null
  status: AppointmentStatus
  prep_notes?: string | null
  internal_notes?: string | null
  cancellation_reason?: string | null
  cancelled_at?: string | null
  cancelled_by?: string | null
  created_by?: string | null
  updated_by?: string | null
  created_at: string
  updated_at: string
}

export type ConfirmationDeliveryStatus = "not_requested" | "sent" | "failed"

export interface AppointmentListParams {
  day?: string // YYYY-MM-DD
  date_from?: string // ISO datetime
  date_to?: string // ISO datetime
  dentist_id?: string
  patient_id?: string
  status?: AppointmentStatus
}

export interface AppointmentCreateRequest {
  patient_id: string
  dentist_id: string
  care_type_id: string
  treatment_step_id?: string | null
  resource_id?: string | null
  scheduled_at: string
  duration_minutes: number
  send_confirmation?: boolean
  prep_notes?: string | null
  internal_notes?: string | null
}

// Reschedule/reassign/rebook — status changes go through the dedicated
// action endpoints below. Backend rejects extra fields.
export interface AppointmentUpdateRequest {
  patient_id?: string
  dentist_id?: string
  care_type_id?: string
  treatment_step_id?: string | null
  resource_id?: string | null
  scheduled_at?: string
  duration_minutes?: number
  send_confirmation?: boolean
  prep_notes?: string | null
  internal_notes?: string | null
}

export interface AppointmentCancelRequest {
  reason?: string | null
}

export type RecurrenceFrequency = "weekly" | "biweekly" | "monthly"

// Exactly one of count/until must be set (mirrors the backend validator).
export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  count?: number | null
  until?: string | null // YYYY-MM-DD
}

export interface RecurringAppointmentCreateRequest {
  patient_id: string
  dentist_id: string
  care_type_id: string
  resource_id?: string | null
  scheduled_at: string
  duration_minutes: number
  send_confirmation?: boolean
  prep_notes?: string | null
  internal_notes?: string | null
  recurrence: RecurrenceRule
}

export interface AppointmentSeries {
  id: string
  patient_id: string
  dentist_id: string
  care_type_id: string
  resource_id?: string | null
  frequency: RecurrenceFrequency
  occurrence_count?: number | null
  until?: string | null
  duration_minutes: number
  send_confirmation: boolean
  prep_notes?: string | null
  internal_notes?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface SkippedOccurrence {
  scheduled_at: string
  reason: string
}

export interface RecurringAppointmentCreateResponse {
  series: AppointmentSeries
  created: Appointment[]
  skipped: SkippedOccurrence[]
}

export interface SeriesCancelRequest {
  reason?: string | null
  only_future?: boolean
}