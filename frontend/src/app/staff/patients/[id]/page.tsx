"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  Phone,
  Mail,
  MoreHorizontal,
  CalendarPlus,
  MessageSquare,
  Archive,
  CalendarDays,
  ClipboardList,
  FileText,
  Receipt,
  Plus,
  ArrowLeft,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import initialPatientsData from "../data.json"
import type { Patient } from "../components/data-table"
import { lifecycleColors } from "../components/data-table"
import { QuickAppointmentDialog, QuickMessageDialog } from "../components/quick-action-dialogs"
import { useCurrentRole } from "@/lib/rbac"

const calculateAge = (dob: string) => {
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>()
  const patientId = Number(params.id)
  const currentRole = useCurrentRole()
  // Receptionists get the administrative view only (contact, appointments,
  // billing) — clinical details are gated per dentapp-frontend-review.md §2.1.
  const canViewClinical = currentRole !== "receptionist"

  const [patients, setPatients] = useState<Patient[]>(initialPatientsData as Patient[])
  const [notes, setNotes] = useState("")
  const [showApptDialog, setShowApptDialog] = useState(false)
  const [showMsgDialog, setShowMsgDialog] = useState(false)

  const patient = patients.find((p) => p.id === patientId)

  if (!patient) {
    return (
      <div className="px-4 lg:px-6 py-12 text-center space-y-4">
        <p className="text-muted-foreground">Patient not found.</p>
        <Button asChild variant="outline" className="cursor-pointer">
          <Link href="/staff/patients">
            <ArrowLeft className="mr-2 size-4" />
            Back to patients
          </Link>
        </Button>
      </div>
    )
  }

  const age = calculateAge(patient.dob)

  const handleArchive = () => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patient.id) return p
        const nowArchived = p.status === "Active"
        return {
          ...p,
          status: nowArchived ? "Archived" : "Active",
          patientStatus: nowArchived ? "archived" : "active",
        }
      })
    )
    toast.success(
      patient.status === "Active" ? "Patient archived" : "Patient unarchived"
    )
  }

  const handleChangeLifecycle = (patientStatus: Patient["patientStatus"]) => {
    setPatients((prev) =>
      prev.map((p) =>
        p.id === patient.id
          ? { ...p, patientStatus, status: patientStatus === "archived" ? "Archived" : "Active" }
          : p
      )
    )
  }

  const handleCreateAppointment = (data: { date: string; type: string }) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patient.id ? { ...p, nextAppointment: data } : p))
    )
  }

  const handleSaveNotes = () => {
    toast.success("Notes saved")
  }

  // Small appointment history list built from what the current Patient type
  // actually has — real history will come from the appointments backend
  // once it's wired up (see /planning).
  const appointmentRows = [
    patient.nextAppointment && {
      date: patient.nextAppointment.date,
      type: patient.nextAppointment.type,
      status: "Upcoming" as const,
    },
    patient.lastAppointment && {
      date: patient.lastAppointment,
      type: patient.activeTreatment.name ?? "Consultation",
      status: "Completed" as const,
    },
  ].filter(Boolean) as { date: string; type: string; status: "Upcoming" | "Completed" }[]

  return (
    <div className="flex flex-col gap-4">
      <div className="px-4 lg:px-6">
        <Button asChild variant="ghost" size="sm" className="cursor-pointer -ml-2">
          <Link href="/staff/patients">
            <ArrowLeft className="mr-2 size-4" />
            Back to patients
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="text-lg font-medium">
                  {patient.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold">
                    {patient.firstName} {patient.lastName}
                  </h1>
                  <Badge
                    className={
                      patient.status === "Active"
                        ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        : ""
                    }
                    variant={patient.status === "Active" ? "default" : "outline"}
                  >
                    {patient.status}
                  </Badge>
                  <Select value={patient.patientStatus} onValueChange={handleChangeLifecycle}>
                    <SelectTrigger
                      className={`h-7 w-[110px] cursor-pointer text-xs ${lifecycleColors[patient.patientStatus]}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="recall">Recall</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  {patient.activeTreatment.active && (
                    <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      {patient.activeTreatment.name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {age} years old · {patient.gender} · {patient.bloodType || "Blood type unknown"}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <a href={`tel:${patient.phone}`}>
                    <Button variant="outline" size="sm" className="cursor-pointer">
                      <Phone className="mr-2 size-3.5" />
                      {patient.phone}
                    </Button>
                  </a>
                  {patient.email && (
                    <a href={`mailto:${patient.email}`}>
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        <Mail className="mr-2 size-3.5" />
                        Email
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => toast.info("Edit patient — coming soon")}
              >
                Edit information
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="cursor-pointer">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setShowApptDialog(true)}>
                    <CalendarPlus className="mr-2 size-4" />
                    New appointment
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setShowMsgDialog(true)}>
                    <MessageSquare className="mr-2 size-4" />
                    Send message
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleArchive}
                  >
                    <Archive className="mr-2 size-4" />
                    {patient.status === "Active" ? "Archive" : "Unarchive"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="px-4 lg:px-6">
        <Tabs defaultValue="summary">
          <TabsList>
            <TabsTrigger value="summary" className="cursor-pointer">Summary</TabsTrigger>
            <TabsTrigger value="appointments" className="cursor-pointer">Appointments</TabsTrigger>
            {canViewClinical && (
              <TabsTrigger value="treatments" className="cursor-pointer">Treatments</TabsTrigger>
            )}
            <TabsTrigger value="documents" className="cursor-pointer">Documents</TabsTrigger>
            <TabsTrigger value="billing" className="cursor-pointer">Billing</TabsTrigger>
            <TabsTrigger value="messages" className="cursor-pointer">Messages</TabsTrigger>
          </TabsList>

          {/* Summary */}
          <TabsContent value="summary" className="space-y-4 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {canViewClinical && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Medical information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Allergies</p>
                      {patient.allergies && patient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.allergies.map((a) => (
                            <Badge key={a} variant="outline">{a}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">None reported</p>
                      )}
                    </div>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground mb-1">Chronic conditions</p>
                      <p>{patient.chronicConditions || "None reported"}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground mb-1">Current medications</p>
                      <p>{patient.currentMedications || "None reported"}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground mb-1">Medical history</p>
                      <p>{patient.medicalHistory || "None reported"}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Next appointment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {patient.nextAppointment ? (
                      <div>
                        <p className="font-medium">
                          {new Date(patient.nextAppointment.date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {patient.nextAppointment.type}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">No appointment scheduled</p>
                        <Button size="sm" className="cursor-pointer" onClick={() => setShowApptDialog(true)}>
                          <Plus className="mr-2 size-3.5" />
                          Schedule
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Emergency contact</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    {patient.emergencyContactName ? (
                      <>
                        <p className="font-medium">{patient.emergencyContactName}</p>
                        <p className="text-muted-foreground">{patient.emergencyContactPhone}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">Not provided</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {canViewClinical && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Private practitioner notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea
                    placeholder="Not visible to the patient..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={handleSaveNotes}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">Saved automatically on blur.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Appointments */}
          <TabsContent value="appointments" className="space-y-4 pt-4">
            <div className="flex justify-end">
              <Button className="cursor-pointer" onClick={() => setShowApptDialog(true)}>
                <Plus className="mr-2 size-4" />
                Create appointment
              </Button>
            </div>
            {appointmentRows.length > 0 ? (
              <div className="space-y-2">
                {appointmentRows.map((a, i) => (
                  <Card key={i}>
                    <CardContent className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(a.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">{a.type}</p>
                        </div>
                      </div>
                      <Badge variant={a.status === "Upcoming" ? "default" : "secondary"}>
                        {a.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No appointments on record yet.
              </p>
            )}
          </TabsContent>

          {/* Treatments — hidden for receptionist, see §2.1 */}
          {canViewClinical && (
            <TabsContent value="treatments" className="space-y-4 pt-4">
              <div className="flex justify-end">
                <Button
                  className="cursor-pointer"
                  onClick={() => toast.info("Treatment plan creation — coming soon")}
                >
                  <Plus className="mr-2 size-4" />
                  New treatment plan
                </Button>
              </div>
              {patient.activeTreatment.active ? (
                <Card>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{patient.activeTreatment.name}</p>
                      <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        In progress
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardList className="size-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Detailed steps coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No treatment plans for this patient.
                </p>
              )}
            </TabsContent>
          )}

          {/* Documents */}
          <TabsContent value="documents" className="pt-4">
            <div className="flex justify-end mb-4">
              <Button
                className="cursor-pointer"
                onClick={() => toast.info("Document upload — coming soon")}
              >
                <Plus className="mr-2 size-4" />
                Upload document
              </Button>
            </div>
            <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
              <FileText className="mx-auto size-6" />
              <p>No documents uploaded yet.</p>
            </div>
          </TabsContent>

          {/* Billing */}
          <TabsContent value="billing" className="pt-4">
            <div className="grid gap-4 sm:grid-cols-3 mb-4">
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Total invoiced</p>
                  <p className="text-xl font-bold">0 DT</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Total paid</p>
                  <p className="text-xl font-bold">0 DT</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-xl font-bold">0 DT</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end mb-4">
              <Button
                className="cursor-pointer"
                onClick={() => toast.info("Invoice creation — coming soon")}
              >
                <Plus className="mr-2 size-4" />
                New invoice
              </Button>
            </div>
            <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
              <Receipt className="mx-auto size-6" />
              <p>No invoices or quotes yet.</p>
            </div>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="pt-4">
            <Card>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-8">
                  No messages yet. Start the conversation below.
                </p>
                <Button className="w-full cursor-pointer" onClick={() => setShowMsgDialog(true)}>
                  <MessageSquare className="mr-2 size-4" />
                  Compose message
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <QuickAppointmentDialog
        open={showApptDialog}
        onOpenChange={setShowApptDialog}
        patientName={`${patient.firstName} ${patient.lastName}`}
        onCreate={handleCreateAppointment}
      />
      <QuickMessageDialog
        open={showMsgDialog}
        onOpenChange={setShowMsgDialog}
        patientName={`${patient.firstName} ${patient.lastName}`}
      />
    </div>
  )
}