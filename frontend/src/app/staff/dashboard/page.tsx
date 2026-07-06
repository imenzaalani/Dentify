import { useCurrentRole } from "@/lib/rbac"

import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { ChairsSchedule } from "./components/chairs-schedule"
import { CollectionsToday, type CollectionEntry } from "./components/collections-today"
import { DataTable } from "./components/data-table"
import { DoctorPatientMessages } from "./components/doctor-patient-messages"
import { DoctorPendingNotes } from "./components/doctor-pending-notes"
import { DoctorSchedule } from "./components/doctor-schedule"
import { DoctorStatCards } from "./components/doctor-stat-cards"
import { DoctorTreatmentFollowups } from "./components/doctor-treatment-followups"
import { PendingConfirmations } from "./components/pending-confirmations"
import { ReceptionQuickActions } from "./components/reception-quick-actions"
import { ReceptionStatCards } from "./components/reception-stat-cards"
import { RecentInvoices, type InvoiceEntry } from "./components/recent-invoices"
import { SectionCards } from "./components/section-cards"
import { WaitingRoomQueue } from "./components/waiting-room-queue"
import { WaitlistAlerts, type WaitlistAlertEntry } from "./components/waitlist-alerts"

import doctorsData from "./data/doctors-data.json"
import doctorPatientMessagesData from "./data/doctor-patient-messages.json"
import doctorPendingNotesData from "./data/doctor-pending-notes.json"
import doctorScheduleData from "./data/doctor-schedule.json"
import doctorTreatmentFollowupsData from "./data/doctor-treatment-followups.json"
import patientsTableData from "./data/patients-table-data.json"
import recentInvoicesData from "./data/recent-invoices-data.json"
import receptionChairsScheduleData from "./data/reception-chairs-schedule.json"
import receptionCollectionsData from "./data/reception-collections.json"
import receptionPendingData from "./data/reception-pending.json"
import receptionWaitingRoomData from "./data/reception-waiting-room.json"
import receptionWaitlistData from "./data/reception-waitlist.json"
import revenueHistory from "./data/revenue-history.json"
import todaysScheduleData from "./data/todays-schedule.json"

import { resources } from "../planning/data"

export default function Page() {
  const role = useCurrentRole()

  if (role === "receptionist") {
    return <ReceptionDashboard />
  }

  if (role === "dentist") {
    return <DentistDashboard />
  }

  return <PractitionerDashboard />
}

function DentistDashboard() {
  const appointmentCount = doctorScheduleData.length
  const pendingNotesCount = doctorPendingNotesData.length
  const treatmentFollowupCount = doctorTreatmentFollowupsData.length
  const messageCount = doctorPatientMessagesData.length

  return (
    <>
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">
            {appointmentCount} patients today • {pendingNotesCount} notes to finalize •{" "}
            {messageCount} messages awaiting reply
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <DoctorStatCards
          appointmentCount={appointmentCount}
          pendingNotesCount={pendingNotesCount}
          treatmentFollowupCount={treatmentFollowupCount}
          messageCount={messageCount}
        />
      </div>

      <div className="@container/main px-4 lg:px-6 grid gap-6 lg:grid-cols-2">
        <DoctorSchedule entries={doctorScheduleData} />
        <DoctorPendingNotes entries={doctorPendingNotesData} />
      </div>

      <div className="@container/main px-4 lg:px-6 grid gap-6 lg:grid-cols-2">
        <DoctorTreatmentFollowups entries={doctorTreatmentFollowupsData} />
        <DoctorPatientMessages entries={doctorPatientMessagesData} />
      </div>
    </>
  )
}

function PractitionerDashboard() {
  const latestRevenueEntry = revenueHistory[revenueHistory.length - 1]
  const previousRevenueEntry = revenueHistory[revenueHistory.length - 2]
  const activePatientCount = patientsTableData.length
  const todayAppointmentCount = todaysScheduleData.length
  const doctorsOnDuty = doctorsData.filter((doctor) => doctor.status === "Active").length
  const doctorsTotal = doctorsData.length
  const recentInvoices = Array.isArray(recentInvoicesData)
    ? (recentInvoicesData as InvoiceEntry[])
    : []
  const recentInvoiceCount = recentInvoices.length

  const latestRevenueTotal = latestRevenueEntry
    ? latestRevenueEntry.consultations + latestRevenueEntry.treatments
    : 0
  const previousRevenueTotal = previousRevenueEntry
    ? previousRevenueEntry.consultations + previousRevenueEntry.treatments
    : 0
  const revenueTrendPct =
    previousRevenueTotal > 0
      ? ((latestRevenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100
      : 0

  return (
    <>
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {todayAppointmentCount} appointments today • {activePatientCount} active patients • {recentInvoiceCount} recent invoices
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <SectionCards
          todayAppointmentCount={todayAppointmentCount}
          activePatientCount={activePatientCount}
          doctorsOnDuty={doctorsOnDuty}
          doctorsTotal={doctorsTotal}
          revenueLast30Days={latestRevenueTotal}
          revenueTrendPct={revenueTrendPct}
        />
        <ChartAreaInteractive />
      </div>
      <div className="@container/main px-4 lg:px-6 space-y-6">
        <RecentInvoices invoices={recentInvoices} />
      </div>
      <div className="@container/main">
        <DataTable data={patientsTableData} />
      </div>
    </>
  )
}

function ReceptionDashboard() {
  const pendingCount = receptionPendingData.length
  const waitingRoomCount = receptionWaitingRoomData.length
  const amountToCollect = receptionCollectionsData.reduce(
    (sum, entry) => sum + entry.amountDue,
    0
  )
  const waitlistCount = receptionWaitlistData.length

  return (
    <>
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Front Desk</h1>
          <p className="text-muted-foreground">
            {pendingCount} to confirm • {waitingRoomCount} in the waiting room •{" "}
            {amountToCollect.toLocaleString()} TND to collect today
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <ReceptionQuickActions />
        <ReceptionStatCards
          pendingCount={pendingCount}
          waitingRoomCount={waitingRoomCount}
          amountToCollect={amountToCollect}
          waitlistCount={waitlistCount}
        />
      </div>

      <div className="@container/main px-4 lg:px-6 grid gap-6 lg:grid-cols-2">
        <PendingConfirmations entries={receptionPendingData} />
        <WaitingRoomQueue entries={receptionWaitingRoomData} />
      </div>

      <div className="@container/main px-4 lg:px-6">
        <ChairsSchedule resources={resources} entries={receptionChairsScheduleData} />
      </div>

      <div className="@container/main px-4 lg:px-6 grid gap-6 lg:grid-cols-2">
        <CollectionsToday entries={receptionCollectionsData as CollectionEntry[]} />
        <WaitlistAlerts entries={receptionWaitlistData as WaitlistAlertEntry[]} />
      </div>
    </>
  )
}
