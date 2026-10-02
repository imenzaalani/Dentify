"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { appointmentApi } from "@/lib/api/appointments"
import { authApi } from "@/lib/api/auth"
import { patientApi } from "@/lib/api/patients"
import { careTypeApi } from "@/lib/api/care-types"
import { resourceApi } from "@/lib/api/resources"
import { waitlistApi } from "@/lib/api/waitlist"
import { ApiError } from "@/lib/api/client"

import { Planning } from "./components/planning"
import { PlanningSkeleton } from "./components/planning-skeleton"
import { buildAppointmentDates, buildAppointments, buildWaitlist, mapCareType, mapDentist, mapPatient, mapResource } from "./data"
import { type Appointment, type CareType, type Patient, type Practitioner, type Resource, type WaitlistEntry } from "./types"

export default function PlanningPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [dentists, setDentists] = useState<Practitioner[]>([])
  const [careTypes, setCareTypes] = useState<CareType[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [patientsRes, staffRes, careTypesRes, resourcesRes] = await Promise.all([
          patientApi.listPatients(),
          authApi.staff.list("dentist"),
          careTypeApi.listCareTypes(),
          resourceApi.listResources(),
        ])

        const mappedPatients = patientsRes.map(mapPatient)
        const mappedDentists = staffRes.map(mapDentist)
        const mappedCareTypes = careTypesRes.map(mapCareType)
        const mappedResources = resourcesRes.map(mapResource)

        const [appointmentsRes, waitlistRes] = await Promise.all([
          appointmentApi.listAppointments(),
          waitlistApi.listWaitlist(),
        ])
        const mappedAppointments = buildAppointments(appointmentsRes, {
          patients: mappedPatients,
          dentists: mappedDentists,
          careTypes: mappedCareTypes,
        })
        const mappedWaitlist = buildWaitlist(waitlistRes, { patients: mappedPatients })

        if (cancelled) return
        setPatients(mappedPatients)
        setDentists(mappedDentists)
        setCareTypes(mappedCareTypes)
        setResources(mappedResources)
        setAppointments(mappedAppointments)
        setWaitlist(mappedWaitlist)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof ApiError ? err.message : "Impossible de charger le planning"
        setError(message)
        toast.error(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const appointmentDates = useMemo(() => buildAppointmentDates(appointments), [appointments])

  if (loading) {
    return <PlanningSkeleton />
  }

  if (error) {
    return <div className="px-4 py-8 text-sm text-destructive lg:px-6">{error}</div>
  }

  return (
    <div className="px-4 lg:px-6">
      <Planning
        appointments={appointments}
        appointmentDates={appointmentDates}
        practitioners={dentists}
        patients={patients}
        careTypes={careTypes}
        resources={resources}
        waitlist={waitlist}
      />
    </div>
  )
}