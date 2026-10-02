"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { DataTable } from "./components/data-table"
import { PatientStatCards } from "./components/patient-stat-cards"
import type { Patient } from "./components/types"
import type { PatientFormValues } from "./components/patient-form-sheet"
import { patientApi } from "@/lib/api/patients"
import { ApiError } from "@/lib/api/client"

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    patientApi
      .listPatients({ include_archived: true })
      .then((data) => {
        if (!cancelled) setPatients(data)
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load patients")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleAddPatient = async (data: PatientFormValues) => {
    try {
      const newPatient = await patientApi.createPatient({
        first_name: data.firstName,
        last_name: data.lastName,
        dob: data.dob.toISOString().split("T")[0],
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        preferred_contact_method: data.preferredContactMethod ?? null,
        created_via: data.createdVia,
        allergies: data.allergies,
        medical_history: data.medicalHistory || null,
        current_medications: data.currentMedications || null,
        emergency_contact_name: data.emergencyContactName || null,
        emergency_contact_phone: data.emergencyContactPhone || null,
      })
      setPatients((prev) => [newPatient, ...prev])
      toast.success(`${data.firstName} ${data.lastName} was added`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add patient")
      throw err
    }
  }

  const handleArchiveToggle = async (patient: Patient) => {
    const archiving = !patient.archived_at
    try {
      const updated = archiving
        ? await patientApi.archivePatient(patient.id)
        : await patientApi.unarchivePatient(patient.id)
      setPatients((prev) => prev.map((p) => (p.id === patient.id ? updated : p)))
      toast.success(archiving ? "Patient archived" : "Patient unarchived")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Patients{" "}
            <span className="text-muted-foreground font-normal">
              ({patients.length})
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            All patients assigned to you.
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6">
        <PatientStatCards patients={patients} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        <DataTable
          patients={patients}
          isLoading={isLoading}
          onAddPatient={handleAddPatient}
          onArchiveToggle={handleArchiveToggle}
        />
      </div>
    </div>
  )
}