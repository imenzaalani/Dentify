"use client"

import { useState } from "react"
import { toast } from "sonner"

import { DataTable, type Patient } from "./components/data-table"
import { PatientStatCards } from "./components/patient-stat-cards"
import type { PatientFormValues } from "./components/patient-form-sheet"

import initialPatientsData from "./data.json"

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(
    initialPatientsData as Patient[]
  )

  const generateAvatar = (firstName: string, lastName: string) => {
    return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  }

  const handleAddPatient = (data: PatientFormValues) => {
    const newPatient: Patient = {
      id: Math.max(0, ...patients.map((p) => p.id)) + 1,
      firstName: data.firstName,
      lastName: data.lastName,
      avatar: generateAvatar(data.firstName, data.lastName),
      phone: data.phone,
      phoneSecondary: data.phoneSecondary,
      email: data.email ?? "",
      address: data.address,
      dob: data.dob.toISOString().split("T")[0],
      gender: data.gender,
      bloodType: data.bloodType,
      allergies: data.allergies,
      chronicConditions: data.chronicConditions,
      currentMedications: data.currentMedications,
      medicalHistory: data.medicalHistory,
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      lastAppointment: null,
      nextAppointment: null,
      activeTreatment: { active: false },
      accountStatus: data.createAccount ? "active" : "no_account",
      status: "Active",
      patientStatus: "new",
      preferredChannel: "whatsapp",
      createdAt: new Date().toISOString().split("T")[0],
    }
    setPatients((prev) => [newPatient, ...prev])
    toast.success(`${data.firstName} ${data.lastName} was added`, {
      description: data.createAccount
        ? "An activation email invite was sent."
        : undefined,
    })
  }

  const handleArchivePatient = (id: number) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const nowArchived = p.status === "Active"
        return {
          ...p,
          status: nowArchived ? "Archived" : "Active",
          // Keep the lifecycle status in sync with the archive toggle;
          // unarchiving falls back to "active" rather than guessing lead/recall/etc.
          patientStatus: nowArchived ? "archived" : "active",
        }
      })
    )
  }

  const handleChangePatientStatus = (id: number, patientStatus: Patient["patientStatus"]) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        return {
          ...p,
          patientStatus,
          // Keep the archive toggle in sync with the lifecycle status —
          // see handleArchivePatient, which does the same in reverse.
          status: patientStatus === "archived" ? "Archived" : "Active",
        }
      })
    )
  }

  const handleCreateAppointment = (
    patientId: number,
    appointment: { date: string; type: string }
  ) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, nextAppointment: appointment } : p
      )
    )
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
            All active patients assigned to you.
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6">
        <PatientStatCards patients={patients} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        <DataTable
          patients={patients}
          onAddPatient={handleAddPatient}
          onArchivePatient={handleArchivePatient}
          onChangePatientStatus={handleChangePatientStatus}
          onCreateAppointment={handleCreateAppointment}
        />
      </div>
    </div>
  )
}