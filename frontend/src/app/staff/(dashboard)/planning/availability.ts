import type { Appointment, Practitioner } from "./types"
import { durationToMinutes } from "./data"

export type SlotStatus =
  | "available"
  | "dentist_busy"
  | "resource_busy"
  | "outside_hours"
  | "day_off"
  | "buffer" // too close to an existing appointment — inside the cleanup/turnover gap, not itself booked

export interface TimeSlot {
  time: string // "9h00" / "14h30", same format as Appointment.time
  status: SlotStatus
}

export interface DaySlotsResult {
  slots: TimeSlot[]
  dayOff: boolean
  // true when the dentist has no working-hours configured at all — falls
  // back to the old 8h-19h30 default window instead of blocking booking.
  unconfigured: boolean
}

// Minimum gap kept clear between two appointments for the same dentist or
// the same chair/room (cleanup, room turnover, writing up notes). Not yet
// backed by a real practice-wide setting (see policies-tab.tsx, which is
// still local-only), so this is the single source of truth every caller
// falls back to until that's wired up.
export const DEFAULT_BUFFER_MINUTES = 10

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

const GRID_STEP_MINUTES = 15
// Fallback window, matches the previous hardcoded timeSlots range, used
// whenever a dentist has no working_hours configured yet.
const FALLBACK_START_MINUTES = 8 * 60
const FALLBACK_END_MINUTES = 19 * 60 + 30

const ACTIVE_STATUSES: Appointment["status"][] = ["pending", "confirmed", "arrived"]

function timeToMinutes(time: string): number {
  const [h, m] = time.split("h")
  return parseInt(h, 10) * 60 + (parseInt(m, 10) || 0)
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h${m.toString().padStart(2, "0")}`
}

function parseHHmm(value: string): number | null {
  const [h, m] = value.split(":").map((v) => parseInt(v, 10))
  if (Number.isNaN(h)) return null
  return h * 60 + (Number.isNaN(m) ? 0 : m)
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function apptOverlaps(startMin: number, endMin: number, appt: Appointment): boolean {
  const apptStart = timeToMinutes(appt.time)
  const apptEnd = apptStart + durationToMinutes(appt.duration)
  return startMin < apptEnd && apptStart < endMin
}

// Same test, but the appointment's busy window is padded by `bufferMinutes`
// on both sides first — used to also catch candidate slots that don't
// literally overlap an appointment but don't leave the required turnover
// gap either (e.g. booking starts the instant the previous one ends).
function apptOverlapsWithBuffer(startMin: number, endMin: number, appt: Appointment, bufferMinutes: number): boolean {
  const apptStart = timeToMinutes(appt.time)
  const apptEnd = apptStart + durationToMinutes(appt.duration)
  return startMin < apptEnd + bufferMinutes && apptStart - bufferMinutes < endMin
}

export type WorkingWindow = { start: number; end: number } | "off" | "unconfigured"

export function getWorkingWindow(date: Date, workingHours?: Practitioner["workingHours"]): WorkingWindow {
  if (!workingHours || workingHours.length === 0) return "unconfigured"
  const dayKey = DAY_KEYS[date.getDay()]
  const entry = workingHours.find((w) => w.day?.toLowerCase() === dayKey)
  if (!entry) return "unconfigured"
  if (entry.off) return "off"
  const start = entry.start ? parseHHmm(entry.start) : null
  const end = entry.end ? parseHHmm(entry.end) : null
  if (start === null || end === null || end <= start) return "unconfigured"
  return { start, end }
}

/**
 * Builds the bookable slot grid for a given day + dentist + duration,
 * flagging slots that fall outside working hours or collide with an
 * existing active appointment (dentist double-booked, or the same
 * chair/room already in use). Mirrors the backend's conflict rules in
 * app/api/v1/appointments.py so the UI stops relying on a silent 409.
 */
export function buildDaySlots(params: {
  date: Date
  dentist?: Practitioner
  durationMinutes: number
  resourceId?: string
  appointments: Appointment[]
  excludeAppointmentId?: string
  bufferMinutes?: number
}): DaySlotsResult {
  const {
    date,
    dentist,
    durationMinutes,
    resourceId,
    appointments,
    excludeAppointmentId,
    bufferMinutes = DEFAULT_BUFFER_MINUTES,
  } = params

  const window = getWorkingWindow(date, dentist?.workingHours)
  const dayOff = window === "off"
  const unconfigured = window === "unconfigured"
  const bounds =
    window === "off" || window === "unconfigured" ? { start: FALLBACK_START_MINUTES, end: FALLBACK_END_MINUTES } : window

  const sameDayActive = appointments.filter((a) => {
    if (excludeAppointmentId && a.id === excludeAppointmentId) return false
    if (!ACTIVE_STATUSES.includes(a.status)) return false
    return isSameDay(a.date, date)
  })

  const safeDuration = durationMinutes > 0 ? durationMinutes : 30
  const slots: TimeSlot[] = []

  for (let start = bounds.start; start + safeDuration <= bounds.end; start += GRID_STEP_MINUTES) {
    const end = start + safeDuration
    let status: SlotStatus = "available"

    if (dayOff) {
      status = "day_off"
    } else if (!unconfigured && (start < (window as { start: number; end: number }).start || end > (window as { start: number; end: number }).end)) {
      status = "outside_hours"
    }

    if (status === "available" && dentist) {
      const dentistOverlap = sameDayActive.some((a) => a.dentistId === dentist.id && apptOverlaps(start, end, a))
      if (dentistOverlap) {
        status = "dentist_busy"
      } else {
        const dentistBuffer = sameDayActive.some(
          (a) => a.dentistId === dentist.id && apptOverlapsWithBuffer(start, end, a, bufferMinutes)
        )
        if (dentistBuffer) status = "buffer"
      }
    }
    if ((status === "available" || status === "buffer") && resourceId) {
      const resourceOverlap = sameDayActive.some((a) => a.resourceId === resourceId && apptOverlaps(start, end, a))
      if (resourceOverlap) {
        status = "resource_busy"
      } else {
        const resourceBuffer = sameDayActive.some(
          (a) => a.resourceId === resourceId && apptOverlapsWithBuffer(start, end, a, bufferMinutes)
        )
        if (resourceBuffer) status = "buffer"
      }
    }

    slots.push({ time: minutesToTime(start), status })
  }

  return { slots, dayOff, unconfigured }
}

export const slotStatusLabels: Record<Exclude<SlotStatus, "available">, string> = {
  dentist_busy: "Occupé",
  resource_busy: "Fauteuil/salle occupé",
  outside_hours: "Hors horaires",
  day_off: "Praticien absent",
  buffer: "Trop proche du rendez-vous précédent/suivant",
}