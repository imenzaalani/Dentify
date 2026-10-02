import { type Appointment } from "./types"
import { durationToMinutes } from "./data"
import { DEFAULT_BUFFER_MINUTES } from "./availability"

// --- shared time-range overlap helpers -------------------------------------
// Mirrors the "9h00"/"14h30" parsing in day-view.tsx / week-view.tsx — kept
// here too so this file has no dependency on either view.
function timeStringToMinutes(time: string): number {
  const [h, m] = time.split("h")
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0)
}

interface TimeRange {
  start: number
  end: number
}

function toRange(a: Appointment): TimeRange {
  const start = timeStringToMinutes(a.time)
  return { start, end: start + durationToMinutes(a.duration) }
}

function overlaps(a: TimeRange, b: TimeRange): boolean {
  return a.start < b.end && b.start < a.end
}

// Gap between two non-overlapping ranges, in minutes (whichever starts
// later minus the other's end). Only meaningful when they don't overlap.
function gapMinutes(a: TimeRange, b: TimeRange): number {
  return a.start >= b.end ? a.start - b.end : b.start - a.end
}

// Cancelled/no-show appointments no longer hold their slot, so they never
// trigger a conflict with anything scheduled afterwards.
function isActive(a: Appointment): boolean {
  return a.status !== "cancelled" && a.status !== "no_show"
}

// "dentist"/"resource" are real double-bookings (two appointments literally
// overlapping); "buffer" is softer — back-to-back or closer than the
// required turnover gap, but not actually overlapping. Kept as its own kind
// so the UI can style it less alarmingly than a genuine double-booking.
export type ConflictKind = "dentist" | "resource" | "buffer"

export interface ConflictInfo {
  kind: ConflictKind
  withPatientName: string
}

function pushConflict(map: Map<string, ConflictInfo[]>, id: string, info: ConflictInfo) {
  const list = map.get(id)
  if (list) list.push(info)
  else map.set(id, [info])
}

// Pairwise scan over a same-day appointment list (day-view/week-view already
// filter to one day before calling this, so this stays cheap). Flags:
//  - two active appointments for the same practitioner overlapping in time
//    (a dentist genuinely double-booked),
//  - two active appointments sharing the same chair/room and overlapping
//    (a resource double-booked across two different practitioners), and
//  - two active appointments for the same dentist or same chair/room that
//    don't overlap but leave less than `bufferMinutes` between them (no
//    turnover time).
// Same-time appointments for two different practitioners with no shared
// resource are normal parallel bookings, not a conflict.
export function computeConflicts(
  dayAppointments: Appointment[],
  bufferMinutes: number = DEFAULT_BUFFER_MINUTES
): Map<string, ConflictInfo[]> {
  const map = new Map<string, ConflictInfo[]>()
  const active = dayAppointments.filter(isActive)

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]
      const b = active[j]
      const rangeA = toRange(a)
      const rangeB = toRange(b)
      const sameDentist = a.dentistId === b.dentistId
      const sameResource = Boolean(a.resourceId) && a.resourceId === b.resourceId

      if (!sameDentist && !sameResource) continue

      if (overlaps(rangeA, rangeB)) {
        if (sameDentist) {
          pushConflict(map, a.id, { kind: "dentist", withPatientName: b.patientName })
          pushConflict(map, b.id, { kind: "dentist", withPatientName: a.patientName })
        } else {
          pushConflict(map, a.id, { kind: "resource", withPatientName: b.patientName })
          pushConflict(map, b.id, { kind: "resource", withPatientName: a.patientName })
        }
      } else if (bufferMinutes > 0 && gapMinutes(rangeA, rangeB) < bufferMinutes) {
        pushConflict(map, a.id, { kind: "buffer", withPatientName: b.patientName })
        pushConflict(map, b.id, { kind: "buffer", withPatientName: a.patientName })
      }
    }
  }

  return map
}

export function conflictSummary(infos: ConflictInfo[]): string {
  const dentistHits = infos.filter((i) => i.kind === "dentist")
  const resourceHits = infos.filter((i) => i.kind === "resource")
  const bufferHits = infos.filter((i) => i.kind === "buffer")
  const parts: string[] = []
  if (dentistHits.length > 0) {
    parts.push(`Chevauche ${dentistHits.map((i) => i.withPatientName).join(", ")} chez le même praticien`)
  }
  if (resourceHits.length > 0) {
    parts.push(`Fauteuil/salle déjà occupé par ${resourceHits.map((i) => i.withPatientName).join(", ")}`)
  }
  if (bufferHits.length > 0) {
    parts.push(`Pas de battement avec ${bufferHits.map((i) => i.withPatientName).join(", ")}`)
  }
  return parts.join(" · ")
}

// A patient's very first appointment, chronologically across every
// appointment on record for them — used to flag "new patient" without a
// dedicated backend field. Pass the full, unfiltered appointments list (not
// a single day's slice) so the comparison reflects real history.
export function computeFirstVisitIds(allAppointments: Appointment[]): Set<string> {
  const earliest = new Map<string, Appointment>()
  for (const appt of allAppointments) {
    const current = earliest.get(appt.patientId)
    if (!current || appt.date.getTime() < current.date.getTime()) {
      earliest.set(appt.patientId, appt)
    }
  }
  return new Set(Array.from(earliest.values()).map((a) => a.id))
}