"use client"

import { useMemo } from "react"
import { AlertTriangle, Armchair, Clock, DoorOpen, MessageSquareText, Repeat, UserPlus } from "lucide-react"
import { addDays, format, isSameDay, isToday, startOfWeek } from "date-fns"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { durationToMinutes, practitionerSwatch } from "../data"
import { computeConflicts, conflictSummary } from "../conflicts"
import { getWorkingWindow } from "../availability"
import { type Appointment, type BlockedSlot, type Practitioner, type Resource, blockReasonLabels, statusColors, statusLabels, categoryCardStyles, mutedCardStyle } from "../types"

// Same geometry as day-view.tsx so switching between the two views doesn't
// re-scale the grid staff have already built a spatial sense of.
const START_HOUR = 8
const END_HOUR = 19
const SLOT_MIN = 30
const ROW_PX = 56
const SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN

function timeStringToMinutes(time: string): number {
  const [h, m] = time.split("h")
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0)
}

// Week view has no per-practitioner columns, so same-time appointments for
// different dentists are laid out side by side in "lanes" within the day
// column instead — a simple greedy interval-packing pass, same idea as a
// typical week-agenda widget.
function assignLanes(entries: Array<{ id: string; start: number; end: number }>): {
  lanes: Map<string, number>
  laneCount: number
} {
  const sorted = [...entries].sort((a, b) => a.start - b.start)
  const laneEnds: number[] = []
  const lanes = new Map<string, number>()

  for (const entry of sorted) {
    let laneIndex = laneEnds.findIndex((end) => end <= entry.start)
    if (laneIndex === -1) {
      laneIndex = laneEnds.length
      laneEnds.push(entry.end)
    } else {
      laneEnds[laneIndex] = entry.end
    }
    lanes.set(entry.id, laneIndex)
  }

  return { lanes, laneCount: laneEnds.length || 1 }
}

// Week columns aren't per-dentist (unlike the day view), so per-dentist
// off-hours shading doesn't map cleanly here. Instead we shade the hours
// where *none* of the listed practitioners are working — still useful
// ("nobody's in before 9h00 on Wednesdays") without implying a single
// dentist's schedule. Practitioners with no working hours configured at
// all are treated as "always open" (same unconfigured fallback as the
// day view / booking form), so partial data doesn't over-shade the grid.
function computeClinicOffHours(
  practitioners: Practitioner[],
  date: Date,
  dayStartMin: number,
  dayEndMin: number
): { start: number; end: number }[] {
  const windows = practitioners.map((p) => getWorkingWindow(date, p.workingHours))

  if (windows.some((w) => w === "unconfigured")) return []
  const openWindows = windows.filter((w): w is { start: number; end: number } => w !== "off")
  if (openWindows.length === 0) return [{ start: dayStartMin, end: dayEndMin }]

  const merged = [...openWindows].sort((a, b) => a.start - b.start).reduce<{ start: number; end: number }[]>((acc, w) => {
    const last = acc[acc.length - 1]
    if (last && w.start <= last.end) {
      last.end = Math.max(last.end, w.end)
    } else {
      acc.push({ ...w })
    }
    return acc
  }, [])

  const gaps: { start: number; end: number }[] = []
  let cursor = dayStartMin
  for (const w of merged) {
    if (w.start > cursor) gaps.push({ start: cursor, end: Math.min(w.start, dayEndMin) })
    cursor = Math.max(cursor, w.end)
  }
  if (cursor < dayEndMin) gaps.push({ start: cursor, end: dayEndMin })
  return gaps.filter((g) => g.end > g.start)
}

interface WeekViewProps {
  date: Date
  practitioners: Practitioner[]
  appointments: Appointment[]
  blockedSlots?: BlockedSlot[]
  resources?: Resource[]
  firstVisitAppointmentIds?: Set<string>
  onAppointmentClick?: (appointment: Appointment) => void
  // Week view is an overview surface — clicking a day header jumps into
  // the full day grid (where editing, drag-reschedule, and slot-click all
  // live) rather than duplicating that interaction model here.
  onSelectDay?: (date: Date) => void
}

export function WeekView({
  date,
  practitioners,
  appointments,
  blockedSlots = [],
  resources = [],
  firstVisitAppointmentIds,
  onAppointmentClick,
  onSelectDay,
}: WeekViewProps) {
  const weekStart = useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date])
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const practitionerMap = useMemo(() => new Map(practitioners.map((p) => [p.id, p])), [practitioners])

  const dayStartMin = START_HOUR * 60
  const gridHeight = SLOTS * ROW_PX

  return (
    <div className="planning-view-root flex-1 min-h-0 flex flex-col">
      <div className="planning-scroll flex-1 min-h-0 overflow-auto">
        <div className="planning-columns-row flex" style={{ minWidth: 7 * 170 + 64 }}>
          {/* Time gutter */}
          <div className="planning-gutter w-16 shrink-0 sticky left-0 z-20 bg-background border-r">
            <div className="planning-sticky h-14 sticky top-0 z-30 bg-background border-b" />
            <div style={{ height: gridHeight }} className="relative">
              {Array.from({ length: SLOTS + 1 }).map((_, i) => {
                const minutes = dayStartMin + i * SLOT_MIN
                if (minutes % 60 !== 0) return null
                return (
                  <div
                    key={i}
                    className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground"
                    style={{ top: i * ROW_PX }}
                  >
                    {Math.floor(minutes / 60)}h00
                  </div>
                )
              })}
            </div>
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayAppointments = appointments.filter((a) => isSameDay(a.date, day))
            const dayBlockedSlots = blockedSlots.filter((b) => isSameDay(b.date, day))
            const conflicts = computeConflicts(dayAppointments)
            const activeCount = dayAppointments.filter(
              (a) => a.status !== "cancelled" && a.status !== "no_show"
            ).length

            const laneInput = [
              ...dayAppointments.map((a) => ({
                id: a.id,
                start: timeStringToMinutes(a.time),
                end: timeStringToMinutes(a.time) + durationToMinutes(a.duration),
              })),
              ...dayBlockedSlots.map((b) => ({
                id: b.id,
                start: timeStringToMinutes(b.startTime),
                end: timeStringToMinutes(b.endTime),
              })),
            ]
            const { lanes, laneCount } = assignLanes(laneInput)
            const isDayToday = isToday(day)
            const offHoursRanges = computeClinicOffHours(practitioners, day, dayStartMin, END_HOUR * 60)

            return (
              <div
                key={day.toISOString()}
                className={cn("planning-column flex-1 min-w-[170px] border-r last:border-r-0", isDayToday && "bg-accent/10")}
              >
                {/* Day header — click to drill into the full day grid */}
                <button
                  type="button"
                  className="planning-sticky h-14 w-full sticky top-0 z-10 bg-background border-b flex flex-col items-center justify-center gap-0.5 px-2 cursor-pointer hover:bg-accent/40 transition-colors"
                  onClick={() => onSelectDay?.(day)}
                  title="Voir la journée en détail"
                >
                  <span className="text-xs text-muted-foreground capitalize">{format(day, "EEE", { locale: fr })}</span>
                  <span
                    className={cn(
                      "text-sm font-medium leading-none",
                      isDayToday && "bg-primary text-primary-foreground rounded-md w-6 h-6 flex items-center justify-center text-xs"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {activeCount > 0 ? `${activeCount} RDV` : "—"}
                  </span>
                </button>

                {/* Slot grid + packed appointments */}
                <div className="relative" style={{ height: gridHeight }}>
                  {Array.from({ length: SLOTS }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "absolute left-0 right-0 border-t",
                        (dayStartMin + i * SLOT_MIN) % 60 === 0 ? "border-border" : "border-border/40"
                      )}
                      style={{ top: i * ROW_PX }}
                    />
                  ))}

                  {offHoursRanges.map((r, i) => (
                    <div
                      key={`off-${i}`}
                      className="absolute left-0 right-0 pointer-events-none bg-muted/50 bg-[repeating-linear-gradient(135deg,transparent_0px,transparent_6px,var(--color-border)_6px,var(--color-border)_7px)]"
                      style={{ top: ((r.start - dayStartMin) / SLOT_MIN) * ROW_PX, height: ((r.end - r.start) / SLOT_MIN) * ROW_PX }}
                    />
                  ))}

                  {dayBlockedSlots.map((block) => {
                    const startMin = timeStringToMinutes(block.startTime)
                    const endMin = timeStringToMinutes(block.endTime)
                    const top = ((startMin - dayStartMin) / SLOT_MIN) * ROW_PX
                    const height = Math.max(((endMin - startMin) / SLOT_MIN) * ROW_PX - 2, 20)
                    const lane = lanes.get(block.id) ?? 0
                    const widthPct = 100 / laneCount

                    return (
                      <div
                        key={block.id}
                        className="absolute rounded-md px-1.5 py-0.5 text-[10px] overflow-hidden border border-dashed border-muted-foreground/40 bg-[repeating-linear-gradient(135deg,var(--color-muted)_0px,var(--color-muted)_6px,transparent_6px,transparent_12px)] text-muted-foreground"
                        style={{ top, height, left: `${lane * widthPct}%`, width: `calc(${widthPct}% - 2px)` }}
                        title={`${block.startTime} – ${block.endTime} · ${blockReasonLabels[block.reason]}`}
                      >
                        <span className="truncate block font-medium">{blockReasonLabels[block.reason]}</span>
                      </div>
                    )
                  })}

                  {dayAppointments.map((appointment) => {
                    const startMin = timeStringToMinutes(appointment.time)
                    const durationMin = durationToMinutes(appointment.duration)
                    const top = ((startMin - dayStartMin) / SLOT_MIN) * ROW_PX
                    const height = Math.max((durationMin / SLOT_MIN) * ROW_PX - 3, 20)
                    const isMuted = appointment.status === "cancelled" || appointment.status === "no_show"
                    const isFirstVisit = firstVisitAppointmentIds?.has(appointment.id) ?? false
                    const hasNote = Boolean(appointment.prepNotes || appointment.internalNotes)
                    const appointmentConflicts = conflicts.get(appointment.id)
                    const hasDentistConflict = Boolean(appointmentConflicts?.some((c) => c.kind === "dentist"))
                    const hasResourceConflict = Boolean(appointmentConflicts?.some((c) => c.kind === "resource"))
                    const hasHardConflict = hasDentistConflict || hasResourceConflict
                    const hasBufferOnly = Boolean(appointmentConflicts?.length) && !hasHardConflict
                    const resource = resources.find((r) => r.id === appointment.resourceId)
                    const practitioner = practitionerMap.get(appointment.dentistId)
                    const lane = lanes.get(appointment.id) ?? 0
                    const widthPct = 100 / laneCount
                    const style = isMuted ? mutedCardStyle : categoryCardStyles[appointment.category]

                    const titleParts = [`${appointment.time} · ${appointment.patientName} · ${appointment.careLabel} · ${appointment.dentistName}`]
                    if (resource?.name) titleParts.push(resource.name)
                    if (isFirstVisit) titleParts.push("Nouveau patient")
                    if (appointment.prepNotes) titleParts.push(`Note : ${appointment.prepNotes}`)
                    if (appointment.internalNotes) titleParts.push(`Note interne : ${appointment.internalNotes}`)
                    if (appointmentConflicts?.length) titleParts.push(`Conflit : ${conflictSummary(appointmentConflicts)}`)

                    return (
                      <div
                        key={appointment.id}
                        className={cn(
                          "absolute rounded-md border border-l-4 px-1.5 py-0.5 text-[10px] shadow-sm overflow-hidden cursor-pointer transition-shadow hover:shadow-md",
                          style.bg,
                          style.border,
                          style.accent,
                          style.text,
                          isMuted && "line-through decoration-muted-foreground/50",
                          hasHardConflict && "ring-2 ring-red-500 ring-offset-1",
                          hasBufferOnly && "ring-2 ring-amber-400 ring-offset-1"
                        )}
                        style={{ top, height, left: `${lane * widthPct}%`, width: `calc(${widthPct}% - 2px)` }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick?.(appointment)
                        }}
                        title={titleParts.join(" · ")}
                      >
                        <div className="flex items-center gap-0.5 min-w-0">
                          {practitioner && (
                            <span
                              className={cn("w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-background", practitionerSwatch(practitioner.color).className)}
                              style={practitionerSwatch(practitioner.color).style}
                            />
                          )}
                          <span className="font-semibold truncate">{appointment.patientName}</span>
                          {isFirstVisit && <UserPlus className="w-2.5 h-2.5 shrink-0 opacity-80" />}
                          <span className="flex items-center gap-1 ml-auto shrink-0">
                            {hasDentistConflict && <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-red-600" aria-label="Praticien en double réservation" />}
                            {hasResourceConflict &&
                              (resource?.type === "room" ? (
                                <DoorOpen className="w-2.5 h-2.5 shrink-0 text-red-600" aria-label="Salle en double réservation" />
                              ) : (
                                <Armchair className="w-2.5 h-2.5 shrink-0 text-red-600" aria-label="Fauteuil en double réservation" />
                              ))}
                            {hasBufferOnly && <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-amber-600" aria-label="Battement insuffisant" />}
                            {appointment.seriesId && (
                              <Repeat className={cn("w-2.5 h-2.5 shrink-0", style.textMuted)} aria-label="Rendez-vous récurrent" />
                            )}
                            {hasNote && <MessageSquareText className={cn("w-2.5 h-2.5 shrink-0", style.textMuted)} />}
                          </span>
                          {hasNote && <MessageSquareText className={cn("w-2.5 h-2.5 shrink-0", style.textMuted)} />}
                        </div>
                        {height > 32 && (
                          <div className={cn("flex items-center gap-1 truncate", style.textMuted)}>
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            {appointment.time}
                            <span
                              className={cn("w-1.5 h-1.5 rounded-full ring-1 ring-background ml-auto", statusColors[appointment.status])}
                              title={statusLabels[appointment.status]}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}