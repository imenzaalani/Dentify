export type ToothCondition =
  | "healthy" | "caries" | "surgery" | "implantation"
  | "gingivitis" | "periodontitis" | "removal" | "periostitis"

export const conditionColors: Record<ToothCondition, string> = {
  healthy: "#e2e8f0", caries: "#22c55e", surgery: "#ec4899",
  implantation: "#a855f7", gingivitis: "#ef4444", periodontitis: "#06b6d4",
  removal: "#94a3b8", periostitis: "#78350f",
}

export const conditionLabels: Record<ToothCondition, string> = {
  healthy: "Healthy", caries: "Caries", surgery: "Surgery",
  implantation: "Implantation", gingivitis: "Gingivitis",
  periodontitis: "Periodontitis", removal: "Removal", periostitis: "Periostitis",
}

export interface ToothRecord {
  id: string
  toothNumber: string // FDI, e.g. "25"
  condition: ToothCondition
  doctor?: string | null
  lastManipulationDate?: string | null
  notes?: string | null
  surgicalKit?: string | null
  implantManufacturer?: string | null
  implantModel?: string | null
  implantSizesNeeded?: string | null
}

export interface DentalChart {
  patientId: string
  teeth: ToothRecord[]
}

export const FDI_UPPER_RIGHT = ["18", "17", "16", "15", "14", "13", "12", "11"]
export const FDI_UPPER_LEFT = ["21", "22", "23", "24", "25", "26", "27", "28"]
export const FDI_LOWER_LEFT = ["31", "32", "33", "34", "35", "36", "37", "38"]
export const FDI_LOWER_RIGHT = ["48", "47", "46", "45", "44", "43", "42", "41"]

export function archLabel(toothNumber: string): "Maxilla" | "Mandible" {
  const q = toothNumber[0]
  return q === "1" || q === "2" ? "Maxilla" : "Mandible"
}
export function positionInArch(toothNumber: string): number {
  return Number(toothNumber[1])
}

// --- Medical checkup (planning module) -------------------------------
// Additive to the tooth-condition types above, not a replacement: the
// checkup wizard's tooth-select step reuses ToothCondition/ToothRecord/
// OdontogramSvg as-is. This section only adds the checkup-specific shape —
// vitals, history, oral exam findings — that wraps around a set of tooth
// updates. No backend endpoint exists yet (see lib/api/checkups.ts), same
// situation as ToothRecord itself before dental/odontogram routes land.

export type CheckupStatus = "in_progress" | "completed"

export type OcclusionType = "normal" | "cross" | "steep"
export const occlusionLabels: Record<OcclusionType, string> = {
  normal: "Normale", cross: "Croisée", steep: "Profonde",
}

export type TorusPalatinusType = "no" | "small" | "medium" | "large" | "multiple"
export const torusPalatinusLabels: Record<TorusPalatinusType, string> = {
  no: "Absent", small: "Petit", medium: "Moyen", large: "Volumineux", multiple: "Multiple",
}

export type TorusMandibularisType = "no" | "left" | "right" | "both"
export const torusMandibularisLabels: Record<TorusMandibularisType, string> = {
  no: "Absent", left: "Gauche", right: "Droit", both: "Bilatéral",
}

export type PalatumType = "no" | "left" | "right" | "both"
export const palatumLabels: Record<PalatumType, string> = {
  no: "Aucune", left: "Gauche", right: "Droit", both: "Bilatérale",
}

// Checklist offered on the checkup wizard's first step — free text still
// available via `conditions_other` for anything not on the list.
export const COMMON_MEDICAL_CONDITIONS = [
  "Diabète", "Hypertension", "Maladie cardiaque", "Hépatite",
  "Trouble de la coagulation", "Grossesse", "Épilepsie", "Asthme",
] as const

// Tooth conditions worth a follow-up TreatmentStep — "healthy" plainly
// isn't, so it's everything else in ToothCondition.
export const CONDITIONS_REQUIRING_TREATMENT_STEP: ToothCondition[] = [
  "caries", "surgery", "implantation", "gingivitis", "periodontitis", "removal", "periostitis",
]

export interface MedicalCheckup {
  id: string
  patient_id: string
  appointment_id: string
  blood_pressure_systolic?: number | null
  blood_pressure_diastolic?: number | null
  conditions: string[]
  conditions_other?: string | null
  allergies?: string | null
  occlusion: OcclusionType
  torus_palatinus: TorusPalatinusType
  torus_mandibularis: TorusMandibularisType
  palatum: PalatumType
  diastema?: string | null
  status: CheckupStatus
  created_by?: string | null
  created_at: string
  updated_at: string
}

// Payload the wizard sends on save. `tooth_updates` carries only the teeth
// actually touched in the wizard (not the full chart) — the backend upserts
// each into the patient's ToothRecord set and, for anything in
// CONDITIONS_REQUIRING_TREATMENT_STEP, appends a TreatmentStep to their
// active (or a new) TreatmentPlan.
export interface MedicalCheckupSubmitRequest {
  patient_id: string
  blood_pressure_systolic?: number | null
  blood_pressure_diastolic?: number | null
  conditions: string[]
  conditions_other?: string | null
  allergies?: string | null
  tooth_updates: { tooth_number: string; condition: ToothCondition }[]
  occlusion: OcclusionType
  torus_palatinus: TorusPalatinusType
  torus_mandibularis: TorusMandibularisType
  palatum: PalatumType
  diastema?: string | null
  status: CheckupStatus
}