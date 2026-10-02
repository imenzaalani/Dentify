"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, Armchair, Clock, DoorOpen, MessageSquareText, UserPlus } from "lucide-react"
import { isSameDay, isToday } from "date-fns"

import { cn } from "@/lib/utils"
import { durationToMinutes, practitionerSwatch } from "../data"
import { computeConflicts, conflictSummary } from "../conflicts"
import { getWorkingWindow } from "../availability"
import { cardA11yProps } from "../a11y"
import { type Appointment, type BlockedSlot, type Practitioner, type Resource, blockReasonLabels, statusColors, statusLabels, categoryCardStyles, mutedCardStyle } from "../types"

// --- timeline geometry -------------------------------------------------
// Every row is one 30-minute slot. Bump ROW_PX for a more spread-out
// look (e.g. a single-practitioner cabinet), or widen the range for
// clinics that open earlier/later.
const START_HOUR = 8
const END_HOUR = 19
const SLOT_MIN = 30
const ROW_PX = 56
const SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MIN

function timeStringToMinutes(time: string): number {
  const [h, m] = time.split("h")
  return (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0)
}

function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h}h${m.toString().padStart(2, "0")}`
}

// Off-hours ranges (clipped to the visible grid) for a given practitioner +
// day, derived from the same working-hours logic the booking form already
// uses (see availability.ts) so the grid and the form never disagree about
// what's bookable. "unconfigured" (no working hours set at all) falls back
// to treating the whole grid as open, same as the form does.
function getOffHoursRanges(
  practitioner: Practitioner,
  date: Date,
  dayStartMin: number,
  dayEndMin: number
): { dayOff: boolean; ranges: { start: number; end: number }[] } {
  const window = getWorkingWindow(date, practitioner.workingHours)

  if (window === "unconfigured") return { dayOff: false, ranges: [] }
  if (window === "off") return { dayOff: true, ranges: [{ start: dayStartMin, end: dayEndMin }] }

  const ranges: { start: number; end: number }[] = []
  if (window.start > dayStartMin) {
    ranges.push({ start: dayStartMin, end: Math.min(window.start, dayEndMin) })
  }
  if (window.end < dayEndMin) {
    ranges.push({ start: Math.max(window.end, dayStartMin), end: dayEndMin })
  }
  return { dayOff: false, ranges }
}

function isWithinRanges(minutes: number, ranges: { start: number; end: number }[]): boolean {
  return ranges.some((r) => minutes >= r.start && minutes < r.end)
}

interface DayViewProps {
  date: Date
  practitioners: Practitioner[]
  appointments: Appointment[]
  blockedSlots?: BlockedSlot[]
  resources?: Resource[]
  // Ids of appointments that are the patient's earliest on record — see
  // computeFirstVisitIds in ../conflicts. Computed once over the full,
  // unfiltered appointment list by the caller so it reflects true history.
  firstVisitAppointmentIds?: Set<string>
  onAppointmentClick?: (appointment: Appointment) => void
  onCheckIn?: (appointmentId: string) => void
  onSlotClick?: (date: Date, time: string, dentistId: string) => void
  onRemoveBlockedSlot?: (id: string) => void
  // Drag-and-drop reschedule: fired on drop with the appointment's new
  // date/time/practitioner. Omitting this prop leaves cards non-draggable.
  onReschedule?: (appointmentId: string, date: Date, time: string, dentistId: string) => void
}

export function DayView({
  date,
  practitioners,
  appointments,
  blockedSlots = [],
  resources = [],
  firstVisitAppointmentIds,
  onAppointmentClick,
  onCheckIn,
  onSlotClick,
  onRemoveBlockedSlot,
  onReschedule,
}: DayViewProps) {
  const visiblePractitioners = practitioners.filter((p) => p.visible)
  const dayAppointments = useMemo(
    () => appointments.filter((a) => isSameDay(a.date, date)),
    [appointments, date]
  )
  const dayBlockedSlots = useMemo(
    () => blockedSlots.filter((b) => isSameDay(b.date, date)),
    [blockedSlots, date]
  )
  const conflicts = useMemo(() => computeConflicts(dayAppointments), [dayAppointments])

  const [nowMinutes, setNowMinutes] = useState(() => {
    const n = new Date()
    return n.getHours() * 60 + n.getMinutes()
  })
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date()
      setNowMinutes(n.getHours() * 60 + n.getMinutes())
    }, 60_000)
    return () => clearInterval(id)
  }, [])

  const gridHeight = SLOTS * ROW_PX
  const dayStartMin = START_HOUR * 60
  const dayEndMin = END_HOUR * 60
  const showNowLine = isToday(date) && nowMinutes >= dayStartMin && nowMinutes <= dayEndMin

  // Dragging state — tracked here (not per-block) so only one card can be
  // "lifted" at a time and the column under the pointer can be highlighted.
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverDentistId, setDragOverDentistId] = useState<string | null>(null)

  // Keyboard-driven reschedule (arrow keys on a focused card) is the only
  // way to move an appointment without a mouse, since drag-and-drop has no
  // native keyboard equivalent. `announcement` feeds a visually-hidden
  // live region so screen reader users hear the result of a move that
  // otherwise has no visible focus change to announce it. `pendingFocusId`
  // re-focuses the moved card after it re-renders — necessary because
  // changing dentistId moves the card into a different column's DOM
  // subtree, which unmounts/remounts it and drops focus.
  const [announcement, setAnnouncement] = useState("")
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(null)

  useEffect(() => {
    if (!pendingFocusId) return
    const raf = requestAnimationFrame(() => {
      document
        .querySelector<HTMLElement>(`[data-appointment-id="${pendingFocusId}"]`)
        ?.focus()
      setPendingFocusId(null)
    })
    return () => cancelAnimationFrame(raf)
  }, [appointments, pendingFocusId])

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Land on "now" (or the day's first appointment, if now falls outside
    // opening hours) instead of always resetting to the top of the grid —
    // switching dates mid-afternoon used to dump staff back at 8h00 with
    // everything they actually needed to see below the fold.
    const el = scrollRef.current
    if (!el) return

    let anchorMinutes: number | null = null
    if (isToday(date) && nowMinutes >= dayStartMin && nowMinutes <= dayEndMin) {
      anchorMinutes = nowMinutes
    } else if (dayAppointments.length > 0) {
      const earliest = Math.min(...dayAppointments.map((a) => timeStringToMinutes(a.time)))
      anchorMinutes = Number.isFinite(earliest) ? earliest : null
    }

    if (anchorMinutes === null) {
      el.scrollTo({ top: 0 })
      return
    }
    // Keep the anchor roughly a third of the way down the viewport rather
    // than pinned to the very top, so a few earlier slots stay in view too.
    const target = Math.max(((anchorMinutes - dayStartMin) / SLOT_MIN) * ROW_PX - el.clientHeight / 3, 0)
    el.scrollTo({ top: target })
    // Only re-run when the date changes — a live-updating `nowMinutes`
    // shouldn't yank the scroll position while someone is actively working.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  if (visiblePractitioners.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-sm text-muted-foreground">
        Aucun praticien visible. Activez-en un depuis la barre latérale pour afficher son agenda.
      </div>
    )
  }

  function isSlotBlocked(dentistId: string, minutes: number): boolean {
    return dayBlockedSlots.some((b) => {
      if (b.dentistId !== dentistId) return false
      const start = timeStringToMinutes(b.startTime)
      const end = timeStringToMinutes(b.endTime)
      return minutes >= start && minutes < end
    })
  }

  function isOutsideWorkingHours(dentistId: string, minutes: number): boolean {
    const practitioner = visiblePractitioners.find((p) => p.id === dentistId)
    if (!practitioner) return false
    const { dayOff, ranges } = getOffHoursRanges(practitioner, date, dayStartMin, dayEndMin)
    return dayOff || isWithinRanges(minutes, ranges)
  }

  // Shared by the mouse drop handler and the keyboard-reschedule handler
  // below, so "can this appointment land here" only has one definition.
  function canPlaceAt(dentistId: string, minutes: number): boolean {
    return !isSlotBlocked(dentistId, minutes) && !isOutsideWorkingHours(dentistId, minutes)
  }

  function minutesFromPointer(e: { clientY: number }, rect: DOMRect): number {
    const offsetY = e.clientY - rect.top
    const rawMinutes = dayStartMin + (offsetY / ROW_PX) * SLOT_MIN
    const snapped = Math.round(rawMinutes / SLOT_MIN) * SLOT_MIN
    return Math.min(Math.max(snapped, dayStartMin), dayEndMin - SLOT_MIN)
  }

  const handleColumnClick = (e: React.MouseEvent<HTMLDivElement>, dentistId: string) => {
    if (!onSlotClick) return
    const clamped = minutesFromPointer(e, e.currentTarget.getBoundingClientRect())
    if (isSlotBlocked(dentistId, clamped) || isOutsideWorkingHours(dentistId, clamped)) return
    onSlotClick(date, minutesToTimeString(clamped), dentistId)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dentistId: string) => {
    e.preventDefault()
    setDragOverDentistId(null)
    const appointmentId = e.dataTransfer.getData("text/plain")
    if (!onReschedule || !appointmentId) return
    const clamped = minutesFromPointer(e, e.currentTarget.getBoundingClientRect())
    if (!canPlaceAt(dentistId, clamped)) return
    onReschedule(appointmentId, date, minutesToTimeString(clamped), dentistId)
  }

  return (
    <div className="planning-view-root flex-1 min-h-0 flex flex-col">
      {/* Announces the result of a keyboard reschedule (arrow keys on a
          focused card) — that action has no visible focus change of its
          own to announce it, unlike a normal navigation. */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      <div ref={scrollRef} className="planning-scroll flex-1 min-h-0 overflow-auto">
        <div className="planning-columns-row flex" style={{ minWidth: visiblePractitioners.length * 220 + 64 }}>
          {/* Time gutter */}
          <div className="planning-gutter w-16 shrink-0 sticky left-0 z-20 bg-background border-r">
            <div className="planning-sticky h-12 sticky top-0 z-30 bg-background border-b" />
            <div style={{ height: gridHeight }} className="relative">
              {Array.from({ length: SLOTS + 1 }).map((_, i) => {
                const minutes = dayStartMin + i * SLOT_MIN
                const isHour = minutes % 60 === 0
                if (!isHour) return null
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

          {/* Practitioner columns */}
          {visiblePractitioners.map((practitioner) => {
            const columnAppointments = dayAppointments.filter((a) => a.dentistId === practitioner.id)
            const columnBlocks = dayBlockedSlots.filter((b) => b.dentistId === practitioner.id)
            const { dayOff, ranges: offHoursRanges } = getOffHoursRanges(practitioner, date, dayStartMin, dayEndMin)

            return (
              <div key={practitioner.id} className="planning-column flex-1 min-w-[220px] border-r last:border-r-0">
                {/* Column header */}
                <div className="planning-sticky h-12 sticky top-0 z-10 bg-background border-b flex items-center gap-2 px-3">
                  <span
                    className={cn("w-2.5 h-2.5 rounded-full shrink-0", practitionerSwatch(practitioner.color).className)}
                    style={practitionerSwatch(practitioner.color).style}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      Dr. {practitioner.firstName} {practitioner.lastName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{practitioner.specialty}</p>
                  </div>
                  {dayOff && (
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                      Absent
                    </span>
                  )}
                </div>

                {/* Slot grid + appointments */}
                <div
                  className={cn(
                    "relative cursor-pointer transition-colors",
                    dragOverDentistId === practitioner.id && "bg-primary/5"
                  )}
                  style={{ height: gridHeight }}
                  onClick={(e) => handleColumnClick(e, practitioner.id)}
                  onDragOver={(e) => {
                    if (!onReschedule) return
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "move"
                  }}
                  onDragEnter={() => onReschedule && setDragOverDentistId(practitioner.id)}
                  onDragLeave={(e) => {
                    if (e.currentTarget === e.target) setDragOverDentistId(null)
                  }}
                  onDrop={(e) => handleDrop(e, practitioner.id)}
                >
                  {/* Hour / half-hour gridlines */}
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

                  {/* Off-hours shading — outside the dentist's working window
                      (or the whole column when they're off that day), so
                      "unbookable" is visible at a glance instead of every
                      slot looking equally open. Non-interactive: clicks are
                      already rejected in handleColumnClick/handleDrop via
                      isOutsideWorkingHours, this is purely visual. */}
                  {offHoursRanges.map((r, i) => (
                    <div
                      key={`off-${i}`}
                      className="absolute left-0 right-0 pointer-events-none bg-muted/50 bg-[repeating-linear-gradient(135deg,transparent_0px,transparent_6px,var(--color-border)_6px,var(--color-border)_7px)]"
                      style={{ top: ((r.start - dayStartMin) / SLOT_MIN) * ROW_PX, height: ((r.end - r.start) / SLOT_MIN) * ROW_PX }}
                    />
                  ))}

                  {showNowLine && (
                    <div
                      className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                      style={{ top: ((nowMinutes - dayStartMin) / SLOT_MIN) * ROW_PX }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-0.5" />
                      <div className="flex-1 h-px bg-red-500" />
                    </div>
                  )}

                  {/* Keyboard-accessible empty slots — mirrors the pointer-based
                      handleColumnClick logic above so Tab + Enter can open a
                      new appointment at a given time without a mouse. Slots
                      covered by an existing appointment/block, blocked, or
                      outside working hours are skipped rather than rendered
                      disabled, so Tab only stops on times someone can act on. */}
                  {onSlotClick &&
                    Array.from({ length: SLOTS }).map((_, i) => {
                      const slotStart = dayStartMin + i * SLOT_MIN
                      const slotEnd = slotStart + SLOT_MIN
                      if (isSlotBlocked(practitioner.id, slotStart)) return null
                      if (isOutsideWorkingHours(practitioner.id, slotStart)) return null
                      const covered = columnAppointments.some((a) => {
                        const s = timeStringToMinutes(a.time)
                        const e = s + durationToMinutes(a.duration)
                        return slotStart < e && s < slotEnd
                      })
                      if (covered) return null
                      return (
                        <button
                          key={`slot-${i}`}
                          type="button"
                          className="absolute left-0 right-0 appearance-none border-0 bg-transparent p-0 cursor-pointer outline-none focus-visible:z-20 focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                          style={{ top: i * ROW_PX, height: ROW_PX }}
                          aria-label={`${minutesToTimeString(slotStart)}, Dr. ${practitioner.firstName} ${practitioner.lastName}, créneau libre — créer un rendez-vous`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onSlotClick(date, minutesToTimeString(slotStart), practitioner.id)
                          }}
                        />
                      )
                    })}

                  {columnBlocks.map((block) => {
                    const startMin = timeStringToMinutes(block.startTime)
                    const endMin = timeStringToMinutes(block.endTime)
                    const top = ((startMin - dayStartMin) / SLOT_MIN) * ROW_PX
                    const height = Math.max(((endMin - startMin) / SLOT_MIN) * ROW_PX - 2, 22)

                    return (
                      <div
                        key={block.id}
                        className="absolute left-1 right-1 rounded-md px-2 py-1 text-xs overflow-hidden border border-dashed border-muted-foreground/40 bg-[repeating-linear-gradient(135deg,var(--color-muted)_0px,var(--color-muted)_6px,transparent_6px,transparent_12px)] text-muted-foreground group/block"
                        style={{ top, height }}
                        title={`${block.startTime} – ${block.endTime} · ${blockReasonLabels[block.reason]}${block.note ? ` · ${block.note}` : ""}`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-medium truncate">{blockReasonLabels[block.reason]}</span>
                          {onRemoveBlockedSlot && (
                            <button
                              className="opacity-0 group-hover/block:opacity-100 group-focus-within/block:opacity-100 focus-visible:opacity-100 shrink-0 text-[11px] underline underline-offset-2 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                onRemoveBlockedSlot(block.id)
                              }}
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                        {height > 36 && (
                          <div className="flex items-center gap-1 text-[11px] opacity-90 truncate">
                            <Clock className="w-3 h-3 shrink-0" />
                            {block.startTime} – {block.endTime}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {columnAppointments.map((appointment) => {
                    const startMin = timeStringToMinutes(appointment.time)
                    const durationMin = durationToMinutes(appointment.duration)
                    const top = ((startMin - dayStartMin) / SLOT_MIN) * ROW_PX
                    const height = Math.max((durationMin / SLOT_MIN) * ROW_PX - 4, 22)
                    const isMuted = appointment.status === "cancelled" || appointment.status === "no_show"
                    const isFirstVisit = firstVisitAppointmentIds?.has(appointment.id) ?? false
                    const hasNote = Boolean(appointment.prepNotes || appointment.internalNotes)
                    const appointmentConflicts = conflicts.get(appointment.id)
                    const hasDentistConflict = Boolean(appointmentConflicts?.some((c) => c.kind === "dentist"))
                    const hasResourceConflict = Boolean(appointmentConflicts?.some((c) => c.kind === "resource"))
                    const hasHardConflict = hasDentistConflict || hasResourceConflict
                    const hasBufferOnly = Boolean(appointmentConflicts?.length) && !hasHardConflict
                    const resource = resources.find((r) => r.id === appointment.resourceId)
                    const resourceName = resource?.name
                    const isDraggable =
                      Boolean(onReschedule) &&
                      !["completed", "cancelled", "no_show"].includes(appointment.status)
                    const style = isMuted ? mutedCardStyle : categoryCardStyles[appointment.category]

                    const titleParts = [`${appointment.time} · ${appointment.patientName} · ${appointment.careLabel}`]
                    if (resourceName) titleParts.push(resourceName)
                    if (isFirstVisit) titleParts.push("Nouveau patient")
                    if (appointment.prepNotes) titleParts.push(`Note : ${appointment.prepNotes}`)
                    if (appointment.internalNotes) titleParts.push(`Note interne : ${appointment.internalNotes}`)
                    if (appointmentConflicts?.length) titleParts.push(`Conflit : ${conflictSummary(appointmentConflicts)}`)
                    if (isDraggable) titleParts.push("Flèches haut/bas pour changer l'heure, gauche/droite pour changer de praticien")

                    const a11y = cardA11yProps(titleParts.join(" · "), () => onAppointmentClick?.(appointment))

                    // Keyboard equivalent of the mouse drag-and-drop reschedule
                    // above: arrows move the focused card by one slot (↑/↓) or
                    // to the adjacent practitioner column (←/→), immediately —
                    // same "drop" semantics as the mouse, no separate confirm
                    // step. Delegates Enter/Space to cardA11yProps' own handler
                    // first so opening the detail view still works.
                    const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
                      a11y.onKeyDown(e)
                      if (!isDraggable || !onReschedule) return
                      if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) return
                      e.preventDefault()
                      e.stopPropagation()

                      let newDentistId = practitioner.id
                      let newStart = startMin

                      if (e.key === "ArrowUp") {
                        newStart = startMin - SLOT_MIN
                      } else if (e.key === "ArrowDown") {
                        newStart = startMin + SLOT_MIN
                      } else {
                        const currentIndex = visiblePractitioners.findIndex((p) => p.id === practitioner.id)
                        const nextIndex = e.key === "ArrowLeft" ? currentIndex - 1 : currentIndex + 1
                        if (nextIndex < 0 || nextIndex >= visiblePractitioners.length) return
                        newDentistId = visiblePractitioners[nextIndex].id
                      }

                      newStart = Math.min(Math.max(newStart, dayStartMin), dayEndMin - SLOT_MIN)
                      if (!canPlaceAt(newDentistId, newStart)) return

                      const newTime = minutesToTimeString(newStart)
                      onReschedule(appointment.id, date, newTime, newDentistId)

                      const newPractitioner = visiblePractitioners.find((p) => p.id === newDentistId)
                      setAnnouncement(
                        `${appointment.patientName} déplacé à ${newTime}${
                          newPractitioner ? `, Dr. ${newPractitioner.firstName} ${newPractitioner.lastName}` : ""
                        }`
                      )
                      setPendingFocusId(appointment.id)
                    }

                    return (
                      <div
                        key={appointment.id}
                        data-appointment-id={appointment.id}
                        draggable={isDraggable}
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", appointment.id)
                          e.dataTransfer.effectAllowed = "move"
                          setDraggingId(appointment.id)
                        }}
                        onDragEnd={() => {
                          setDraggingId(null)
                          setDragOverDentistId(null)
                        }}
                        className={cn(
                          "absolute left-1 right-1 rounded-md border border-l-4 pl-2 pr-2 py-1 text-xs overflow-hidden shadow-sm transition-shadow hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                          style.bg,
                          style.border,
                          style.accent,
                          style.text,
                          isMuted && "line-through decoration-muted-foreground/50",
                          isDraggable && "cursor-grab active:cursor-grabbing",
                          !isDraggable && "cursor-pointer",
                          draggingId === appointment.id && "opacity-30",
                          hasHardConflict && "ring-2 ring-red-500 ring-offset-1",
                          hasBufferOnly && "ring-2 ring-amber-400 ring-offset-1"
                        )}
                        style={{ top, height }}
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick?.(appointment)
                        }}
                        title={titleParts.join(" · ")}
                        {...a11y}
                        onKeyDown={handleCardKeyDown}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold truncate flex items-center gap-1 min-w-0">
                            <span className="truncate">{appointment.patientName}</span>
                            {isFirstVisit && (
                              <UserPlus className="w-3 h-3 shrink-0 opacity-80" aria-label="Nouveau patient" />
                            )}
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            {hasDentistConflict && <AlertTriangle className="w-3 h-3 text-red-600" aria-label="Praticien en double réservation" />}
                            {hasResourceConflict &&
                              (resource?.type === "room" ? (
                                <DoorOpen className="w-3 h-3 text-red-600" aria-label="Salle en double réservation" />
                              ) : (
                                <Armchair className="w-3 h-3 text-red-600" aria-label="Fauteuil en double réservation" />
                              ))}
                            {hasBufferOnly && <AlertTriangle className="w-3 h-3 text-amber-600" aria-label="Battement insuffisant" />}
                            {hasNote && <MessageSquareText className={cn("w-3 h-3", style.textMuted)} />}
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full ring-2 ring-background",
                                statusColors[appointment.status]
                              )}
                              title={statusLabels[appointment.status]}
                            />
                          </span>
                        </div>
                        {height > 36 && (
                          <div className={cn("flex items-center gap-1 text-[11px] truncate", style.textMuted, isMuted && "line-through")}>
                            <Clock className="w-3 h-3 shrink-0" />
                            {appointment.time} · {appointment.careLabel}
                          </div>
                        )}
                        {height > 52 && resourceName && (
                          <div
                            className={cn(
                              "flex items-center gap-1 text-[11px] truncate",
                              hasResourceConflict ? "text-red-700 dark:text-red-400 font-medium" : style.textMuted
                            )}
                          >
                            {resource?.type === "room" ? (
                              <DoorOpen className="w-3 h-3 shrink-0" />
                            ) : (
                              <Armchair className="w-3 h-3 shrink-0" />
                            )}
                            {resourceName}
                          </div>
                        )}
                        {height > 52 && appointment.status === "pending" && onCheckIn && (
                          <button
                            className={cn(
                              "mt-1 rounded px-1.5 py-0.5 text-[11px] font-medium bg-background/70 hover:bg-background border shadow-sm cursor-pointer no-underline",
                              style.border,
                              style.text
                            )}
                            onClick={(e) => {
                              e.stopPropagation()
                              onCheckIn(appointment.id)
                            }}
                          >
                            Marquer arrivé
                          </button>
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
