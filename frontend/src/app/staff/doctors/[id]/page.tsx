"use client"

import { useState } from "react"
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

import initialDoctorsData from "../data.json"
import { DoctorFormSheet, type DoctorFormValues } from "../components/doctor-form-sheet"
import type { Doctor } from "../components/data-table"

const doctorsSeed = initialDoctorsData as Doctor[]

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

export default function DoctorProfilePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const doctorId = Number(params.id)

  const [doctor, setDoctor] = useState<Doctor | null>(
    () => doctorsSeed.find((d) => d.id === doctorId) ?? null
  )
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

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

  const handleEditSubmit = (values: DoctorFormValues) => {
    setDoctor((prev) => {
      if (!prev) return prev
      return {
        ...prev,
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
    })
    toast.success("Doctor profile updated")
  }

  const handleToggleStatus = () => {
    setDoctor((prev) => {
      if (!prev) return prev
      const nextStatus = prev.status === "Active" ? "Inactive" : "Active"
      toast.success(
        nextStatus === "Active" ? `Dr. ${prev.lastName} activated` : `Dr. ${prev.lastName} deactivated`
      )
      return { ...prev, status: nextStatus }
    })
  }

  const handleResetPassword = () => {
    // No backend endpoint yet — this stays a stub until auth/email is wired up.
    toast.success(`Password reset email sent to ${doctor.email}`)
  }

  const handleDelete = () => {
    toast.success(`Dr. ${doctor.firstName} ${doctor.lastName} was removed`)
    router.push("/staff/doctors")
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