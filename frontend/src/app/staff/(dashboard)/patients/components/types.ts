import type {
  Patient as ApiPatient,
  LifecycleStage,
  CreatedVia,
  PreferredContactMethod,
  PortalStatus,
} from "@/types/patient"

export type { LifecycleStage, CreatedVia, PreferredContactMethod, PortalStatus }
export type Patient = ApiPatient
// Kept as an alias so existing call sites (`PatientStatus`) don't all need
// renaming — it's just the API's `LifecycleStage` now, no more "lead".
export type PatientStatus = LifecycleStage

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

export function fullName(patient: Patient) {
  return `${patient.first_name} ${patient.last_name}`
}

// archived_at is the source of truth for archive state (set by the
// archive/unarchive endpoints), not lifecycle_stage — a patient could in
// theory be lifecycle_stage "inactive" without being archived.
export function isArchived(patient: Patient) {
  return !!patient.archived_at
}

export function hasPortalAccount(patient: Patient) {
  return patient.portal_status !== "not_invited"
}

export const lifecycleColors: Record<LifecycleStage, string> = {
  new: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-400",
  active:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400",
  recall:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400",
  inactive: "border-muted bg-muted text-muted-foreground",
  archived:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400",
}

export const lifecycleLabels: Record<LifecycleStage, string> = {
  new: "New",
  active: "Active",
  recall: "Recall",
  inactive: "Inactive",
  archived: "Archived",
}

export const createdViaLabels: Record<CreatedVia, string> = {
  online_form: "Online form",
  phone_call: "Phone call",
  walk_in: "Walk-in",
}

export const preferredContactLabels: Record<PreferredContactMethod, string> = {
  whatsapp: "WhatsApp",
  email: "Email",
  sms: "SMS",
  phone: "Phone",
}