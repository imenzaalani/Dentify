"use client"

import * as React from "react"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppointmentRow, type Appointment } from "./components/appointment-row"
import { BookAppointmentDialog } from "./components/book-appointment-dialog"

import appointmentsData from "./data.json"

export default function PatientAppointmentsPage() {
  const { minCancelNoticeHours, appointments: initialAppointments } = appointmentsData as {
    minCancelNoticeHours: number
    appointments: Appointment[]
  }

  const [appointments, setAppointments] = React.useState<Appointment[]>(initialAppointments)

  const upcoming = appointments
    .filter((a) => a.status === "confirmed" || a.status === "pending")
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

  const past = appointments
    .filter((a) => a.status === "completed" || a.status === "cancelled")
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))

  const handleCancel = (id: string) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a))
    )
    toast("Appointment cancelled", {
      description: "The clinic has been notified.",
    })
  }

  const handleBook = (values: {
    date: string
    time: string
    type: string
    practitioner: string
  }) => {
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      status: "pending",
      ...values,
    }
    setAppointments((prev) => [...prev, newAppointment])
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Appointments</h1>
          <p className="text-sm text-muted-foreground">
            Manage upcoming visits or review your appointment history.
          </p>
        </div>
        <BookAppointmentDialog onBook={handleBook} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="flex flex-col gap-3 pt-4">
            {upcoming.length === 0 ? (
              <div className="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No upcoming appointments.
              </div>
            ) : (
              upcoming.map((a) => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
                  minCancelNoticeHours={minCancelNoticeHours}
                  onCancel={handleCancel}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="flex flex-col gap-3 pt-4">
            {past.length === 0 ? (
              <div className="flex min-h-[150px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No past appointments yet.
              </div>
            ) : (
              past.map((a) => (
                <AppointmentRow
                  key={a.id}
                  appointment={a}
                  minCancelNoticeHours={minCancelNoticeHours}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}