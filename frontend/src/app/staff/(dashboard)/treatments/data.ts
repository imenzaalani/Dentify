import type { Patient } from "@/types/patient"
import type {
  TreatmentPlan as ApiTreatmentPlan,
  TreatmentPlanCreateRequest,
  TreatmentPlanUpdateRequest,
} from "@/types/treatment"
import type { TreatmentPlan, TreatmentStep } from "./components/data-table"
import type { TreatmentFormValues } from "./components/treatment-form-sheet"

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

const statusLabel: Record<ApiTreatmentPlan["status"], TreatmentPlan["status"]> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  abandoned: "Abandoned",
}

/** Maps a backend TreatmentPlan (snake_case, patient_id only) into the
 * view-model the existing table/detail/form components already expect
 * (camelCase, denormalized patient name/avatar).
 */
export function mapTreatmentPlan(plan: ApiTreatmentPlan, patients: SimplePatient[]): TreatmentPlan {
  const patient = patients.find((p) => p.id === plan.patient_id)
  const steps: TreatmentStep[] = [...plan.steps]
    .sort((a, b) => a.position - b.position)
    .map((s) => ({
      id: s.id,
      label: s.label,
      tooth: s.tooth ?? undefined,
      estDuration: s.est_duration_minutes ?? undefined,
      status: s.status,
      dependsOnStepId: s.depends_on_step_id ?? undefined,
      requiresConsent: s.requires_consent,
      consentSignedAt: s.consent_signed_at ?? undefined,
    }))

  return {
    id: plan.id,
    patientId: plan.patient_id,
    patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown patient",
    patientAvatar: patient?.avatar ?? "?",
    title: plan.title,
    diagnosis: plan.diagnosis ?? undefined,
    startDate: plan.start_date,
    endDate: plan.end_date ?? null,
    status: statusLabel[plan.status],
    notes: plan.notes ?? undefined,
    steps,
    createdAt: plan.created_at,
  }
}

export function buildCreatePayload(data: TreatmentFormValues): TreatmentPlanCreateRequest {
  return {
    patient_id: data.patientId,
    title: data.title,
    diagnosis: data.diagnosis || null,
    start_date: data.startDate.toISOString().split("T")[0],
    end_date: data.endDate ? data.endDate.toISOString().split("T")[0] : null,
    notes: data.notes || null,
    steps: data.steps.map((s) => ({
      label: s.label,
      tooth: s.tooth || null,
      est_duration_minutes: s.estDuration ?? null,
    })),
  }
}

export function buildUpdatePayload(data: TreatmentFormValues): TreatmentPlanUpdateRequest {
  return {
    title: data.title,
    diagnosis: data.diagnosis || null,
    start_date: data.startDate.toISOString().split("T")[0],
    end_date: data.endDate ? data.endDate.toISOString().split("T")[0] : null,
    notes: data.notes || null,
    steps: data.steps.map((s) => ({
      label: s.label,
      tooth: s.tooth || null,
      est_duration_minutes: s.estDuration ?? null,
    })),
  }
}
