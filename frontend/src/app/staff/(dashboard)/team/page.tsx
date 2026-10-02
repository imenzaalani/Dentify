"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authApi } from "@/lib/api/auth"
import { getAssetUrl } from "@/lib/api/client"
import type { StaffMember } from "@/types/auth"

import { DataTable, type TeamMember } from "./components/data-table"
import { StaffStatCards } from "./components/staff-stat-cards"
import type { StaffFormValues } from "./components/staff-form-sheet"

const generateAvatar = (firstName: string, lastName: string) =>
  `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()

const mapStaffMemberToTeamMember = (member: StaffMember): TeamMember => ({
  id: member.id,
  role: member.role === "dentist" ? "dentist" : "receptionist",
  firstName: member.first_name ?? "",
  lastName: member.last_name ?? "",
  avatar: generateAvatar(member.first_name ?? "", member.last_name ?? ""),
  avatarUrl: getAssetUrl(member.avatar_url),
  email: member.email,
  phone: member.phone ?? undefined,
  specialty: member.dentist_profile?.specialty ?? undefined,
  licenseNumber: member.dentist_profile?.license_number ?? undefined,
  bio: member.dentist_profile?.bio ?? undefined,
  color: member.dentist_profile?.color ?? "#2563eb",
  workingHours: member.dentist_profile?.working_hours?.map((wh) => ({
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

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "dentist" | "receptionist">("all")

  useEffect(() => {
    const loadStaff = async () => {
      try {
        // Fetch both roles in parallel and merge into one list. If your
        // backend supports `authApi.staff.list()` with no role filter
        // returning everyone, you can simplify this to a single call.
        const [dentists, receptionists] = await Promise.all([
          authApi.staff.list("dentist"),
          authApi.staff.list("receptionist"),
        ])
        setMembers([...dentists, ...receptionists].map(mapStaffMemberToTeamMember))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load staff"
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadStaff()
  }, [])

  const resolveSpecialty = (values: StaffFormValues) =>
    values.specialty === "Other" && values.specialtyOther
      ? values.specialtyOther
      : values.specialty

  const handleAddMember = async (values: StaffFormValues) => {
    try {
      let created = await authApi.staff.create({
        email: values.email,
        phone: values.phone ?? undefined,
        first_name: values.firstName,
        last_name: values.lastName,
        role: values.role,
        specialty: values.role === "dentist" ? resolveSpecialty(values) : undefined,
        license_number: values.role === "dentist" ? values.licenseNumber : undefined,
        bio: values.role === "dentist" ? values.bio : values.notes,
        color: values.role === "dentist" ? values.color : undefined,
        working_hours: values.role === "dentist" ? values.workingHours : undefined,
      })

      if (values.avatarFile) {
        created = await authApi.staff.uploadAvatar(created.id, values.avatarFile)
      }

      setMembers((prev) => [mapStaffMemberToTeamMember(created), ...prev])
      const label = values.role === "dentist" ? `Dr. ${values.firstName} ${values.lastName}` : `${values.firstName} ${values.lastName}`
      toast.success(`${label} was added`, {
        description: "Invite sent — they can set up their Dentify account from the email.",
        duration: 5000,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add staff member"
      toast.error(message)
    }
  }

  const handleEditMember = async (id: string, values: StaffFormValues) => {
    try {
      let updated = await authApi.staff.update(id, {
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone ?? undefined,
        specialty: values.role === "dentist" ? resolveSpecialty(values) : undefined,
        license_number: values.role === "dentist" ? values.licenseNumber : undefined,
        bio: values.role === "dentist" ? values.bio : values.notes,
        color: values.role === "dentist" ? values.color : undefined,
        working_hours: values.role === "dentist" ? values.workingHours : undefined,
      })
      if (values.avatarFile) {
        updated = await authApi.staff.uploadAvatar(id, values.avatarFile)
      }

      setMembers((prev) =>
        prev.map((m) => (m.id === id ? mapStaffMemberToTeamMember(updated) : m))
      )
      toast.success("Profile updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update staff member"
      toast.error(message)
    }
  }

  const handleDeleteMember = async (id: string) => {
    try {
      await authApi.staff.delete(id)
      setMembers((prev) => prev.filter((m) => m.id !== id))
      toast.success("Account removed")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove staff member"
      toast.error(message)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await authApi.staff.toggleStatus(id)
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? mapStaffMemberToTeamMember(updated) : m))
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to change status"
      toast.error(message)
    }
  }

  const filteredMembers = useMemo(() => {
    if (activeTab === "all") return members
    return members.filter((m) => m.role === activeTab)
  }, [members, activeTab])

  const dentistCount = members.filter((m) => m.role === "dentist").length
  const receptionistCount = members.filter((m) => m.role === "receptionist").length

  return (
    <div className="flex flex-col gap-6">
      <div className="@container/main px-4 lg:px-6 pt-2 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Staff</h1>
        <p className="text-sm text-muted-foreground">
          Manage doctors and receptionists, their access, and their status.
        </p>
      </div>

      <div className="@container/main px-4 lg:px-6">
        <StaffStatCards members={members} isLoading={isLoading} />
      </div>

      <div className="@container/main px-4 lg:px-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList>
            <TabsTrigger value="all" className="cursor-pointer gap-1.5">
              All
              <span className="text-xs text-muted-foreground data-[state=active]:text-foreground">
                {members.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="dentist" className="cursor-pointer gap-1.5">
              Doctors
              <span className="text-xs text-muted-foreground data-[state=active]:text-foreground">
                {dentistCount}
              </span>
            </TabsTrigger>
            <TabsTrigger value="receptionist" className="cursor-pointer gap-1.5">
              Receptionists
              <span className="text-xs text-muted-foreground data-[state=active]:text-foreground">
                {receptionistCount}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <DataTable
              members={filteredMembers}
              isLoading={isLoading}
              scope={activeTab}
              onAddMember={handleAddMember}
              onEditMember={handleEditMember}
              onDeleteMember={handleDeleteMember}
              onToggleStatus={handleToggleStatus}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}