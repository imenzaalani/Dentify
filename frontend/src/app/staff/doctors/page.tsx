"use client"

import { useState } from "react"
import { toast } from "sonner"

import { DataTable, type Doctor } from "./components/data-table"
import { DoctorStatCards } from "./components/doctor-stat-cards"
import type { DoctorFormValues } from "./components/doctor-form-sheet"

import initialDoctorsData from "./data.json"

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctorsData as Doctor[])

  const generateAvatar = (firstName: string, lastName: string) => {
    return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
  }

  const resolveSpecialty = (values: DoctorFormValues) =>
    values.specialty === "Other" && values.specialtyOther
      ? values.specialtyOther
      : values.specialty

  const handleAddDoctor = (values: DoctorFormValues) => {
    const newDoctor: Doctor = {
      id: Math.max(0, ...doctors.map((d) => d.id)) + 1,
      firstName: values.firstName,
      lastName: values.lastName,
      avatar: generateAvatar(values.firstName, values.lastName),
      email: values.email,
      specialty: resolveSpecialty(values),
      licenseNumber: values.licenseNumber,
      bio: values.bio,
      color: values.color,
      workingHours: values.workingHours,
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
      lastLogin: undefined,
    }
    setDoctors((prev) => [newDoctor, ...prev])
    toast.success(`Dr. ${values.firstName} ${values.lastName} was added`, {
      description: "An invitation email with a password setup link was sent.",
    })
  }

  const handleEditDoctor = (id: number, values: DoctorFormValues) => {
    setDoctors((prev) =>
      prev.map((doctor) =>
        doctor.id === id
          ? {
              ...doctor,
              firstName: values.firstName,
              lastName: values.lastName,
              avatar: generateAvatar(values.firstName, values.lastName),
              email: values.email,
              specialty: resolveSpecialty(values),
              licenseNumber: values.licenseNumber,
              bio: values.bio,
              color: values.color,
              workingHours: values.workingHours,
            }
          : doctor
      )
    )
    toast.success("Doctor profile updated")
  }

  const handleDeleteDoctor = (id: number) => {
    setDoctors((prev) => prev.filter((doctor) => doctor.id !== id))
  }

  const handleToggleStatus = (id: number) => {
    setDoctors((prev) =>
      prev.map((doctor) =>
        doctor.id === id
          ? { ...doctor, status: doctor.status === "Active" ? "Inactive" : "Active" }
          : doctor
      )
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <DoctorStatCards doctors={doctors} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">
        <DataTable
          doctors={doctors}
          onAddDoctor={handleAddDoctor}
          onEditDoctor={handleEditDoctor}
          onDeleteDoctor={handleDeleteDoctor}
          onToggleStatus={handleToggleStatus}
        />
      </div>
    </div>
  )
}
