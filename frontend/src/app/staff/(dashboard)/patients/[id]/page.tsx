"use client"

import { useEffect, useState } from "react"
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
  ArchiveRestore,
  CalendarDays,
  ClipboardList,
  FileText,
  Receipt,
  Plus,
  ArrowLeft,
  MailPlus,
  ShieldOff,
  ShieldCheck,
  ChevronDown,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

import type { Patient } from "../components/types"
import {
  getInitials,
  isArchived,
  lifecycleColors,
  lifecycleLabels,
  preferredContactLabels,
} from "../components/types"
import { QuickAppointmentDialog, QuickMessageDialog } from "../components/quick-action-dialogs"
import { PatientEditSheet } from "../components/patient-edit-sheet"
import { DentalChart } from "../components/dental-chart/dental-chart"
import { patientApi } from "@/lib/api/patients"
import { appointmentApi } from "@/lib/api/appointments"
import { authApi } from "@/lib/api/auth"
import { careTypeApi } from "@/lib/api/care-types"
import { treatmentApi } from "@/lib/api/treatments"
import { referralApi } from "@/lib/api/referrals"
import { documentApi } from "@/lib/api/documents"
import { invoiceApi } from "@/lib/api/invoices"
import { ApiError, getAssetUrl } from "@/lib/api/client"
import { useCurrentRole } from "@/lib/rbac"
import type { PatientUpdateRequest } from "@/types/patient"
import type { Appointment, AppointmentStatus } from "@/types/appointment"
import type { StaffMember } from "@/types/auth"
import type { CareType } from "@/types/care-type"
import { documentCategoryLabels, type ClinicDocument } from "@/types/document"
import { statusLabels as invoiceStatusLabels, type Invoice, type InvoiceCreateInput } from "@/types/invoice"

import {
  TreatmentFormSheet,
  type TreatmentFormValues,
} from "../../treatments/components/treatment-form-sheet"
import type { TreatmentPlan as TreatmentPlanVM } from "../../treatments/components/data-table"
import { buildCreatePayload as buildTreatmentCreatePayload, mapTreatmentPlan, toSimplePatient } from "../../treatments/data"

import {
  ReferralFormSheet,
  type ReferralFormValues,
} from "../../referrals/components/referral-form-sheet"
import type { Referral as ReferralVM } from "../../referrals/components/data-table"
import { buildCreatePayload as buildReferralCreatePayload, mapReferral } from "../../referrals/data"

import { UploadDocumentDialog, type UploadDocumentValues } from "../../documents/components/upload-document-dialog"

import { InvoiceFormSheet, type InvoiceFormValues } from "../../billing/components/invoice-form-sheet"
import { RecordPaymentDialog } from "../../billing/components/record-payment-dialog"
import { formatTND } from "../../billing/components/data-table"

const calculateAge = (dob: string) => {
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  arrived: "Arrived",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
}

const paymentMethodLabels: Record<string, string> = {
  cash: "Cash",
  check: "Check",
  card: "Card",
  transfer: "Transfer",
  other: "Other",
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>()
  const currentRole = useCurrentRole()
  // Receptionists get the administrative view only (contact, appointments,
  // billing) — clinical details are gated per dentapp-frontend-review.md §2.1.
  const canViewClinical = currentRole !== "receptionist"
  const isOwner = currentRole === "owner"

  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [notes, setNotes] = useState("")
  const [showApptDialog, setShowApptDialog] = useState(false)
  const [showMsgDialog, setShowMsgDialog] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [dentistsById, setDentistsById] = useState<Record<string, StaffMember>>({})
  const [careTypesById, setCareTypesById] = useState<Record<string, CareType>>({})
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true)

  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlanVM[]>([])
  const [isLoadingTreatments, setIsLoadingTreatments] = useState(true)
  const [showTreatmentSheet, setShowTreatmentSheet] = useState(false)

  const [referrals, setReferrals] = useState<ReferralVM[]>([])
  const [isLoadingReferrals, setIsLoadingReferrals] = useState(true)
  const [showReferralSheet, setShowReferralSheet] = useState(false)

  const [documents, setDocuments] = useState<ClinicDocument[]>([])
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true)
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false)
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null)
  const [paymentTargetInvoice, setPaymentTargetInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setNotFound(false)
    patientApi
      .getPatient(params.id)
      .then((data) => {
        if (!cancelled) setPatient(data)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          toast.error(err instanceof ApiError ? err.message : "Failed to load patient")
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [params.id])

  useEffect(() => {
    if (!patient) return
    let cancelled = false
    setIsLoadingAppointments(true)
    Promise.all([
      appointmentApi.listAppointments({ patient_id: patient.id }),
      authApi.staff.list("dentist"),
      careTypeApi.listCareTypes(true),
    ])
      .then(([appointmentsRes, dentistsRes, careTypesRes]) => {
        if (cancelled) return
        setAppointments(appointmentsRes)
        setDentistsById(Object.fromEntries(dentistsRes.map((d) => [d.id, d])))
        setCareTypesById(Object.fromEntries(careTypesRes.map((c) => [c.id, c])))
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(err instanceof ApiError ? err.message : "Failed to load appointments")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingAppointments(false)
      })
    return () => {
      cancelled = true
    }
  }, [patient?.id])

  const refreshAppointments = () => {
    if (!patient) return
    appointmentApi
      .listAppointments({ patient_id: patient.id })
      .then(setAppointments)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to refresh appointments")
      })
  }

  useEffect(() => {
    if (!patient) return
    let cancelled = false
    setIsLoadingTreatments(true)
    treatmentApi
      .listTreatmentPlans()
      .then((plans) => {
        if (cancelled) return
        const mine = plans.filter((p) => p.patient_id === patient.id)
        setTreatmentPlans(mine.map((p) => mapTreatmentPlan(p, [toSimplePatient(patient)])))
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(err instanceof ApiError ? err.message : "Failed to load treatment plans")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTreatments(false)
      })
    return () => {
      cancelled = true
    }
  }, [patient?.id])

  const refreshTreatmentPlans = () => {
    if (!patient) return
    treatmentApi
      .listTreatmentPlans()
      .then((plans) => {
        const mine = plans.filter((p) => p.patient_id === patient.id)
        setTreatmentPlans(mine.map((p) => mapTreatmentPlan(p, [toSimplePatient(patient)])))
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to refresh treatment plans")
      })
  }

  useEffect(() => {
    if (!patient) return
    let cancelled = false
    setIsLoadingReferrals(true)
    referralApi
      .listReferrals()
      .then((refs) => {
        if (cancelled) return
        const mine = refs.filter((r) => r.patient_id === patient.id)
        setReferrals(mine.map((r) => mapReferral(r, [toSimplePatient(patient)])))
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(err instanceof ApiError ? err.message : "Failed to load referrals")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingReferrals(false)
      })
    return () => {
      cancelled = true
    }
  }, [patient?.id])

  useEffect(() => {
    if (!patient) return
    let cancelled = false
    setIsLoadingDocuments(true)
    documentApi
      .listDocuments({ patient_id: patient.id })
      .then((docs) => {
        if (!cancelled) setDocuments(docs)
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(err instanceof ApiError ? err.message : "Failed to load documents")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDocuments(false)
      })
    return () => {
      cancelled = true
    }
  }, [patient?.id])

  useEffect(() => {
    if (!patient) return
    let cancelled = false
    setIsLoadingInvoices(true)
    invoiceApi
      .listInvoices({ patient_id: patient.id })
      .then((invs) => {
        if (!cancelled) setInvoices(invs)
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(err instanceof ApiError ? err.message : "Failed to load invoices")
      })
      .finally(() => {
        if (!cancelled) setIsLoadingInvoices(false)
      })
    return () => {
      cancelled = true
    }
  }, [patient?.id])

  const handleCreateTreatmentPlan = async (data: TreatmentFormValues) => {
    try {
      await treatmentApi.createTreatmentPlan(buildTreatmentCreatePayload(data))
      refreshTreatmentPlans()
      toast.success(`Treatment plan "${data.title}" created`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save the treatment plan")
    }
  }

  const handleCreateReferral = async (data: ReferralFormValues) => {
    try {
      const created = await referralApi.createReferral(buildReferralCreatePayload(data))
      if (patient) {
        setReferrals((prev) => [mapReferral(created, [toSimplePatient(patient)]), ...prev])
      }
      toast.success(`Referral to ${data.specialistName} created`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't save the referral")
    }
  }

  const handleUploadDocument = async (data: UploadDocumentValues) => {
    try {
      const newDoc = await documentApi.uploadDocument({
        patientId: data.patientId,
        category: data.category,
        notes: data.notes,
        file: data.file,
      })
      setDocuments((prev) => [newDoc, ...prev])
      toast.success(`"${newDoc.file_name}" uploaded`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload document")
      throw err
    }
  }

  const handleCreateInvoice = async (data: InvoiceFormValues) => {
    const payload: InvoiceCreateInput = {
      doc_type: data.type === "Quote" ? "quote" : "invoice",
      patient_id: data.patientId,
      treatment_plan_id: data.treatmentPlanId || null,
      issue_date: data.issueDate.toISOString().split("T")[0],
      due_date: data.dueDate ? data.dueDate.toISOString().split("T")[0] : null,
      global_discount_pct: data.globalDiscountPct ?? 0,
      notes: data.notes,
      payment_terms: data.paymentTerms,
      line_items: data.lineItems.map((line) => ({
        description: line.description,
        tooth: line.tooth,
        quantity: line.quantity,
        unit_price: line.unitPrice,
        discount_pct: line.discountPct,
      })),
    }

    try {
      const newInvoice = await invoiceApi.createInvoice(payload)
      setInvoices((prev) => [newInvoice, ...prev])
      toast.success(`${data.type} ${newInvoice.number} created`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create invoice")
      throw err
    }
  }

  const handleRecordPayment = async (
    invoiceId: string,
    values: Parameters<typeof invoiceApi.recordPayment>[1]
  ) => {
    try {
      const updated = await invoiceApi.recordPayment(invoiceId, values)
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === invoiceId ? updated : inv))
      )
      toast.success("Payment recorded")
      setPaymentTargetInvoice(null)
      setExpandedInvoiceId(invoiceId)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to record payment")
    }
  }

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6 py-12 text-center text-muted-foreground">
        Loading patient...
      </div>
    )
  }

  if (notFound || !patient) {
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
  const archived = isArchived(patient)

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paid_amount, 0)
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balance, 0)

  const sortedAppointments = [...appointments].sort(
    (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
  )
  const nextAppointment = appointments
    .filter(
      (a) =>
        (a.status === "pending" || a.status === "confirmed") &&
        new Date(a.scheduled_at).getTime() >= Date.now()
    )
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0]

  const formatAppointment = (a: Appointment) => {
    const dentist = dentistsById[a.dentist_id]
    const careType = careTypesById[a.care_type_id]
    const dateLabel = new Date(a.scheduled_at).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
    return {
      dateLabel,
      dentistLabel: dentist ? `Dr. ${dentist.first_name} ${dentist.last_name}` : "Unassigned",
      careTypeLabel: careType?.name ?? "Care type",
    }
  }

  const handleArchiveToggle = async () => {
    try {
      const updated = archived
        ? await patientApi.unarchivePatient(patient.id)
        : await patientApi.archivePatient(patient.id)
      setPatient(updated)
      toast.success(archived ? "Patient unarchived" : "Patient archived")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed")
    }
  }

  const handleInvite = async () => {
    try {
      const updated = await patientApi.invitePatient(patient.id)
      setPatient(updated)
      toast.success(`Portal invite sent to ${patient.email}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't send the invite")
    }
  }

  const handleResendInvite = async () => {
    try {
      const updated = await patientApi.resendPatientInvite(patient.id)
      setPatient(updated)
      toast.success(`Invite resent to ${patient.email}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't resend the invite")
    }
  }

  const handleRevokePortalAccess = async () => {
    try {
      const updated = await patientApi.revokePortalAccess(patient.id)
      setPatient(updated)
      toast.success(`Portal access revoked for ${patient.first_name} ${patient.last_name}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't revoke portal access")
    }
  }

  const handleRestorePortalAccess = async () => {
    try {
      const updated = await patientApi.restorePortalAccess(patient.id)
      setPatient(updated)
      toast.success(`Portal access restored for ${patient.first_name} ${patient.last_name}`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't restore portal access")
    }
  }

  const handleSaveNotes = () => {
    toast.success("Notes saved")
  }

  const handleSaveEdit = async (payload: PatientUpdateRequest) => {
    try {
      const updated = await patientApi.updatePatient(patient.id, payload)
      setPatient(updated)
      toast.success("Patient information updated")
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update patient")
      throw err // keeps the sheet open on failure instead of closing on a bad save
    }
  }

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
                {patient.avatar_url ? (
                  <AvatarImage src={getAssetUrl(patient.avatar_url)} alt={`${patient.first_name} ${patient.last_name}`} />
                ) : (
                  <AvatarFallback className="text-lg font-medium">
                    {getInitials(patient.first_name, patient.last_name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-semibold">
                    {patient.first_name} {patient.last_name}
                  </h1>
                  <Badge
                    className={
                      !archived
                        ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        : ""
                    }
                    variant={!archived ? "default" : "outline"}
                  >
                    {archived ? "Archived" : "Active"}
                  </Badge>
                  {!archived && (
                    <Badge variant="outline" className={lifecycleColors[patient.lifecycle_stage]}>
                      Stage: {lifecycleLabels[patient.lifecycle_stage]}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {age} years old · {patient.patient_number}
                  {patient.preferred_contact_method &&
                    ` · Prefers ${preferredContactLabels[patient.preferred_contact_method]}`}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  {patient.phone && (
                    <a href={`tel:${patient.phone}`}>
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        <Phone className="mr-2 size-3.5" />
                        {patient.phone}
                      </Button>
                    </a>
                  )}
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
                onClick={() => setShowEditSheet(true)}
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
                  {patient.portal_status === "not_invited" && patient.email && (
                    <DropdownMenuItem className="cursor-pointer" onClick={handleInvite}>
                      <MailPlus className="mr-2 size-4" />
                      Invite to portal
                    </DropdownMenuItem>
                  )}
                  {patient.portal_status === "pending" && (
                    <DropdownMenuItem className="cursor-pointer" onClick={handleResendInvite}>
                      <MailPlus className="mr-2 size-4" />
                      Resend invite
                    </DropdownMenuItem>
                  )}
                  {patient.portal_status === "active" && isOwner && (
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={handleRevokePortalAccess}
                    >
                      <ShieldOff className="mr-2 size-4" />
                      Revoke portal access
                    </DropdownMenuItem>
                  )}
                  {patient.portal_status === "revoked" && isOwner && (
                    <DropdownMenuItem className="cursor-pointer" onClick={handleRestorePortalAccess}>
                      <ShieldCheck className="mr-2 size-4" />
                      Restore portal access
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={handleArchiveToggle}
                  >
                    {archived ? (
                      <ArchiveRestore className="mr-2 size-4" />
                    ) : (
                      <Archive className="mr-2 size-4" />
                    )}
                    {archived ? "Unarchive" : "Archive"}
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
            {canViewClinical && (
              <TabsTrigger value="clinical" className="cursor-pointer">Clinical</TabsTrigger>
            )}
            <TabsTrigger value="appointments" className="cursor-pointer">Appointments</TabsTrigger>
            <TabsTrigger value="administration" className="cursor-pointer">Administration</TabsTrigger>
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
                      <p className="text-muted-foreground mb-1">Current medications</p>
                      <p>{patient.current_medications || "None reported"}</p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-muted-foreground mb-1">Medical history</p>
                      <p>{patient.medical_history || "None reported"}</p>
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
                    {isLoadingAppointments ? (
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    ) : nextAppointment ? (
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">{formatAppointment(nextAppointment).dateLabel}</p>
                        <p className="text-muted-foreground">
                          {formatAppointment(nextAppointment).dentistLabel} ·{" "}
                          {formatAppointment(nextAppointment).careTypeLabel}
                        </p>
                        <Badge variant="outline">
                          {appointmentStatusLabels[nextAppointment.status]}
                        </Badge>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">No upcoming appointment.</p>
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
                    {patient.emergency_contact_name ? (
                      <>
                        <p className="font-medium">{patient.emergency_contact_name}</p>
                        <p className="text-muted-foreground">{patient.emergency_contact_phone}</p>
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

          {canViewClinical && (
            <TabsContent value="clinical" className="pt-4">
              <Tabs defaultValue="dental">
                <TabsList>
                  <TabsTrigger value="dental" className="cursor-pointer">Dental</TabsTrigger>
                  <TabsTrigger value="treatments" className="cursor-pointer">Treatment plans</TabsTrigger>
                  <TabsTrigger value="referrals" className="cursor-pointer">Referrals</TabsTrigger>
                </TabsList>

                <TabsContent value="dental" className="pt-4">
                  <DentalChart patientId={patient.id} />
                </TabsContent>

                <TabsContent value="treatments" className="space-y-4 pt-4">
                  <div className="flex justify-end">
                    <Button className="cursor-pointer" onClick={() => setShowTreatmentSheet(true)}>
                      <Plus className="mr-2 size-4" />
                      New treatment plan
                    </Button>
                  </div>
                  {isLoadingTreatments ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
                  ) : treatmentPlans.length > 0 ? (
                    <div className="space-y-2">
                      {treatmentPlans.map((plan) => (
                        <Card key={plan.id}>
                          <CardContent className="flex items-center justify-between py-3 text-sm">
                            <div>
                              <p className="font-medium">{plan.title}</p>
                              <p className="text-muted-foreground">
                                {plan.steps.length} step{plan.steps.length === 1 ? "" : "s"} ·{" "}
                                Started {new Date(plan.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline">{plan.status}</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
                      <ClipboardList className="mx-auto size-6" />
                      <p>No treatment plans for this patient.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="referrals" className="space-y-4 pt-4">
                  <div className="flex justify-end">
                    <Button className="cursor-pointer" onClick={() => setShowReferralSheet(true)}>
                      <Plus className="mr-2 size-4" />
                      New referral
                    </Button>
                  </div>
                  {isLoadingReferrals ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
                  ) : referrals.length > 0 ? (
                    <div className="space-y-2">
                      {referrals.map((referral) => (
                        <Card key={referral.id}>
                          <CardContent className="flex items-center justify-between py-3 text-sm">
                            <div>
                              <p className="font-medium">{referral.specialistName}</p>
                              <p className="text-muted-foreground">
                                {referral.specialty} · {new Date(referral.date).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="outline">{referral.status}</Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
                      <FileText className="mx-auto size-6" />
                      <p>No referrals for this patient.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}

          <TabsContent value="appointments" className="space-y-4 pt-4">
            <div className="flex justify-end">
              <Button className="cursor-pointer" onClick={() => setShowApptDialog(true)}>
                <Plus className="mr-2 size-4" />
                Create appointment
              </Button>
            </div>
            {isLoadingAppointments ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
            ) : sortedAppointments.length > 0 ? (
              <div className="space-y-2">
                {sortedAppointments.map((a) => {
                  const { dateLabel, dentistLabel, careTypeLabel } = formatAppointment(a)
                  return (
                    <Card key={a.id}>
                      <CardContent className="flex items-center justify-between py-3 text-sm">
                        <div>
                          <p className="font-medium">{dateLabel}</p>
                          <p className="text-muted-foreground">
                            {dentistLabel} · {careTypeLabel}
                          </p>
                        </div>
                        <Badge variant="outline">{appointmentStatusLabels[a.status]}</Badge>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
                <CalendarDays className="mx-auto size-6" />
                <p>No appointments on record yet.</p>
              </div>
            )}
          </TabsContent>

          {/* Documents & Billing — nested under Administration */}
          <TabsContent value="administration" className="pt-4">
            <Tabs defaultValue="documents">
              <TabsList>
                <TabsTrigger value="documents" className="cursor-pointer">Documents</TabsTrigger>
                <TabsTrigger value="billing" className="cursor-pointer">Billing</TabsTrigger>
              </TabsList>

              {/* Documents */}
              <TabsContent value="documents" className="pt-4 space-y-4">
                <div className="flex justify-end mb-4">
                  <Button className="cursor-pointer" onClick={() => setShowUploadDialog(true)}>
                    <Plus className="mr-2 size-4" />
                    Upload document
                  </Button>
                </div>
                {isLoadingDocuments ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
                ) : documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="flex items-center justify-between py-3 text-sm">
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-muted-foreground">
                              {documentCategoryLabels[doc.category]} ·{" "}
                              {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <a href={documentApi.getFileUrl(doc.id)} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm" className="cursor-pointer">
                              View
                            </Button>
                          </a>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
                    <FileText className="mx-auto size-6" />
                    <p>No documents uploaded yet.</p>
                  </div>
                )}
              </TabsContent>

              {/* Billing */}
              <TabsContent value="billing" className="pt-4">
                <div className="grid gap-4 sm:grid-cols-3 mb-4">
                  <Card>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Total invoiced</p>
                      <p className="text-xl font-bold">{formatTND(totalInvoiced)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Total paid</p>
                      <p className="text-xl font-bold">{formatTND(totalPaid)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                      <p className="text-xl font-bold">{formatTND(totalOutstanding)}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex justify-end mb-4">
                  <Button className="cursor-pointer" onClick={() => setShowInvoiceSheet(true)}>
                    <Plus className="mr-2 size-4" />
                    New invoice
                  </Button>
                </div>
                {isLoadingInvoices ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
                ) : invoices.length > 0 ? (
                  <div className="space-y-2">
                    {invoices.map((inv) => {
                      const isExpanded = expandedInvoiceId === inv.id
                      const paid = inv.payments.reduce((sum, p) => sum + p.amount, 0)
                      const balance = inv.total - paid

                      return (
                        <Card key={inv.id}>
                          <CardContent className="py-3 text-sm">
                            <button
                              className="flex w-full items-center justify-between cursor-pointer text-left"
                              onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                            >
                              <div>
                                <p className="font-medium">{inv.number}</p>
                                <p className="text-muted-foreground text-xs">
                                  {inv.doc_type === "quote" ? "Quote" : "Invoice"} ·{" "}
                                  Issued {new Date(inv.issue_date).toLocaleDateString()}
                                  {inv.payments.length > 0 &&
                                    ` · ${inv.payments.length} payment${inv.payments.length === 1 ? "" : "s"}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 text-right">
                                <div>
                                  <p className="font-medium">{formatTND(inv.total)}</p>
                                  <Badge variant="outline">{invoiceStatusLabels[inv.status]}</Badge>
                                </div>
                                <ChevronDown
                                  className="size-4 transition-transform"
                                  style={{
                                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                  }}
                                />
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="mt-3 space-y-3 border-t pt-3">
                                {inv.payments.length > 0 ? (
                                  <div className="space-y-2">
                                    {inv.payments.map((p) => (
                                      <div key={p.id} className="flex items-center justify-between text-xs">
                                        <div>
                                          <p className="font-medium">
                                            {formatTND(p.amount)} · {paymentMethodLabels[p.method]}
                                          </p>
                                          <p className="text-muted-foreground">
                                            {new Date(p.payment_date).toLocaleDateString()}
                                            {p.reference && ` · Ref: ${p.reference}`}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground text-xs">No payments recorded yet.</p>
                                )}

                                <div className="flex items-center justify-between border-t pt-2">
                                  <p className="text-xs">
                                    <span className="text-muted-foreground">Balance: </span>
                                    <span
                                      className={
                                        balance > 0
                                          ? "font-medium text-destructive"
                                          : "font-medium text-green-600"
                                      }
                                    >
                                      {formatTND(balance)}
                                    </span>
                                  </p>
                                  {balance > 0 && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="cursor-pointer"
                                      onClick={() => setPaymentTargetInvoice(inv)}
                                    >
                                      <Plus className="mr-1 size-3" />
                                      Record
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-sm space-y-2">
                    <Receipt className="mx-auto size-6" />
                    <p>No invoices or quotes yet.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
        patientId={patient.id}
        patientName={`${patient.first_name} ${patient.last_name}`}
        onCreated={refreshAppointments}
      />
      <QuickMessageDialog
        open={showMsgDialog}
        onOpenChange={setShowMsgDialog}
        patientName={`${patient.first_name} ${patient.last_name}`}
      />
      <PatientEditSheet
        patient={patient}
        open={showEditSheet}
        onOpenChange={setShowEditSheet}
        canEditClinical={canViewClinical}
        onSave={handleSaveEdit}
      />
      <TreatmentFormSheet
        patients={[toSimplePatient(patient)]}
        defaultPatientId={patient.id}
        trigger={null}
        open={showTreatmentSheet}
        onOpenChange={setShowTreatmentSheet}
        onSubmit={handleCreateTreatmentPlan}
      />
      <ReferralFormSheet
        patients={[toSimplePatient(patient)]}
        defaultPatientId={patient.id}
        trigger={null}
        open={showReferralSheet}
        onOpenChange={setShowReferralSheet}
        onSubmit={handleCreateReferral}
      />
      <UploadDocumentDialog
        onUploadDocument={handleUploadDocument}
        defaultPatientId={patient.id}
        trigger={null}
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
      />
      <InvoiceFormSheet
        onAddInvoice={handleCreateInvoice}
        defaultPatientId={patient.id}
        trigger={null}
        open={showInvoiceSheet}
        onOpenChange={setShowInvoiceSheet}
      />
      <RecordPaymentDialog
        invoice={paymentTargetInvoice}
        open={!!paymentTargetInvoice}
        onOpenChange={(open) => !open && setPaymentTargetInvoice(null)}
        onRecordPayment={(values) => {
          if (paymentTargetInvoice) {
            return handleRecordPayment(paymentTargetInvoice.id, values)
          }
        }}
      />
    </div>
  )
}