import type { Patient as ApiPatient } from "@/types/patient"
import type { StaffMember } from "@/types/auth"
import type { CareType as ApiCareType } from "@/types/care-type"
import type { Appointment as ApiAppointment } from "@/types/appointment"
import type { WaitlistEntry as ApiWaitlistEntry } from "@/types/waitlist"
import type { Invoice } from "@/types/invoice"
import { statusLabels as invoiceStatusLabels } from "@/types/invoice"

import type { WaitlistAlertEntry } from "./components/waitlist-alerts"
import type { PendingConfirmationEntry } from "./components/pending-confirmations"
import type { ChairScheduleEntry } from "./components/chairs-schedule"
import type { InvoiceEntry } from "./components/recent-invoices"
import type { CollectionEntry } from "./components/collections-today"
import type { Patient as PatientRow } from "./schemas/patient-schema"

// This file is the same kind of mapping boundary as ../planning/data.ts:
// API-shaped (snake_case, UUID) data in, UI-shaped data the widgets already
// expect out. Nothing in here talks to the network — page.tsx fetches, this
// file joins.

export function initials(first?: string | null, last?: string | null): string {
  const a = (first ?? "").trim().charAt(0)
  const b = (last ?? "").trim().charAt(0)
  return `${a}${b}`.toUpperCase() || "?"
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString()
}

export function toDayParam(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function formatHM(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

// "3 jours" — used by the waitlist widget, which cares about how long
// someone has been waiting, not the exact timestamp.
function relativeDaysFr(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const days = Math.max(0, Math.floor(diffMs / 86_400_000))
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return "1 jour"
  return `${days} jours`
}

// "Aujourd'hui, 08:05" / "Hier, 18:42" / "12/07/2026, 09:00" — used where
// the exact moment matters, e.g. when a confirmation request came in.
function relativeDateTimeFr(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const time = formatHM(iso)
  if (isSameDay(d, now)) return `Aujourd'hui, ${time}`
  if (isSameDay(d, yesterday)) return `Hier, ${time}`
  return `${d.toLocaleDateString("fr-FR")}, ${time}`
}

function findPatient(patients: ApiPatient[], id: string): ApiPatient | undefined {
  return patients.find((p) => p.id === id)
}

function findDentist(dentists: StaffMember[], id: string): StaffMember | undefined {
  return dentists.find((d) => d.id === id)
}

function findCareType(careTypes: ApiCareType[], id: string): ApiCareType | undefined {
  return careTypes.find((c) => c.id === id)
}

function dentistLabel(dentist: StaffMember | undefined): string {
  if (!dentist) return "Praticien inconnu"
  return `Dr. ${dentist.first_name ?? ""} ${dentist.last_name ?? ""}`.trim()
}

// --- waitlist ---------------------------------------------------------

export function buildWaitlistAlertEntries(
  entries: ApiWaitlistEntry[],
  patients: ApiPatient[],
  careTypes: ApiCareType[]
): WaitlistAlertEntry[] {
  return entries.map((entry) => {
    const patient = findPatient(patients, entry.patient_id)
    const careType = findCareType(careTypes, entry.care_type_id)
    return {
      id: entry.id,
      patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Patient inconnu",
      patientAvatar: patient ? initials(patient.first_name, patient.last_name) : "?",
      careLabel: careType?.name ?? "Soin",
      priority: entry.priority,
      reason: entry.notes?.trim() || "En attente d'un créneau disponible",
      waitingSince: relativeDaysFr(entry.created_at),
    }
  })
}

// --- pending confirmations ---------------------------------------------

export function buildPendingConfirmationEntries(
  appointments: ApiAppointment[],
  patients: ApiPatient[],
  dentists: StaffMember[],
  careTypes: ApiCareType[]
): PendingConfirmationEntry[] {
  return appointments
    .filter((a) => a.status === "pending")
    .map((a) => {
      const patient = findPatient(patients, a.patient_id)
      const dentist = findDentist(dentists, a.dentist_id)
      const careType = findCareType(careTypes, a.care_type_id)
      return {
        id: a.id,
        time: formatHM(a.scheduled_at),
        patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Patient inconnu",
        patientAvatar: patient ? initials(patient.first_name, patient.last_name) : "?",
        phone: patient?.phone || "—",
        careLabel: careType?.name ?? "Soin",
        doctorName: dentistLabel(dentist),
        requestedAt: relativeDateTimeFr(a.created_at),
      }
    })
}

// --- chairs & rooms ------------------------------------------------------

const CHAIR_STATUS_LABEL: Partial<Record<ApiAppointment["status"], string>> = {
  pending: "En attente",
  confirmed: "Confirmé",
  arrived: "Arrivé",
}

export function buildChairScheduleEntries(
  appointments: ApiAppointment[],
  patients: ApiPatient[],
  dentists: StaffMember[]
): ChairScheduleEntry[] {
  return appointments
    .filter((a) => a.resource_id && a.status in CHAIR_STATUS_LABEL)
    .map((a) => {
      const patient = findPatient(patients, a.patient_id)
      const dentist = findDentist(dentists, a.dentist_id)
      return {
        id: a.id,
        resourceId: a.resource_id as string,
        time: formatHM(a.scheduled_at),
        patientName: patient ? `${patient.first_name} ${patient.last_name}` : "Patient inconnu",
        doctorName: dentistLabel(dentist),
        status: CHAIR_STATUS_LABEL[a.status] ?? a.status,
      }
    })
}

// --- billing -------------------------------------------------------------

export function buildRecentInvoiceEntries(invoices: Invoice[], limit = 8): InvoiceEntry[] {
  return invoices
    .slice()
    .sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime())
    .slice(0, limit)
    .map((inv) => ({
      id: inv.id,
      number: inv.number,
      patientName: inv.patient_name,
      patientAvatar: inv.patient_avatar,
      total: inv.total,
      status: invoiceStatusLabels[inv.status] as InvoiceEntry["status"],
      issueDate: new Date(inv.issue_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    }))
}

// "To collect today": still owed, and not something due weeks from now —
// due today, overdue, or with no due date at all (paid on the spot).
export function buildCollectionEntries(invoices: Invoice[]): CollectionEntry[] {
  const now = new Date()
  return invoices
    .filter((inv) => {
      if (inv.balance <= 0) return false
      if (!inv.due_date) return true
      return new Date(inv.due_date).getTime() <= now.getTime()
    })
    .map((inv) => ({
      id: inv.id,
      patientName: inv.patient_name,
      patientAvatar: inv.patient_avatar,
      invoiceNumber: inv.number,
      amountDue: inv.balance,
      status: inv.status === "partially_paid" ? "Partially Paid" : "Unpaid",
    }))
}

// --- patients table (Practitioner dashboard) ------------------------------

export function buildPatientTableRows(
  patients: ApiPatient[],
  appointments: ApiAppointment[],
  invoices: Invoice[],
  dentists: StaffMember[],
  careTypes: ApiCareType[]
): PatientRow[] {
  const now = new Date()

  return patients.map((p) => {
    const own = appointments.filter((a) => a.patient_id === p.id)
    const upcoming = own
      .filter((a) => new Date(a.scheduled_at) >= now && a.status !== "cancelled" && a.status !== "no_show")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    const past = own
      .filter((a) => new Date(a.scheduled_at) < now)
      .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    const nextAppt = upcoming[0]
    const lastAppt = past[0]
    const relevant = nextAppt ?? lastAppt

    const ownInvoices = invoices.filter((inv) => inv.patient_id === p.id)
    const balance = ownInvoices.reduce((sum, inv) => sum + inv.balance, 0)
    const hasOverdueBalance = ownInvoices.some(
      (inv) => inv.balance > 0 && inv.due_date && new Date(inv.due_date) < now
    )

    let status: PatientRow["status"] = "Scheduled"
    if (hasOverdueBalance) status = "Overdue"
    else if (nextAppt && isSameDay(new Date(nextAppt.scheduled_at), now)) status = "In Treatment"
    else if (nextAppt) status = "Scheduled"
    else if (lastAppt?.status === "completed") status = "Completed"

    return {
      id: p.id,
      patientName: `${p.first_name} ${p.last_name}`,
      patientAvatar: initials(p.first_name, p.last_name),
      procedure: relevant ? (findCareType(careTypes, relevant.care_type_id)?.name ?? "Soin") : "—",
      status,
      nextAppointment: nextAppt
        ? isSameDay(new Date(nextAppt.scheduled_at), now)
          ? `Today, ${formatHM(nextAppt.scheduled_at)}`
          : `${new Date(nextAppt.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${formatHM(nextAppt.scheduled_at)}`
        : "—",
      balance: `${balance.toLocaleString()} TND`,
      doctor: relevant ? dentistLabel(findDentist(dentists, relevant.dentist_id)) : "—",
    }
  })
}
