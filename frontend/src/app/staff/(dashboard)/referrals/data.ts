import type { Patient } from "@/types/patient"
import type {
  Referral as ApiReferral,
  ReferralCreateRequest,
  ReferralUpdateRequest,
} from "@/types/referral"
import type { Referral } from "./components/data-table"
import type { ReferralFormValues } from "./components/referral-form-sheet"

export interface SimplePatient {
  id: string
  firstName: string
  lastName: string
  avatar: string
}

export function toSimplePatient(p: Patient): SimplePatient {
  const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase()
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    avatar: initials,
  }
}

const statusLabel: Record<ApiReferral["status"], Referral["status"]> = {
  pending: "Pending",
  sent: "Sent",
  completed: "Completed",
  cancelled: "Cancelled",
}

/** Maps a backend Referral (snake_case, patient_id only) into the
 * view-model the existing table/form components already expect
 * (camelCase, denormalized patient name/avatar).
 */
export function mapReferral(referral: ApiReferral, patients: SimplePatient[]): Referral {
  const patient = patients.find((p) => p.id === referral.patient_id)

  return {
    id: referral.id,
    patientId: referral.patient_id,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient",
    patientAvatar: patient?.avatar ?? "?",
    specialistName: referral.specialist_name,
    specialty: referral.specialty,
    reason: referral.reason,
    date: referral.date,
    status: statusLabel[referral.status],
    notes: referral.notes ?? undefined,
    createdAt: referral.created_at,
  }
}

export function buildCreatePayload(data: ReferralFormValues): ReferralCreateRequest {
  return {
    patient_id: data.patientId,
    specialist_name: data.specialistName,
    specialty: data.specialty,
    reason: data.reason,
    date: data.date.toISOString().split("T")[0],
    notes: data.notes || null,
  }
}

export function buildUpdatePayload(data: ReferralFormValues): ReferralUpdateRequest {
  return {
    specialist_name: data.specialistName,
    specialty: data.specialty,
    reason: data.reason,
    date: data.date.toISOString().split("T")[0],
    notes: data.notes || null,
  }
}
