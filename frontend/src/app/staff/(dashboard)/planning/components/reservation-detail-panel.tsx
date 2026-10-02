"use client"

import { useEffect, useState, type ReactNode } from "react"
import {
  Pencil,
  Phone,
  Mail,
  MapPin,
  Cake,
  Stethoscope,
  CalendarDays,
  Clock,
  Bell,
  ClipboardList,
  ClipboardCheck,
  CircleCheck,
  AlertTriangle,
  CalendarCheck,
  UserX,
  Ban,
  MoreHorizontal,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

import { type Appointment, type Practitioner, type CareType, statusColors, statusLabels } from "../types"
import { practitionerSwatch } from "../data"
import { patientApi } from "@/lib/api/patients"
import type { Patient as PatientDetails } from "@/types/patient"

// Status of the two clinical sub-flows this panel gates "Terminer le
// rendez-vous" behind. Sourced from the appointment once
// `medical_checkup_id` / `medical_record_id` land on the backend — passed
// in as props for now so this panel can ship before that schema change.
export type ClinicalFlowStatus = "not_started" | "in_progress" | "completed"

interface ReservationDetailPanelProps {
  appointment: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  careTypes: CareType[]
  dentists: Practitioner[]
  /** Whether this appointment's care type requires a checkup before it can be finished. */
  requiresCheckup: boolean
  checkupStatus: ClinicalFlowStatus
  medicalRecordStatus: ClinicalFlowStatus
  onEdit: (appointment: Appointment) => void
  onCheckIn?: (appointmentId: string) => void
  onMarkNoShow?: (appointmentId: string) => void
  onCancel?: (appointmentId: string) => void
  onSendReminder?: (appointmentId: string) => void
  onOpenCheckup?: (appointment: Appointment) => void
  onOpenMedicalRecord?: (appointment: Appointment) => void
  onFinish?: (appointmentId: string) => void
}

function ageFromDob(dob: string): number | null {
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const hasHadBirthdayThisYear =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

function ClinicalFlowRow({
  icon,
  title,
  description,
  status,
  onOpen,
}: {
  icon: ReactNode
  title: string
  description: string
  status: ClinicalFlowStatus
  onOpen?: () => void
}) {
  const done = status === "completed"
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer",
        done
          ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
          : "border-border hover:bg-muted/50"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          done ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
        )}
      >
        {done ? <CircleCheck className="h-5 w-5" /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground truncate">
          {done ? "Complété" : status === "in_progress" ? "En cours — à reprendre" : description}
        </div>
      </div>
    </button>
  )
}

export function ReservationDetailPanel({
  appointment,
  open,
  onOpenChange,
  careTypes,
  dentists,
  requiresCheckup,
  checkupStatus,
  medicalRecordStatus,
  onEdit,
  onCheckIn,
  onMarkNoShow,
  onCancel,
  onSendReminder,
  onOpenCheckup,
  onOpenMedicalRecord,
  onFinish,
}: ReservationDetailPanelProps) {
  const [patient, setPatient] = useState<PatientDetails | null>(null)
  const [patientLoading, setPatientLoading] = useState(false)

  // Fetch the full patient record (address, dob, allergies...) whenever a
  // new appointment is opened — the planning-local Appointment only carries
  // the slim {patientId, patientName, patientInitials} needed for the
  // calendar, not the full profile this panel needs.
  useEffect(() => {
    if (!open || !appointment?.patientId) {
      setPatient(null)
      return
    }
    let cancelled = false
    setPatientLoading(true)
    patientApi
      .getPatient(appointment.patientId)
      .then((p) => {
        if (!cancelled) setPatient(p)
      })
      .catch(() => {
        if (!cancelled) setPatient(null)
      })
      .finally(() => {
        if (!cancelled) setPatientLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, appointment?.patientId])

  if (!appointment) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md" />
      </Sheet>
    )
  }

  const careType = careTypes.find((c) => c.id === appointment.careTypeId)
  const dentist = dentists.find((d) => d.id === appointment.dentistId)
  const age = patient?.dob ? ageFromDob(patient.dob) : null

  const canFinish =
    !requiresCheckup || (checkupStatus === "completed" && medicalRecordStatus !== "not_started")
  const isTerminal = appointment.status === "completed" || appointment.status === "cancelled"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0">
        <SheetHeader className="p-4 pb-3 border-b shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <SheetTitle className="flex items-center gap-2 text-base">
                Rendez-vous
                <span className="font-mono text-xs text-muted-foreground font-normal">
                  #{appointment.id.slice(0, 8).toUpperCase()}
                </span>
              </SheetTitle>
              <SheetDescription className="sr-only">
                Détail du rendez-vous et suivi clinique
              </SheetDescription>
              {!appointment.seriesId && (
                <span className="mt-1 inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Rendez-vous manuel
                </span>
              )}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="cursor-pointer shrink-0"
              title="Modifier le rendez-vous"
              onClick={() => onEdit(appointment)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Patient card */}
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              <AvatarFallback className={cn("text-sm font-medium text-white", careType?.color)}>
                {appointment.patientInitials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{appointment.patientName}</div>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium text-white",
                  statusColors[appointment.status]
                )}
              >
                {statusLabels[appointment.status]}
              </span>
            </div>
            {!isTerminal && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="cursor-pointer shrink-0" title="Autres actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(appointment.status === "pending" || appointment.status === "confirmed") && (
                    <DropdownMenuItem className="cursor-pointer" onClick={() => onCheckIn?.(appointment.id)}>
                      <CalendarCheck className="w-4 h-4 mr-2" />
                      Marquer arrivé
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="cursor-pointer" onClick={() => onMarkNoShow?.(appointment.id)}>
                    <UserX className="w-4 h-4 mr-2" />
                    Marquer absence
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => onCancel?.(appointment.id)}
                  >
                    <Ban className="w-4 h-4 mr-2" />
                    Annuler le RDV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Alert banner — from the patient's own declared allergies, not invented copy */}
          {patient?.allergies && patient.allergies.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium">Allergies : </span>
                {patient.allergies.join(", ")}
              </div>
            </div>
          )}

          <Separator />

          {/* Summary row */}
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className={cn("w-2 h-2 rounded-full shrink-0", careType?.color)} />
              <span className="truncate">{careType?.name ?? "Soin"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">
                {format(appointment.date, "PPP", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{appointment.time} · {appointment.duration}</span>
            </div>
            {dentist && (
              <div className="flex items-center gap-2.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback
                    className={cn("text-[10px] text-white", practitionerSwatch(dentist.color).className)}
                    style={practitionerSwatch(dentist.color).style}
                  >
                    {dentist.initials}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">Dr {dentist.firstName} {dentist.lastName}</span>
              </div>
            )}
          </div>

          {/* Reminder — kept as a single action, not embedded billing logic */}
          {onSendReminder && !isTerminal && (
            <Button
              variant="outline"
              size="sm"
              className="w-full cursor-pointer"
              onClick={() => onSendReminder(appointment.id)}
            >
              <Bell className="h-3.5 w-3.5 mr-2" />
              Envoyer un rappel
            </Button>
          )}

          <Separator />

          {/* General info */}
          {patientLoading ? (
            <div className="text-xs text-muted-foreground">Chargement des informations patient…</div>
          ) : patient ? (
            <div className="space-y-2 text-sm">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Informations générales
              </div>
              {patient.phone && (
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-foreground">{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-foreground truncate">{patient.email}</span>
                </div>
              )}
              {age !== null && (
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Cake className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-foreground">{age} ans</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-2.5 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span className="text-foreground">{patient.address}</span>
                </div>
              )}
            </div>
          ) : null}

          <Separator />

          {/* Clinical flows */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Suivi clinique
            </div>
            <ClinicalFlowRow
              icon={<ClipboardCheck className="h-4 w-4" />}
              title="Bilan médical"
              description={requiresCheckup ? "Requis pour ce type de soin" : "Optionnel pour ce type de soin"}
              status={checkupStatus}
              onOpen={() => onOpenCheckup?.(appointment)}
            />
            <ClinicalFlowRow
              icon={<ClipboardList className="h-4 w-4" />}
              title="Dossier médical"
              description="Ajouter une note clinique pour cette visite"
              status={medicalRecordStatus}
              onOpen={() => onOpenMedicalRecord?.(appointment)}
            />
          </div>
        </div>

        <div className="shrink-0 p-4 border-t space-y-2">
          {requiresCheckup && !canFinish && (
            <p className="text-xs text-muted-foreground">
              Le bilan médical et le dossier médical doivent être complétés avant de terminer ce rendez-vous.
            </p>
          )}
          <Button
            className="w-full cursor-pointer"
            disabled={isTerminal || !canFinish}
            onClick={() => onFinish?.(appointment.id)}
          >
            {appointment.status === "completed" ? "Rendez-vous terminé" : "Terminer le rendez-vous"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}