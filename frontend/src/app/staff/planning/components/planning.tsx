"use client"

import { PlanningSidebar } from "./planning-sidebar"
import { PlanningMain } from "./planning-main"
import { AppointmentForm } from "./appointment-form"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { type Appointment, type Practitioner, type Patient, type CareType, type Resource, type WaitlistEntry } from "../types"
import { usePlanning } from "../use-planning"

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
  const planning = usePlanning(appointments)

  return (
    <>
      <div className="border rounded-lg bg-background relative">
        <div className="flex min-h-[800px]">
          {/* Desktop Sidebar */}
          <div className="hidden xl:block w-80 flex-shrink-0 border-r">
            <PlanningSidebar
              selectedDate={planning.selectedDate}
              onDateSelect={planning.handleDateSelect}
              onBlockSlot={planning.handleBlockSlot}
              onNewAppointment={planning.handleNewAppointment}
              appointmentDates={appointmentDates}
              practitioners={practitioners}
              className="h-full"
            />
          </div>

          {/* Main Planning Panel */}
          <div className="flex-1 min-w-0">
            <PlanningMain
              selectedDate={planning.selectedDate}
              onDateSelect={planning.handleDateSelect}
              onMenuClick={() => planning.setShowPlanningSheet(true)}
              appointments={planning.appointments}
              onAppointmentClick={planning.handleEditAppointment}
              onCheckIn={planning.handleCheckIn}
              waitlistEntries={waitlist}
              careTypes={careTypes}
              patients={patients}
              onAddToWaitlist={() => undefined}
              onMarkWaitlistContacted={() => undefined}
              onScheduleFromWaitlist={() => undefined}
              onRemoveFromWaitlist={() => undefined}
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
              onNewAppointment={planning.handleNewAppointment}
              appointmentDates={appointmentDates}
              practitioners={practitioners}
              className="h-full"
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Appointment Form Dialog */}
      <AppointmentForm
        appointment={planning.editingAppointment}
        open={planning.showAppointmentForm}
        onOpenChange={planning.setShowAppointmentForm}
        onSave={planning.handleSaveAppointment}
        onCancel={planning.handleCancelAppointment}
        onMarkCompleted={planning.handleMarkCompleted}
        onMarkNoShow={planning.handleMarkNoShow}
        onCheckIn={planning.handleCheckIn}
        patients={patients}
        dentists={practitioners}
        careTypes={careTypes}
        resources={resources}
      />
    </>
  )
}
