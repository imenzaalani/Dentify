import {
  type Appointment,
  type Practitioner,
  type Patient,
  type CareType,
  type Resource,
  type WaitlistEntry,
  categoryColors,
} from "./types"

// Import raw JSON
import appointmentsRaw from "./data/appointments.json"
import appointmentDatesRaw from "./data/appointment-dates.json"
import dentistsRaw from "./data/dentists.json"
import patientsRaw from "./data/patients.json"
import careTypesRaw from "./data/care-types.json"
import resourcesRaw from "./data/resources.json"
import waitlistRaw from "./data/waitlist.json"

export const dentists: Practitioner[] = dentistsRaw as Practitioner[]
export const patients: Patient[] = patientsRaw as Patient[]
export const careTypes: CareType[] = careTypesRaw as CareType[]
export const resources: Resource[] = resourcesRaw as Resource[]
export const waitlist: WaitlistEntry[] = waitlistRaw as WaitlistEntry[]

export function findResource(id?: string): Resource | undefined {
  if (!id) return undefined
  return resources.find((r) => r.id === id)
}

function findDentist(id: string): Practitioner {
  return (
    dentists.find((d) => d.id === id) ?? {
      id,
      firstName: "Praticien",
      lastName: "inconnu",
      initials: "?",
      specialty: "",
      color: "bg-gray-400",
      visible: true,
    }
  )
}

function findPatient(id: string): Patient {
  return (
    patients.find((p) => p.id === id) ?? {
      id,
      firstName: "Patient",
      lastName: "inconnu",
      initials: "?",
      phone: "",
    }
  )
}

function findCareType(id: string): CareType {
  return (
    careTypes.find((c) => c.id === id) ?? {
      id,
      name: "Soin",
      category: "soins_courants",
      defaultDuration: "30 min",
      color: "bg-blue-500",
      active: true,
      price: 0,
    }
  )
}

function formatTime(date: Date): string {
  return date
    .toLocaleTimeString("fr-FR", { hour: "numeric", minute: "2-digit" })
    .replace(":00", "h00")
    .replace(":", "h")
}

// Convert JSON appointments into fully joined Appointment objects.
// Always use the current month and year, but preserve day and time from JSON,
// so the demo data always looks "live" relative to today.
export const appointments: Appointment[] = appointmentsRaw.map((raw) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const [dayStr, timeStr] = raw.date.split("T")
  const day = parseInt(dayStr)
  const [hours, minutes] = timeStr.split(":").map(Number)

  const date = new Date(currentYear, currentMonth, day, hours, minutes)

  const patient = findPatient(raw.patientId)
  const dentist = findDentist(raw.dentistId)
  const care = findCareType(raw.careTypeId)

  const appointment: Appointment = {
    id: raw.id,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientInitials: patient.initials,
    dentistId: dentist.id,
    dentistName: `Dr. ${dentist.firstName} ${dentist.lastName}`,
    resourceId: (raw as { resourceId?: string }).resourceId,
    date,
    time: formatTime(date),
    duration: raw.duration,
    careTypeId: care.id,
    careLabel: care.name,
    category: care.category,
    status: raw.status as Appointment["status"],
    color: categoryColors[care.category],
    prepNotes: raw.prepNotes,
    internalNotes: raw.internalNotes,
    sendConfirmation: raw.sendConfirmation,
    cancellationReason: (raw as { cancellationReason?: string }).cancellationReason,
  }

  return appointment
})

// Convert appointment dates for the mini calendar picker - same current month/year shift
export const appointmentDates = appointmentDatesRaw.map((item) => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  const day = parseInt(item.date.split("T")[0])
  const date = new Date(currentYear, currentMonth, day)

  return { date, count: item.count }
})