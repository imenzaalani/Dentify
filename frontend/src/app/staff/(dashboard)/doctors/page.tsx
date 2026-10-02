"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { authApi } from "@/lib/api/auth"
import { getAssetUrl } from "@/lib/api/client"
import type { StaffMember } from "@/types/auth"

import { DataTable, type Doctor } from "./components/data-table"
import { DoctorStatCards } from "./components/doctor-stat-cards"
import type { DoctorFormValues } from "./components/doctor-form-sheet"

const generateAvatar = (firstName: string, lastName: string) => {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()
}

const mapStaffMemberToDoctor = (member: StaffMember): Doctor => ({
  id: member.id,
  firstName: member.first_name ?? "",
  lastName: member.last_name ?? "",
  avatar: generateAvatar(member.first_name ?? "", member.last_name ?? ""),
  avatarUrl: getAssetUrl(member.avatar_url),
  email: member.email,
  phone: member.phone ?? undefined,
  specialty: member.dentist_profile?.specialty ?? "General",
  licenseNumber: member.dentist_profile?.license_number ?? "",
  bio: member.dentist_profile?.bio ?? undefined,
  color: member.dentist_profile?.color ?? "#2563eb",
  workingHours: (member.dentist_profile?.working_hours ?? []).map((wh) => ({
    day: wh.day,
    start: wh.start ?? undefined,
    end: wh.end ?? undefined,
    off: Boolean(wh.off),
  })),
  status: member.is_active ? "Active" : "Inactive",
  createdAt: member.created_at ? new Date(member.created_at).toISOString().split("T")[0] : "",
  lastLogin: undefined,
  isVerified: member.is_verified,
})

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const staff = await authApi.staff.list("dentist")
        setDoctors(staff.map(mapStaffMemberToDoctor))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load doctors"
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadDoctors()
  }, [])

  const resolveSpecialty = (values: DoctorFormValues) =>
    values.specialty === "Other" && values.specialtyOther
      ? values.specialtyOther
      : values.specialty

  const handleAddDoctor = async (values: DoctorFormValues) => {
    try {
      let created = await authApi.staff.create({
        email: values.email,
        phone: values.phone ?? undefined,
        first_name: values.firstName,
        last_name: values.lastName,
        role: "dentist",
        specialty: resolveSpecialty(values),
        license_number: values.licenseNumber,
        bio: values.bio,
        color: values.color,
        working_hours: values.workingHours,
      })

      if (values.avatarFile) {
        created = await authApi.staff.uploadAvatar(created.id, values.avatarFile)
      }

      setDoctors((prev) => [mapStaffMemberToDoctor(created), ...prev])
      toast.success(`Dr. ${values.firstName} ${values.lastName} was added`, {
        description: "Invite sent — they can set up their Dentify account from the email.",
        duration: 5000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add doctor"
      toast.error(message)
    }
  }

  const handleEditDoctor = async (id: string, values: DoctorFormValues) => {
    try {
      let updated = await authApi.staff.update(id, {
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone ?? undefined,
        specialty: resolveSpecialty(values),
        license_number: values.licenseNumber,
        bio: values.bio,
        color: values.color,
        working_hours: values.workingHours,
      })
      if (values.avatarFile) {
        updated = await authApi.staff.uploadAvatar(id, values.avatarFile)
      }

      setDoctors((prev) => prev.map((doctor) => (doctor.id === id ? mapStaffMemberToDoctor(updated) : doctor)))
      toast.success("Doctor profile updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update doctor"
      toast.error(message)
    }
  }

  const handleDeleteDoctor = async (id: string) => {
    try {
      await authApi.staff.delete(id)
      setDoctors((prev) => prev.filter((doctor) => doctor.id !== id))
      toast.success("Doctor account removed")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove doctor"
      toast.error(message)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await authApi.staff.toggleStatus(id)
      setDoctors((prev) => prev.map((doctor) => (doctor.id === id ? mapStaffMemberToDoctor(updated) : doctor)))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to change doctor status"
      toast.error(message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <DoctorStatCards doctors={doctors} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">
        <DataTable
          doctors={doctors}
          isLoading={isLoading}
          onAddDoctor={handleAddDoctor}
          onEditDoctor={handleEditDoctor}
          onDeleteDoctor={handleDeleteDoctor}
          onToggleStatus={handleToggleStatus}
        />
      </div>
    </div>
  )
}
