import type { LeadStatus as ApiLeadStatus, HearAboutUs } from "@/types/lead"
export type { HearAboutUs }

export type LeadStatus = ApiLeadStatus // "pending" | "converted" | "rejected" | "no_response"

export interface Lead {
  id: string
  patient_first_name: string
  patient_last_name: string
  patient_legal_sex?: string | null
  patient_dob?: string | null
  patient_zip?: string | null
  booking_for: "myself" | "dependent" | "someone_else"
  contact_email: string
  contact_phone: string
  sms_consent: boolean
  requested_service: string
  requested_datetime: string
  comments?: string | null
  hear_about_us?: HearAboutUs | null
  source: string // free text on the backend, not a closed union
  status: LeadStatus
  notes?: string | null
  converted_to_patient_id?: string | null
  created_at: string
  updated_at: string
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

export const statusColors: Record<LeadStatus, string> = {
  pending:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-400",
  no_response: "border-muted bg-muted text-muted-foreground",
  converted:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400",
  rejected:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400",
}

export const statusLabels: Record<LeadStatus, string> = {
  pending: "Pending",
  no_response: "No response",
  converted: "Converted",
  rejected: "Rejected",
}

export const hearAboutUsLabels: Record<HearAboutUs, string> = {
  google: "Google",
  instagram_facebook: "Instagram / Facebook",
  yelp: "Yelp",
  family_friend: "Family / friend",
  walk_by: "Walk by",
  other: "Other",
}