import {
  type Appointment,
  type Practitioner,
  type Patient,
  type CareType,
  type Resource,
  type WaitlistEntry,
  categoryColors,
} from "./types"

import type { Appointment as ApiAppointment } from "@/types/appointment"
import type { Patient as ApiPatient } from "@/types/patient"
import type { StaffMember } from "@/types/auth"
import type { CareType as ApiCareType } from "@/types/care-type"
import type { Resource as ApiResource } from "@/types/resource"
import type {
  WaitlistEntry as ApiWaitlistEntry,
  WaitlistEntryCreateRequest,
} from "@/types/waitlist"

// This file is the mapping boundary: API-shaped (snake_case, UUID) data in,
// UI-shaped (camelCase, denormalized/joined) data out. Components downstream
// of this file only ever see the UI types from ./types.

// Practitioner colors come straight from the "Schedule color" picker on the
// doctor profile (app/staff/(dashboard)/doctors) — a real hex value like
// "#2563eb", not a Tailwind class. Care-type/status colors, by contrast, are
// hardcoded Tailwind bg-* classes in ./types. Dropping a hex string into
// `className` is a silent no-op (invalid class, ignored), so every place
// that renders a practitioner's color has to branch on which kind it is.
export function isHexColor(color: string): boolean {
  return color.startsWith("#") || color.startsWith("rgb")
}

export function practitionerSwatch(color: string): { className?: string; style?: { backgroundColor: string } } {
  return isHexColor(color) ? { style: { backgroundColor: color } } : { className: color }
}

function initials(first?: string | null, last?: string | null): string {
  const a = (first ?? "").trim().charAt(0)
  const b = (last ?? "").trim().charAt(0)
  return `${a}${b}`.toUpperCase() || "?"
}

export function mapPatient(p: ApiPatient): Patient {
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    initials: initials(p.first_name, p.last_name),
    phone: p.phone ?? "",
    email: p.email ?? undefined,
  }
}

export function mapDentist(s: StaffMember): Practitioner {
  return {
    id: s.id,
    firstName: s.first_name ?? "",
    lastName: s.last_name ?? "",
    initials: initials(s.first_name, s.last_name),
    specialty: s.dentist_profile?.specialty ?? "",
    color: s.dentist_profile?.color ?? "bg-gray-400",
    visible: true,
    workingHours: s.dentist_profile?.working_hours ?? undefined,
  }
}

export function mapCareType(c: ApiCareType): CareType {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    defaultDuration: minutesToDuration(c.default_duration_minutes),
    color: c.color,
    active: c.active,
    price: c.price,
    reimbursableAmount: c.reimbursable_amount ?? undefined,
  }
}

export function mapResource(r: ApiResource): Resource {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    active: r.active,
  }
}

export function findResource(resources: Resource[], id?: string): Resource | undefined {
  if (!id) return undefined
  return resources.find((r) => r.id === id)
}

// --- duration <-> minutes -------------------------------------------------
// Keep in sync with durationOptions in components/appointment-form.tsx.
const DURATION_TO_MINUTES: Record<string, number> = {
  "15 min": 15,
  "30 min": 30,
  "45 min": 45,
  "1 hour": 60,
  "1.5 hours": 90,
  "2 hours": 120,
}

export function durationToMinutes(duration: string): number {
  if (duration in DURATION_TO_MINUTES) return DURATION_TO_MINUTES[duration]
  const parsed = parseInt(duration, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30
}

export function minutesToDuration(minutes: number): string {
  const match = Object.entries(DURATION_TO_MINUTES).find(([, m]) => m === minutes)
  if (match) return match[0]
  return `${minutes} min`
}

// --- date/time <-> "9h00"/"14h30" strings ---------------------------------
export function formatTime(date: Date): string {
  return date
    .toLocaleTimeString("fr-FR", { hour: "numeric", minute: "2-digit" })
    .replace(":00", "h00")
    .replace(":", "h")
}

// Combines a calendar date with a "9h00"/"14h30" time string, in local time.
export function combineDateAndTime(date: Date, time: string): Date {
  const [hoursStr, minutesStr] = time.split("h")
  const hours = parseInt(hoursStr, 10) || 0
  const minutes = parseInt(minutesStr, 10) || 0
  const combined = new Date(date)
  combined.setHours(hours, minutes, 0, 0)
  return combined
}

// --- appointment joins -----------------------------------------------------
function findPatient(patients: Patient[], id: string): Patient {
  return (
    patients.find((p) => p.id === id) ?? {
      id,
      firstName: "Patient",
      lastName: "inconnu",
      initials: "?",
      phone: "",
    }
  )
}

function findDentist(dentists: Practitioner[], id: string): Practitioner {
  return (
    dentists.find((d) => d.id === id) ?? {
      id,
      firstName: "Praticien",
      lastName: "inconnu",
      initials: "?",
      specialty: "",
      color: "bg-gray-400",
      visible: true,
    }
  )
}

function findCareType(careTypes: CareType[], id: string): CareType {
  return (
    careTypes.find((c) => c.id === id) ?? {
      id,
      name: "Soin",
      category: "soins_courants",
      defaultDuration: "30 min",
      color: "bg-blue-500",
      active: true,
      price: 0,
    }
  )
}

export interface AppointmentRefData {
  patients: Patient[]
  dentists: Practitioner[]
  careTypes: CareType[]
}

// Join a single API appointment against already-fetched/mapped reference
// lists to produce the enriched shape planning components expect.
export function buildAppointment(raw: ApiAppointment, refs: AppointmentRefData): Appointment {
  const date = new Date(raw.scheduled_at)
  const patient = findPatient(refs.patients, raw.patient_id)
  const dentist = findDentist(refs.dentists, raw.dentist_id)
  const care = findCareType(refs.careTypes, raw.care_type_id)

  return {
    id: raw.id,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientInitials: patient.initials,
    dentistId: dentist.id,
    dentistName: `Dr. ${dentist.firstName} ${dentist.lastName}`,
    resourceId: raw.resource_id ?? undefined,
    date,
    time: formatTime(date),
    duration: minutesToDuration(raw.duration_minutes),
    careTypeId: care.id,
    careLabel: care.name,
    category: care.category,
    status: raw.status,
    color: categoryColors[care.category],
    treatmentStepId: raw.treatment_step_id ?? undefined,
    prepNotes: raw.prep_notes ?? undefined,
    internalNotes: raw.internal_notes ?? undefined,
    sendConfirmation: raw.send_confirmation ?? true,
    confirmationDeliveryStatus: raw.confirmation_delivery_status,
    confirmationSentAt: raw.confirmation_sent_at ?? undefined,
    cancellationReason: raw.cancellation_reason ?? undefined,
    seriesId: raw.series_id ?? undefined,
    seriesOccurrenceIndex: raw.series_occurrence_index ?? undefined,
  }
}

export function buildAppointments(raw: ApiAppointment[], refs: AppointmentRefData): Appointment[] {
  return raw.map((r) => buildAppointment(r, refs))
}

// --- waitlist joins ---------------------------------------------------

function findPatientForWaitlist(patients: Patient[], id: string): Patient {
  return findPatient(patients, id)
}

export function buildWaitlistEntry(raw: ApiWaitlistEntry, refs: { patients: Patient[] }): WaitlistEntry {
  const patient = findPatientForWaitlist(refs.patients, raw.patient_id)
  return {
    id: raw.id,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    careTypeId: raw.care_type_id,
    desiredDateRange: { from: raw.desired_from, to: raw.desired_to },
    priority: raw.priority,
    status: raw.status,
    notes: raw.notes ?? undefined,
    createdAt: raw.created_at,
  }
}

export function buildWaitlist(raw: ApiWaitlistEntry[], refs: { patients: Patient[] }): WaitlistEntry[] {
  return raw.map((r) => buildWaitlistEntry(r, refs))
}

// UI -> API for creating a new entry (WaitlistPanel's "Ajouter" button).
export function toWaitlistCreateRequest(
  entry: Omit<WaitlistEntry, "id" | "createdAt" | "status">
): WaitlistEntryCreateRequest {
  return {
    patient_id: entry.patientId,
    care_type_id: entry.careTypeId,
    desired_from: entry.desiredDateRange.from,
    desired_to: entry.desiredDateRange.to,
    priority: entry.priority,
    notes: entry.notes || null,
  }
}

// Aggregates appointment counts per day for the mini calendar picker —
// computed client-side from the full appointments list instead of hitting a
// separate endpoint.
export function buildAppointmentDates(appointments: Appointment[]): Array<{ date: Date; count: number }> {
  const counts = new Map<string, { date: Date; count: number }>()

  for (const appt of appointments) {
    const key = `${appt.date.getFullYear()}-${appt.date.getMonth()}-${appt.date.getDate()}`
    const existing = counts.get(key)
    if (existing) {
      existing.count += 1
    } else {
      const day = new Date(appt.date)
      day.setHours(0, 0, 0, 0)
      counts.set(key, { date: day, count: 1 })
    }
  }

  return Array.from(counts.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}