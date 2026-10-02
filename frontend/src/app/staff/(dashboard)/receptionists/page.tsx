"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { authApi } from "@/lib/api/auth"
import { getAssetUrl } from "@/lib/api/client"
import type { StaffMember } from "@/types/auth"

import { DataTable, type Receptionist } from "./components/data-table"
import { ReceptionistStatCards } from "./components/receptionist-stat-cards"
import type { ReceptionistFormValues } from "./components/receptionist-form-sheet"

const generateAvatar = (firstName: string, lastName: string) =>
  `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()

const mapStaffMemberToReceptionist = (member: StaffMember): Receptionist => ({
  id: member.id,
  firstName: member.first_name ?? "",
  lastName: member.last_name ?? "",
  avatar: generateAvatar(member.first_name ?? "", member.last_name ?? ""),
  avatarUrl: getAssetUrl(member.avatar_url),
  email: member.email,
  phone: (member as any).phone ?? undefined, // adjust once phone exists on StaffMember
  status: member.is_active ? "Active" : "Inactive",
  createdAt: member.created_at ? new Date(member.created_at).toISOString().split("T")[0] : "",
  lastLogin: undefined,
  isVerified: member.is_verified,
})

export default function ReceptionistsPage() {
  const [receptionists, setReceptionists] = useState<Receptionist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const staff = await authApi.staff.list("receptionist")
        setReceptionists(staff.map(mapStaffMemberToReceptionist))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load receptionists"
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }
    void load()
  }, [])

  const handleAdd = async (values: ReceptionistFormValues) => {
    try {
      let created = await authApi.staff.create({
        email: values.email,
        first_name: values.firstName,
        last_name: values.lastName,
        role: "receptionist",
        phone: values.phone,
        bio: values.notes,
      } as any)

      if (values.avatarFile) {
        created = await authApi.staff.uploadAvatar(created.id, values.avatarFile)
      }

      setReceptionists((prev) => [mapStaffMemberToReceptionist(created), ...prev])
      toast.success(`${values.firstName} ${values.lastName} was added`, {
        description: "An invitation email with a password setup link was sent.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to add receptionist"
      toast.error(message)
    }
  }

  const handleEdit = async (id: string, values: ReceptionistFormValues) => {
    try {
      let updated = await authApi.staff.update(id, {
        first_name: values.firstName,
        last_name: values.lastName,
        phone: values.phone,
        bio: values.notes,
      } as any)

      if (values.avatarFile) {
        updated = await authApi.staff.uploadAvatar(id, values.avatarFile)
      }

      setReceptionists((prev) =>
        prev.map((r) => (r.id === id ? mapStaffMemberToReceptionist(updated) : r))
      )
      toast.success("Receptionist profile updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update receptionist"
      toast.error(message)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await authApi.staff.delete(id)
      setReceptionists((prev) => prev.filter((r) => r.id !== id))
      toast.success("Receptionist account removed")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove receptionist"
      toast.error(message)
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await authApi.staff.toggleStatus(id)
      setReceptionists((prev) =>
        prev.map((r) => (r.id === id ? mapStaffMemberToReceptionist(updated) : r))
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to change status"
      toast.error(message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <ReceptionistStatCards receptionists={receptionists} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-8 lg:mt-12">
        <DataTable
          receptionists={receptionists}
          isLoading={isLoading}
          onAddReceptionist={handleAdd}
          onEditReceptionist={handleEdit}
          onDeleteReceptionist={handleDelete}
          onToggleStatus={handleToggleStatus}
        />
      </div>
    </div>
  )
}