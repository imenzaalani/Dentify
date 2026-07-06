"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CalendarIcon,
  Clock,
  Stethoscope,
  User,
  FileText,
  Bell,
  Search,
  MoreHorizontal,
  CircleCheck,
  UserX,
  Ban,
  Armchair,
  CalendarCheck,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { type Appointment, type Practitioner, type Patient, type CareType, type Resource, statusColors, statusLabels } from "../types"

interface AppointmentFormProps {
  appointment?: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (appointment: Partial<Appointment>) => void
  onCancel?: (appointmentId: number, reason?: string) => void
  onMarkCompleted?: (appointmentId: number) => void
  onMarkNoShow?: (appointmentId: number) => void
  onCheckIn?: (appointmentId: number) => void
  patients: Patient[]
  dentists: Practitioner[]
  careTypes: CareType[]
  resources: Resource[]
  // Pre-fills a brand-new appointment (e.g. from "Planifier le rendez-vous"
  // on a waitlist entry) without pretending it's an existing one to edit.
  prefill?: { patientId: string; patientName: string; careTypeId: string } | null
}

const timeSlots = [
  "8h00", "8h30", "9h00", "9h30", "10h00", "10h30", "11h00", "11h30",
  "12h00", "12h30", "13h00", "13h30", "14h00", "14h30", "15h00", "15h30",
  "16h00", "16h30", "17h00", "17h30", "18h00", "18h30", "19h00", "19h30",
]

const durationOptions = ["15 min", "30 min", "45 min", "1 hour", "1.5 hours", "2 hours"]

export function AppointmentForm({
  appointment,
  open,
  onOpenChange,
  onSave,
  onCancel,
  onMarkCompleted,
  onMarkNoShow,
  onCheckIn,
  patients,
  dentists,
  careTypes,
  resources,
  prefill,
}: AppointmentFormProps) {
  const [patientQuery, setPatientQuery] = useState(appointment?.patientName || "")
  const [showPatientResults, setShowPatientResults] = useState(false)
  const [showCancelReason, setShowCancelReason] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")

  const [formData, setFormData] = useState({
    patientId: appointment?.patientId || prefill?.patientId || "",
    patientName: appointment?.patientName || prefill?.patientName || "",
    dentistId: appointment?.dentistId || dentists[0]?.id || "",
    resourceId: appointment?.resourceId || "",
    careTypeId: appointment?.careTypeId || prefill?.careTypeId || careTypes[0]?.id || "",
    date: appointment?.date || new Date(),
    time: appointment?.time || "9h00",
    duration: appointment?.duration || careTypes[0]?.defaultDuration || "30 min",
    prepNotes: appointment?.prepNotes || "",
    internalNotes: appointment?.internalNotes || "",
    sendConfirmation: appointment?.sendConfirmation ?? true,
  })

  // Re-sync the form every time it's opened — otherwise, since this
  // component stays mounted while the Dialog just toggles visibility, a
  // second appointment (or a waitlist prefill) would keep showing the
  // first one's stale data.
  useEffect(() => {
    if (!open) return
    setFormData({
      patientId: appointment?.patientId || prefill?.patientId || "",
      patientName: appointment?.patientName || prefill?.patientName || "",
      dentistId: appointment?.dentistId || dentists[0]?.id || "",
      resourceId: appointment?.resourceId || "",
      careTypeId: appointment?.careTypeId || prefill?.careTypeId || careTypes[0]?.id || "",
      date: appointment?.date || new Date(),
      time: appointment?.time || "9h00",
      duration: appointment?.duration || careTypes[0]?.defaultDuration || "30 min",
      prepNotes: appointment?.prepNotes || "",
      internalNotes: appointment?.internalNotes || "",
      sendConfirmation: appointment?.sendConfirmation ?? true,
    })
    setPatientQuery(appointment?.patientName || prefill?.patientName || "")
    setShowCancelReason(false)
    setCancellationReason("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment, prefill])

  const [showCalendar, setShowCalendar] = useState(false)

  const filteredPatients = useMemo(() => {
    if (!patientQuery.trim()) return patients
    const q = patientQuery.toLowerCase()
    return patients.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
    )
  }, [patientQuery, patients])

  const selectedCareType = careTypes.find((c) => c.id === formData.careTypeId)

  const handlePatientSelect = (patient: Patient) => {
    setFormData((prev) => ({ ...prev, patientId: patient.id, patientName: `${patient.firstName} ${patient.lastName}` }))
    setPatientQuery(`${patient.firstName} ${patient.lastName}`)
    setShowPatientResults(false)
  }

  const handleCareTypeChange = (careTypeId: string) => {
    const care = careTypes.find((c) => c.id === careTypeId)
    setFormData((prev) => ({
      ...prev,
      careTypeId,
      duration: care?.defaultDuration || prev.duration,
    }))
  }

  const handleSave = () => {
    const dentist = dentists.find((d) => d.id === formData.dentistId)
    const care = careTypes.find((c) => c.id === formData.careTypeId)

    onSave({
      ...formData,
      id: appointment?.id,
      dentistName: dentist ? `Dr. ${dentist.firstName} ${dentist.lastName}` : "",
      careLabel: care?.name || "",
      category: care?.category,
      color: care?.color,
    })
    onOpenChange(false)
  }

  const handleConfirmCancel = () => {
    if (appointment?.id && onCancel) {
      onCancel(appointment.id, cancellationReason)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", selectedCareType?.color)} />
            {appointment ? "Modifier le rendez-vous" : "Nouveau rendez-vous"}
          </DialogTitle>
          <DialogDescription>
            {appointment
              ? "Modifier les informations de ce rendez-vous"
              : "Planifier un nouveau rendez-vous au cabinet"}
          </DialogDescription>
        </DialogHeader>

        {appointment && (
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white", statusColors[appointment.status])}>
              {statusLabels[appointment.status]}
            </span>
            {appointment.status === "cancelled" && appointment.cancellationReason && (
              <span className="text-xs text-muted-foreground">— {appointment.cancellationReason}</span>
            )}
          </div>
        )}

        <div className="space-y-6 py-2">
          {/* Patient search */}
          <div className="space-y-2 relative">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient *
            </Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un patient par nom..."
                className="pl-9"
                value={patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value)
                  setShowPatientResults(true)
                }}
                onFocus={() => setShowPatientResults(true)}
              />
            </div>
            {showPatientResults && (
              <div className="border rounded-md shadow-sm bg-popover max-h-48 overflow-y-auto z-10 relative">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-2 hover:bg-accent text-left cursor-pointer"
                      onClick={() => handlePatientSelect(p)}
                    >
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-[10px]">{p.initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm truncate">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.phone}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-sm text-muted-foreground">
                    Aucun patient trouvé.{" "}
                    <button type="button" className="text-primary underline cursor-pointer">
                      Créer un nouveau patient
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Practitioner and Care type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4" />
                Praticien *
              </Label>
              <Select value={formData.dentistId} onValueChange={(value) => setFormData((prev) => ({ ...prev, dentistId: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dentists.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full", d.color)} />
                        Dr. {d.firstName} {d.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Type de soin *</Label>
              <Select value={formData.careTypeId} onValueChange={handleCareTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {careTypes.filter((c) => c.active).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2.5 h-2.5 rounded-full", c.color)} />
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resource (chair/room) */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Armchair className="w-4 h-4" />
              Fauteuil / Salle
            </Label>
            <Select
              value={formData.resourceId || "none"}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, resourceId: value === "none" ? "" : value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Aucune ressource assignée" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucune ressource assignée</SelectItem>
                {resources.filter((r) => r.active).map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Date *
              </Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {format(formData.date, "PPP", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) => {
                      if (date) {
                        setFormData((prev) => ({ ...prev, date }))
                        setShowCalendar(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Heure de début *
              </Label>
              <Select value={formData.time} onValueChange={(value) => setFormData((prev) => ({ ...prev, time: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration and confirmation toggle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Durée *</Label>
              <Select value={formData.duration} onValueChange={(value) => setFormData((prev) => ({ ...prev, duration: value }))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((duration) => (
                    <SelectItem key={duration} value={duration}>{duration}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Confirmation
              </Label>
              <div className="flex items-center space-x-2 h-10">
                <Switch
                  id="send-confirmation"
                  checked={formData.sendConfirmation}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, sendConfirmation: checked }))}
                />
                <Label htmlFor="send-confirmation" className="text-sm font-normal">
                  Envoyer un email de confirmation au patient
                </Label>
              </div>
            </div>
          </div>

          {/* Prep notes */}
          <div className="space-y-2">
            <Label htmlFor="prep-notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes préparatoires
            </Label>
            <Textarea
              id="prep-notes"
              placeholder="Informations visibles par le patient (ex: venir à jeun)..."
              value={formData.prepNotes}
              onChange={(e) => setFormData((prev) => ({ ...prev, prepNotes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Internal notes */}
          <div className="space-y-2">
            <Label htmlFor="internal-notes">Notes internes</Label>
            <Textarea
              id="internal-notes"
              placeholder="Notes non visibles par le patient..."
              value={formData.internalNotes}
              onChange={(e) => setFormData((prev) => ({ ...prev, internalNotes: e.target.value }))}
              rows={2}
            />
          </div>

          {/* Cancellation reason, shown inline before confirming cancel */}
          {showCancelReason && (
            <div className="space-y-2 border rounded-md p-3 bg-destructive/5">
              <Label htmlFor="cancel-reason">Motif d'annulation</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Préciser le motif d'annulation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2 pt-1">
                <Button variant="destructive" size="sm" className="cursor-pointer" onClick={handleConfirmCancel}>
                  Confirmer l'annulation
                </Button>
                <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setShowCancelReason(false)}>
                  Retour
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!showCancelReason && (
            <div className="flex items-center gap-2 pt-4 border-t">
              <Button onClick={handleSave} className="flex-1 cursor-pointer">
                {appointment ? "Mettre à jour" : "Créer le rendez-vous"}
              </Button>

              {appointment && appointment.status !== "completed" && appointment.status !== "cancelled" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="cursor-pointer shrink-0" title="Autres actions">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {(appointment.status === "pending" || appointment.status === "confirmed") && (
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => appointment.id && onCheckIn?.(appointment.id)}
                      >
                        <CalendarCheck className="w-4 h-4 mr-2" />
                        Marquer arrivé
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => appointment.id && onMarkCompleted?.(appointment.id)}
                    >
                      <CircleCheck className="w-4 h-4 mr-2" />
                      Marquer comme terminé
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => appointment.id && onMarkNoShow?.(appointment.id)}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Marquer absence
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={() => setShowCancelReason(true)}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Annuler le RDV
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button onClick={() => onOpenChange(false)} variant="ghost" className="cursor-pointer shrink-0">
                Fermer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}