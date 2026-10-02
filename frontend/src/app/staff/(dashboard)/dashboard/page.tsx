"use client"

import { useCurrentRole } from "@/lib/rbac"

import { ChartAreaInteractive } from "./components/chart-area-interactive"
import { ChairsSchedule, type ChairScheduleEntry } from "./components/chairs-schedule"
import { CollectionsToday, type CollectionEntry } from "./components/collections-today"
import { DataTable } from "./components/data-table"
import { DoctorPatientMessages } from "./components/doctor-patient-messages"
import { DoctorPendingNotes } from "./components/doctor-pending-notes"
import { DoctorSchedule, type DoctorScheduleEntry } from "./components/doctor-schedule"
import { DoctorStatCards } from "./components/doctor-stat-cards"
import { DoctorTreatmentFollowups } from "./components/doctor-treatment-followups"
import { PendingConfirmations, type PendingConfirmationEntry } from "./components/pending-confirmations"
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
import receptionWaitingRoomData from "./data/reception-waiting-room.json"
import revenueHistory from "./data/revenue-history.json"
import todaysScheduleData from "./data/todays-schedule.json"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { resourceApi } from "@/lib/api/resources"
import { patientApi } from "@/lib/api/patients"
import { authApi } from "@/lib/api/auth"
import { careTypeApi } from "@/lib/api/care-types"
import { appointmentApi } from "@/lib/api/appointments"
import { invoiceApi } from "@/lib/api/invoices"
import { waitlistApi } from "@/lib/api/waitlist"
import { ApiError } from "@/lib/api/client"
import { mapResource } from "../planning/data"
import type { Resource } from "../planning/types"
import type { Patient as PatientRow } from "./schemas/patient-schema"
import {
  buildChairScheduleEntries,
  buildCollectionEntries,
  buildPatientTableRows,
  buildPendingConfirmationEntries,
  buildRecentInvoiceEntries,
  buildWaitlistAlertEntries,
  toDayParam,
} from "./dashboard-data"

function dashboardErrorMessage(err: unknown): string | undefined {
  return err instanceof ApiError || err instanceof Error ? err.message : undefined
}

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

// Still mock — there's no notes/messages backend yet and no staff-listing
// endpoint wired here, so this view has nothing real to switch to yet.
function DentistDashboard() {
  const appointmentCount = doctorScheduleData.length
  const pendingNotesCount = doctorPendingNotesData.length
  const treatmentFollowupCount = doctorTreatmentFollowupsData.length
  const messageCount = doctorPatientMessagesData.length
  const doctorScheduleEntries: DoctorScheduleEntry[] = doctorScheduleData as DoctorScheduleEntry[]

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
        <DoctorSchedule entries={doctorScheduleEntries} />
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
  // Revenue chart and today/doctors-on-duty counts stay mock for now — no
  // revenue time-series or staff-on-duty endpoint wired into this view yet.
  const latestRevenueEntry = revenueHistory[revenueHistory.length - 1]
  const previousRevenueEntry = revenueHistory[revenueHistory.length - 2]
  const todayAppointmentCount = todaysScheduleData.length
  const doctorsOnDuty = doctorsData.filter((doctor) => doctor.status === "Active").length
  const doctorsTotal = doctorsData.length

  const [activePatientCount, setActivePatientCount] = useState(0)
  const [patientRows, setPatientRows] = useState<PatientRow[]>([])
  const [recentInvoices, setRecentInvoices] = useState<InvoiceEntry[]>([])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      patientApi.listPatients(),
      appointmentApi.listAppointments(),
      invoiceApi.listInvoices(),
      authApi.staff.list("dentist"),
      careTypeApi.listCareTypes(),
    ])
      .then(([patients, appointments, invoices, dentists, careTypes]) => {
        if (cancelled) return
        setActivePatientCount(patients.length)
        setPatientRows(buildPatientTableRows(patients, appointments, invoices, dentists, careTypes))
        setRecentInvoices(buildRecentInvoiceEntries(invoices))
      })
      .catch((err) => {
        if (cancelled) return
        toast.error("Impossible de charger le tableau de bord", { description: dashboardErrorMessage(err) })
      })

    return () => {
      cancelled = true
    }
  }, [])

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
        <DataTable data={patientRows} />
      </div>
    </>
  )
}

function ReceptionDashboard() {
  const [resources, setResources] = useState<Resource[]>([])
  const [pendingConfirmations, setPendingConfirmations] = useState<PendingConfirmationEntry[]>([])
  const [chairEntries, setChairEntries] = useState<ChairScheduleEntry[]>([])
  const [collections, setCollections] = useState<CollectionEntry[]>([])
  const [waitlistAlerts, setWaitlistAlerts] = useState<WaitlistAlertEntry[]>([])

  useEffect(() => {
    let cancelled = false
    resourceApi
      .listResources()
      .then((res) => {
        if (!cancelled) setResources(res.map(mapResource))
      })
      .catch(() => {
        // ChairsSchedule just renders with an empty list on failure — this
        // widget isn't critical enough to block the whole dashboard
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      patientApi.listPatients(),
      authApi.staff.list("dentist"),
      careTypeApi.listCareTypes(),
      appointmentApi.listAppointments({ day: toDayParam(new Date()) }),
      invoiceApi.listInvoices(),
      waitlistApi.listWaitlist({ status: "waiting" }),
    ])
      .then(([patients, dentists, careTypes, todaysAppointments, invoices, waitlist]) => {
        if (cancelled) return
        setPendingConfirmations(buildPendingConfirmationEntries(todaysAppointments, patients, dentists, careTypes))
        setChairEntries(buildChairScheduleEntries(todaysAppointments, patients, dentists))
        setCollections(buildCollectionEntries(invoices))
        setWaitlistAlerts(buildWaitlistAlertEntries(waitlist, patients, careTypes))
      })
      .catch((err) => {
        if (cancelled) return
        toast.error("Impossible de charger le tableau de bord", { description: dashboardErrorMessage(err) })
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Waiting room stays mock — no check-in/waiting-room state tracked on the
  // backend yet, just arrived/confirmed appointment statuses.
  const waitingRoomCount = receptionWaitingRoomData.length

  const pendingCount = pendingConfirmations.length
  const amountToCollect = collections.reduce((sum, entry) => sum + entry.amountDue, 0)
  const waitlistCount = waitlistAlerts.length

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
        <PendingConfirmations
          entries={pendingConfirmations}
          onConfirmed={(id) => setPendingConfirmations((prev) => prev.filter((e) => e.id !== id))}
          onDeclined={(id) => setPendingConfirmations((prev) => prev.filter((e) => e.id !== id))}
        />
        <WaitingRoomQueue entries={receptionWaitingRoomData} />
      </div>

      <div className="@container/main px-4 lg:px-6">
        <ChairsSchedule resources={resources} entries={chairEntries} />
      </div>

      <div className="@container/main px-4 lg:px-6 grid gap-6 lg:grid-cols-2">
        <CollectionsToday entries={collections} />
        <WaitlistAlerts
          entries={waitlistAlerts}
          onContacted={(id) => setWaitlistAlerts((prev) => prev.filter((e) => e.id !== id))}
        />
      </div>
    </>
  )
}
