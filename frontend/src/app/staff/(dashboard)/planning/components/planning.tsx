"use client"

import { useCallback, useMemo, useState } from "react"

import { PlanningSidebar } from "./planning-sidebar"
import { PlanningMain } from "./planning-main"
import { AppointmentForm } from "./appointment-form"
import { BlockSlotDialog } from "./block-slot-dialog"
import { ReservationDetailPanel } from "./reservation-detail-panel"
import { MedicalCheckupWizard } from "./medical-checkup-wizard"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { type Appointment, type Practitioner, type Patient, type CareType, type Resource, type WaitlistEntry, type PlanningViewMode } from "../types"
import type { MedicalCheckup } from "@/types/dental"
import { usePlanning } from "../use-planning"
import { useWaitlist } from "../use-waitlist"
import { usePractitionerVisibility } from "../use-practitioner-visibility"

interface PlanningProps {
  appointments: Appointment[]
  appointmentDates: Array<{ date: Date; count: number }>
  practitioners: Practitioner[]
  patients: Patient[]
  careTypes: CareType[]
  resources: Resource[]
  waitlist: WaitlistEntry[]
}

export function Planning({ appointments, appointmentDates, practitioners, patients, careTypes, resources, waitlist }: PlanningProps) {
  // Tracks which waitlist entry (if any) the appointment form is currently
  // being opened for, so a successful save can link the two records back
  // together via waitlistApi.scheduleEntry.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [viewMode, setViewMode] = useState<PlanningViewMode>("day")
  const [schedulingEntryId, setSchedulingEntryId] = useState<string | null>(null)
  // The reservation panel tracks the appointment by id, not the object
  // itself — so once the underlying appointment list updates (e.g. after
  // check-in or completion), the panel reflects the new status instead of
  // showing a stale snapshot from the moment it was opened.
  const [reservationAppointmentId, setReservationAppointmentId] = useState<string | null>(null)
  const [checkupWizardOpen, setCheckupWizardOpen] = useState(false)
  // Keyed by appointmentId rather than a single "current checkup" slot, so
  // switching between reservations (or reopening one) doesn't need a
  // re-fetch — the panel's "Complété" / "En cours" badge reflects whatever
  // was last saved for that specific appointment.
  const [checkupByAppointment, setCheckupByAppointment] = useState<Record<string, MedicalCheckup>>({})
  const [prefill, setPrefill] = useState<{
    patientId?: string
    patientName?: string
    careTypeId?: string
    date?: Date
    time?: string
    dentistId?: string
  } | null>(null)

  const waitlistState = useWaitlist(waitlist, { patients })
  // Which practitioners are shown in the sidebar/day view — kept separate
  // from `practitioners` (still passed as-is to the appointment/block-slot
  // forms) so hiding a dentist from the visual planner doesn't stop staff
  // from booking them.
  const visibility = usePractitionerVisibility(practitioners)

  const planning = usePlanning(appointments, { patients, dentists: practitioners, careTypes }, {
    onCreated: (appointment) => {
      if (schedulingEntryId) {
        waitlistState.handleScheduled(schedulingEntryId, appointment.id)
        setSchedulingEntryId(null)
        setPrefill(null)
      }
    },
  })

  const handleNewAppointment = useCallback(() => {
    setSchedulingEntryId(null)
    setPrefill(null)
    planning.handleNewAppointment()
  }, [planning])

  const handleOpenReservation = useCallback((appointment: Appointment) => {
    setReservationAppointmentId(appointment.id)
  }, [])

  const handleReservationOpenChange = useCallback((open: boolean) => {
    if (!open) setReservationAppointmentId(null)
  }, [])

  // The panel's own "Modifier" pencil hands off to the real edit form —
  // close the panel first so the two don't stack.
  const handleEditFromReservation = useCallback(
    (appointment: Appointment) => {
      setReservationAppointmentId(null)
      planning.handleEditAppointment(appointment)
    },
    [planning]
  )

  const handleOpenCheckup = useCallback(() => {
    setCheckupWizardOpen(true)
  }, [])

  const handleCheckupSaved = useCallback((checkup: MedicalCheckup) => {
    setCheckupByAppointment((prev) => ({ ...prev, [checkup.appointment_id]: checkup }))
  }, [])

  const handleScheduleFromWaitlist = useCallback(
    (entry: WaitlistEntry) => {
      setSchedulingEntryId(entry.id)
      setPrefill({ patientId: entry.patientId, patientName: entry.patientName, careTypeId: entry.careTypeId })
      planning.handleNewAppointment()
    },
    [planning]
  )

  const handleSlotClick = useCallback(
    (date: Date, time: string, dentistId: string) => {
      setSchedulingEntryId(null)
      setPrefill({ date, time, dentistId })
      planning.handleNewAppointment()
    },
    [planning]
  )

  const handleFormOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setSchedulingEntryId(null)
        setPrefill(null)
      }
      planning.setShowAppointmentForm(open)
    },
    [planning]
  )

  const handleViewWaitlist = useCallback(() => {
    setViewMode("waitlist")
    planning.setShowPlanningSheet(false)
  }, [planning])

  const reservationAppointment = useMemo(
    () => planning.appointments.find((a) => a.id === reservationAppointmentId) ?? null,
    [planning.appointments, reservationAppointmentId]
  )
  const reservationCareType = careTypes.find((c) => c.id === reservationAppointment?.careTypeId)
  // Heuristic until `CareType.requiresCheckup` exists on the backend: only
  // routine care skips the gate. Revisit once that field lands — see the
  // architecture notes for the medical-checkup wizard.
  const reservationRequiresCheckup: boolean =
    !!reservationCareType && reservationCareType.category !== "soins_courants"
  const reservationCheckup = reservationAppointmentId
    ? checkupByAppointment[reservationAppointmentId]
    : undefined
  const reservationCheckupStatus = reservationCheckup?.status ?? "not_started"

  return (
    <>
      <div className="planning-shell border rounded-lg bg-background relative">
        <div className="planning-shell-row flex min-h-[800px]">
          {/* Desktop Sidebar */}
          <div
            className={`hidden xl:block flex-shrink-0 overflow-hidden print:hidden transition-[width] duration-200 ${
              sidebarCollapsed ? "w-0" : "w-80 border-r"
            }`}
          >
            <PlanningSidebar
              selectedDate={planning.selectedDate}
              onDateSelect={planning.handleDateSelect}
              onBlockSlot={planning.handleBlockSlot}
              onNewAppointment={handleNewAppointment}
              appointmentDates={appointmentDates}
              practitioners={visibility.practitioners}
              onPractitionerToggle={visibility.toggleVisibility}
              waitlistEntries={waitlistState.entries}
              careTypes={careTypes}
              onViewWaitlist={handleViewWaitlist}
              className="h-full"
            />
          </div>

          {/* Main Planning Panel */}
          <div className="planning-shell-main flex-1 min-w-0">
            <PlanningMain
              selectedDate={planning.selectedDate}
              onDateSelect={planning.handleDateSelect}
              onMenuClick={() => planning.setShowPlanningSheet(true)}
              appointments={planning.appointments}
              blockedSlots={planning.blockedSlots}
              onOpenReservation={handleOpenReservation}
              onCheckIn={planning.handleCheckIn}
              onMarkCompleted={planning.handleMarkCompleted}
              onMarkNoShow={planning.handleMarkNoShow}
              onCancelAppointment={planning.handleCancelAppointment}
              onRemoveBlockedSlot={planning.handleRemoveBlockedSlot}
              onReschedule={planning.handleRescheduleAppointment}
              waitlistEntries={waitlistState.entries}
              careTypes={careTypes}
              patients={patients}
              practitioners={visibility.practitioners}
              resources={resources}
              onAddToWaitlist={waitlistState.handleAdd}
              onMarkWaitlistContacted={waitlistState.handleMarkContacted}
              onScheduleFromWaitlist={handleScheduleFromWaitlist}
              onRemoveFromWaitlist={waitlistState.handleRemove}
              onSlotClick={handleSlotClick}
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        </div>

        {/* Mobile/Tablet Sheet */}
        <Sheet open={planning.showPlanningSheet} onOpenChange={planning.setShowPlanningSheet}>
          <SheetContent side="left" className="w-80 p-0" style={{ position: "absolute" }}>
            <SheetHeader className="p-4 pb-2">
              <SheetTitle>Planning</SheetTitle>
              <SheetDescription>Parcourez les dates et gérez les rendez-vous</SheetDescription>
            </SheetHeader>
            <PlanningSidebar
              selectedDate={planning.selectedDate}
              onDateSelect={planning.handleDateSelect}
              onBlockSlot={planning.handleBlockSlot}
              onNewAppointment={handleNewAppointment}
              appointmentDates={appointmentDates}
              practitioners={visibility.practitioners}
              onPractitionerToggle={visibility.toggleVisibility}
              waitlistEntries={waitlistState.entries}
              careTypes={careTypes}
              onViewWaitlist={handleViewWaitlist}
              className="h-full"
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Block Slot Dialog */}
      <BlockSlotDialog
        open={planning.showBlockSlotForm}
        onOpenChange={planning.setShowBlockSlotForm}
        practitioners={practitioners}
        defaultDate={planning.selectedDate}
        onSave={planning.handleSaveBlockedSlot}
      />

      {/* Appointment Form Dialog */}
      <AppointmentForm
        appointment={planning.editingAppointment}
        open={planning.showAppointmentForm}
        onOpenChange={handleFormOpenChange}
        onSave={planning.handleSaveAppointment}
        onSaveRecurring={planning.handleSaveRecurringAppointment}
        onCancel={planning.handleCancelAppointment}
        onCancelSeries={planning.handleCancelSeries}
        onMarkCompleted={planning.handleMarkCompleted}
        onMarkNoShow={planning.handleMarkNoShow}
        onCheckIn={planning.handleCheckIn}
        patients={patients}
        dentists={practitioners}
        careTypes={careTypes}
        resources={resources}
        appointments={planning.appointments}
        prefill={prefill}
      />

      {/* Reservation Detail Panel — opened from any appointment click;
          hands off to the edit form / clinical flows above as needed. */}
      <ReservationDetailPanel
        appointment={reservationAppointment}
        open={reservationAppointmentId !== null}
        onOpenChange={handleReservationOpenChange}
        careTypes={careTypes}
        dentists={practitioners}
        requiresCheckup={reservationRequiresCheckup}
        checkupStatus={reservationCheckupStatus}
        medicalRecordStatus="not_started"
        onEdit={handleEditFromReservation}
        onCheckIn={planning.handleCheckIn}
        onMarkNoShow={planning.handleMarkNoShow}
        onCancel={(id) => planning.handleCancelAppointment(id)}
        onOpenCheckup={handleOpenCheckup}
        onFinish={planning.handleMarkCompleted}
      />

      {/* Bilan médical — opened from the panel's "Bilan médical" row.
          medical-record-form.tsx (the other clinical sub-flow) isn't built
          yet, so onOpenMedicalRecord above stays unwired for now. */}
      {reservationAppointment && (
        <MedicalCheckupWizard
          open={checkupWizardOpen}
          onOpenChange={setCheckupWizardOpen}
          appointmentId={reservationAppointment.id}
          patientId={reservationAppointment.patientId}
          existingCheckup={reservationCheckup ?? null}
          onSaved={handleCheckupSaved}
        />
      )}
    </>
  )
}