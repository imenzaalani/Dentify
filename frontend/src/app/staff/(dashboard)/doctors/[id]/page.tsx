"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Ban,
  CircleCheck,
  KeyRound,
  Mail,
  Pencil,
  Stethoscope,
  Trash2,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { authApi } from "@/lib/api/auth"
import type { StaffMember } from "@/types/auth"

import { DoctorFormSheet, type DoctorFormValues } from "../components/doctor-form-sheet"
import type { Doctor } from "../components/data-table"

const WEEKDAY_LABELS: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
}

const getStatusColor = (status: string) =>
  status === "Active"
    ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
    : "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"

const mapStaffMemberToDoctor = (member: StaffMember): Doctor => ({
  id: member.id,
  firstName: member.first_name ?? "",
  lastName: member.last_name ?? "",
  avatar: `${(member.first_name ?? "")[0] ?? ""}${(member.last_name ?? "")[0] ?? ""}`.toUpperCase(),
  email: member.email,
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

export default function DoctorProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const doctorId = params.id

  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDoctor = async () => {
      if (!doctorId) {
        setIsLoading(false)
        return
      }

      try {
        const member = await authApi.staff.get(doctorId)
        setDoctor(mapStaffMemberToDoctor(member))
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load doctor"
        toast.error(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadDoctor()
  }, [doctorId])

  if (isLoading) {
    return (
      <div className="@container/main px-4 lg:px-6 py-16 flex flex-col items-center gap-3 text-center">
        <Stethoscope className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Loading doctor profile…</h1>
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="@container/main px-4 lg:px-6 py-16 flex flex-col items-center gap-3 text-center">
        <Stethoscope className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Doctor not found</h1>
        <p className="text-sm text-muted-foreground">This account may have been removed.</p>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/staff/doctors">
            <ArrowLeft className="mr-2 size-4" />
            Back to Doctors
          </Link>
        </Button>
      </div>
    )
  }

  const generateAvatar = (firstName: string, lastName: string) =>
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase()

  const resolveSpecialty = (values: DoctorFormValues) =>
    values.specialty === "Other" && values.specialtyOther
      ? values.specialtyOther
      : values.specialty

  const handleEditSubmit = async (values: DoctorFormValues) => {
    if (!doctor) return

    try {
      const updated = await authApi.staff.update(doctor.id, {
        first_name: values.firstName,
        last_name: values.lastName,
        specialty: resolveSpecialty(values),
        license_number: values.licenseNumber,
        bio: values.bio,
        color: values.color,
        working_hours: values.workingHours,
      })

      setDoctor(mapStaffMemberToDoctor(updated))
      toast.success("Doctor profile updated")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update doctor"
      toast.error(message)
    }
  }

  const handleToggleStatus = async () => {
    if (!doctor) return

    try {
      const updated = await authApi.staff.toggleStatus(doctor.id)
      setDoctor(mapStaffMemberToDoctor(updated))
      toast.success(updated.is_active ? `Dr. ${doctor.lastName} activated` : `Dr. ${doctor.lastName} deactivated`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to change doctor status"
      toast.error(message)
    }
  }

  const handleResetPassword = () => {
    toast.success(`Password reset email sent to ${doctor.email}`)
  }

  const handleDelete = async () => {
    if (!doctor) return

    try {
      await authApi.staff.delete(doctor.id)
      toast.success(`Dr. ${doctor.firstName} ${doctor.lastName} was removed`)
      router.push("/staff/doctors")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to remove doctor"
      toast.error(message)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Button asChild variant="ghost" size="sm" className="w-fit cursor-pointer -ml-2">
            <Link href="/staff/doctors">
              <ArrowLeft className="mr-2 size-4" />
              Back to Doctors
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback
                className="text-base font-semibold text-white"
                style={{ backgroundColor: doctor.color }}
              >
                {doctor.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold">
                Dr. {doctor.firstName} {doctor.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="font-normal">
                  {doctor.specialty}
                </Badge>
                <Badge variant="secondary" className={getStatusColor(doctor.status)}>
                  {doctor.status}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="cursor-pointer" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 size-4" />
            Edit
          </Button>
          <Button variant="outline" className="cursor-pointer" onClick={handleResetPassword}>
            <KeyRound className="mr-2 size-4" />
            Reset Password
          </Button>
          <Button variant="outline" className="cursor-pointer" onClick={handleToggleStatus}>
            {doctor.status === "Active" ? (
              <>
                <Ban className="mr-2 size-4" />
                Deactivate
              </>
            ) : (
              <>
                <CircleCheck className="mr-2 size-4" />
                Activate
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer text-destructive hover:text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Contact & Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-4" />
              <span>{doctor.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">License #</span>
              <span className="font-mono">{doctor.licenseNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>{new Date(doctor.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last login</span>
              <span>{doctor.lastLogin ? new Date(doctor.lastLogin).toLocaleDateString() : "—"}</span>
            </div>
            {doctor.bio && (
              <>
                <Separator />
                <p className="text-muted-foreground">{doctor.bio}</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground font-medium">
              Working Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y">
              {doctor.workingHours.map((wh) => (
                <div key={wh.day} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium">{WEEKDAY_LABELS[wh.day] ?? wh.day}</span>
                  <span className={wh.off ? "text-muted-foreground" : ""}>
                    {wh.off ? "Off" : `${wh.start} – ${wh.end}`}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <DoctorFormSheet
        mode="edit"
        doctor={doctor}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSubmitDoctor={handleEditSubmit}
      />

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete doctor account?</DialogTitle>
            <DialogDescription>
              This will permanently remove Dr. {doctor.firstName} {doctor.lastName}&apos;s account,
              including their schedule and login access. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer border border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:border-red-400 dark:hover:bg-red-400"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}