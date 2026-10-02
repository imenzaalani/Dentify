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
  Repeat,
  ClipboardList,
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
import {
  type Appointment,
  type Practitioner,
  type Patient,
  type CareType,
  type Resource,
  type RecurrenceFrequency,
  recurrenceFrequencyLabels,
  statusColors,
  statusLabels,
} from "../types"
import { durationToMinutes, practitionerSwatch } from "../data"
import { buildDaySlots, slotStatusLabels, type SlotStatus } from "../availability"
import { treatmentApi } from "@/lib/api/treatments"
import type { TreatmentPlan } from "@/types/treatment"

export interface RecurrenceFormData {
  frequency: RecurrenceFrequency
  endType: "count" | "until"
  count: number
  until: Date
}

interface AppointmentFormProps {
  appointment?: Appointment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (appointment: Partial<Appointment>) => void
  // Only fired for a brand-new appointment with the recurrence toggle on —
  // editing an existing occurrence never turns it into a series.
  onSaveRecurring?: (appointment: Partial<Appointment>, recurrence: RecurrenceFormData) => void
  onCancel?: (appointmentId: string, reason?: string) => void
  onCancelSeries?: (seriesId: string, reason?: string) => void
  onMarkCompleted?: (appointmentId: string) => void
  onMarkNoShow?: (appointmentId: string) => void
  onCheckIn?: (appointmentId: string) => void
  patients: Patient[]
  dentists: Practitioner[]
  careTypes: CareType[]
  resources: Resource[]
  // Full appointment list, used to compute real slot availability (dentist
  // and chair/room conflicts) instead of a hardcoded always-open grid.
  appointments: Appointment[]
  // Pre-fills a brand-new appointment — either from "Planifier le
  // rendez-vous" on a waitlist entry (patient + care type), or from
  // clicking an empty slot in the day view (date + time + dentist) —
  // without pretending it's an existing one to edit.
  prefill?: {
    patientId?: string
    patientName?: string
    careTypeId?: string
    date?: Date
    time?: string
    dentistId?: string
  } | null
}

const durationOptions = ["15 min", "30 min", "45 min", "1 hour", "1.5 hours", "2 hours"]

export function AppointmentForm({
  appointment,
  open,
  onOpenChange,
  onSave,
  onSaveRecurring,
  onCancel,
  onCancelSeries,
  onMarkCompleted,
  onMarkNoShow,
  onCheckIn,
  patients,
  dentists,
  careTypes,
  resources,
  appointments,
  prefill,
}: AppointmentFormProps) {
  const [patientQuery, setPatientQuery] = useState(appointment?.patientName || "")
  const [showPatientResults, setShowPatientResults] = useState(false)
  const [showCancelReason, setShowCancelReason] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [cancelTarget, setCancelTarget] = useState<"single" | "series">("single")

  // Recurrence — only meaningful when creating a brand-new appointment;
  // reset whenever the dialog opens fresh (see the sync effect below).
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency>("weekly")
  const [recurrenceEndType, setRecurrenceEndType] = useState<"count" | "until">("count")
  const [recurrenceCount, setRecurrenceCount] = useState(6)
  const [recurrenceUntil, setRecurrenceUntil] = useState<Date>(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 3)
    return d
  })
  const [showRecurrenceUntilCalendar, setShowRecurrenceUntilCalendar] = useState(false)

  const [formData, setFormData] = useState({
    patientId: appointment?.patientId || prefill?.patientId || "",
    patientName: appointment?.patientName || prefill?.patientName || "",
    dentistId: appointment?.dentistId || prefill?.dentistId || dentists[0]?.id || "",
    resourceId: appointment?.resourceId || "",
    careTypeId: appointment?.careTypeId || prefill?.careTypeId || careTypes[0]?.id || "",
    date: appointment?.date || prefill?.date || new Date(),
    time: appointment?.time || prefill?.time || "9h00",
    duration: appointment?.duration || careTypes[0]?.defaultDuration || "30 min",
    treatmentStepId: appointment?.treatmentStepId || "",
    prepNotes: appointment?.prepNotes || "",
    internalNotes: appointment?.internalNotes || "",
    sendConfirmation: appointment?.sendConfirmation ?? true,
  })

  // The patient's active treatment plan, fetched fresh whenever the
  // selected patient changes — powers the "linked step" selector below.
  // Not every patient has one, so null is the normal case, not an error.
  const [activeTreatmentPlan, setActiveTreatmentPlan] = useState<TreatmentPlan | null>(null)

  // Re-sync the form every time it's opened — otherwise, since this
  // component stays mounted while the Dialog just toggles visibility, a
  // second appointment (or a waitlist prefill) would keep showing the
  // first one's stale data.
  useEffect(() => {
    if (!open) return
    setFormData({
      patientId: appointment?.patientId || prefill?.patientId || "",
      patientName: appointment?.patientName || prefill?.patientName || "",
      dentistId: appointment?.dentistId || prefill?.dentistId || dentists[0]?.id || "",
      resourceId: appointment?.resourceId || "",
      careTypeId: appointment?.careTypeId || prefill?.careTypeId || careTypes[0]?.id || "",
      date: appointment?.date || prefill?.date || new Date(),
      time: appointment?.time || prefill?.time || "9h00",
      duration: appointment?.duration || careTypes[0]?.defaultDuration || "30 min",
      treatmentStepId: appointment?.treatmentStepId || "",
      prepNotes: appointment?.prepNotes || "",
      internalNotes: appointment?.internalNotes || "",
      sendConfirmation: appointment?.sendConfirmation ?? true,
    })
    setPatientQuery(appointment?.patientName || prefill?.patientName || "")
    setShowCancelReason(false)
    setCancellationReason("")
    setCancelTarget("single")
    setIsRecurring(false)
    setRecurrenceFrequency("weekly")
    setRecurrenceEndType("count")
    setRecurrenceCount(6)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment, prefill])

  const [showCalendar, setShowCalendar] = useState(false)

  // Load the selected patient's active treatment plan (if any) so its steps
  // can be offered in the selector below. Re-runs whenever the patient
  // changes — including when the dialog first opens for an existing
  // appointment, so its already-linked step still resolves to a label.
  useEffect(() => {
    if (!open || !formData.patientId) {
      setActiveTreatmentPlan(null)
      return
    }
    let cancelled = false
    treatmentApi
      .listTreatmentPlans()
      .then((plans) => {
        const patientPlans = plans.filter((p) => p.patient_id === formData.patientId)
        // Prefer a plan already in progress over one that's merely planned —
        // that's the one staff are actively working through with the
        // patient. Fall back to the most recently created plan of either
        // status; completed/abandoned plans are excluded, nothing left to
        // book against.
        const active =
          patientPlans.find((p) => p.status === "in_progress") ??
          patientPlans.find((p) => p.status === "planned") ??
          null
        if (!active) {
          if (!cancelled) setActiveTreatmentPlan(null)
          return null
        }
        return treatmentApi.getTreatmentPlan(active.id)
      })
      .then((plan) => {
        if (!cancelled && plan) setActiveTreatmentPlan(plan)
      })
      .catch(() => {
        if (!cancelled) setActiveTreatmentPlan(null)
      })
    return () => {
      cancelled = true
    }
  }, [open, formData.patientId])

  const filteredPatients = useMemo(() => {
    if (!patientQuery.trim()) return patients
    const q = patientQuery.toLowerCase()
    return patients.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)
    )
  }, [patientQuery, patients])

  const selectedCareType = careTypes.find((c) => c.id === formData.careTypeId)
  const selectedDentist = dentists.find((d) => d.id === formData.dentistId)

  const daySlots = useMemo(
    () =>
      buildDaySlots({
        date: formData.date,
        dentist: selectedDentist,
        durationMinutes: durationToMinutes(formData.duration),
        resourceId: formData.resourceId || undefined,
        appointments,
        excludeAppointmentId: appointment?.id,
      }),
    [formData.date, formData.duration, formData.resourceId, selectedDentist, appointments, appointment?.id]
  )

  const selectedSlotStatus: SlotStatus | undefined = daySlots.slots.find((s) => s.time === formData.time)?.status
  const selectedSlotUnavailable = selectedSlotStatus !== undefined && selectedSlotStatus !== "available"

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
    if (selectedSlotUnavailable) return

    const dentist = dentists.find((d) => d.id === formData.dentistId)
    const care = careTypes.find((c) => c.id === formData.careTypeId)

    const enriched: Partial<Appointment> = {
      ...formData,
      id: appointment?.id,
      dentistName: dentist ? `Dr. ${dentist.firstName} ${dentist.lastName}` : "",
      careLabel: care?.name || "",
      category: care?.category,
      color: care?.color,
    }

    if (!appointment && isRecurring && onSaveRecurring) {
      onSaveRecurring(enriched, {
        frequency: recurrenceFrequency,
        endType: recurrenceEndType,
        count: recurrenceCount,
        until: recurrenceUntil,
      })
    } else {
      onSave(enriched)
    }
    onOpenChange(false)
  }

  const handleConfirmCancel = () => {
    if (appointment?.id && onCancel) {
      onCancel(appointment.id, cancellationReason)
      onOpenChange(false)
    }
  }

  const handleConfirmCancelSeries = () => {
    if (appointment?.seriesId && onCancelSeries) {
      onCancelSeries(appointment.seriesId, cancellationReason)
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
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white", statusColors[appointment.status])}>
              {statusLabels[appointment.status]}
            </span>
            {appointment.seriesId && (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                <Repeat className="w-3 h-3" />
                Rendez-vous récurrent{appointment.seriesOccurrenceIndex ? ` (n°${appointment.seriesOccurrenceIndex})` : ""}
              </span>
            )}
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
                        <div
                          className={cn("w-2.5 h-2.5 rounded-full", practitionerSwatch(d.color).className)}
                          style={practitionerSwatch(d.color).style}
                        />
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

          {/* Linked treatment step — only shown when the patient has an
              active treatment plan with steps to pick from. */}
          {activeTreatmentPlan && activeTreatmentPlan.steps.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Étape du plan de traitement
              </Label>
              <Select
                value={formData.treatmentStepId || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, treatmentStepId: value === "none" ? "" : value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Aucune étape liée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune étape liée</SelectItem>
                  {activeTreatmentPlan.steps
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((step) => (
                      <SelectItem
                        key={step.id}
                        value={step.id}
                        disabled={step.status === "completed" && step.id !== formData.treatmentStepId}
                      >
                        {step.label}
                        {step.tooth ? ` — dent ${step.tooth}` : ""}
                        {step.status === "completed" ? " (terminée)" : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Plan : {activeTreatmentPlan.title}
              </p>
            </div>
          )}

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
                <SelectTrigger className={cn("w-full", selectedSlotUnavailable && "border-destructive")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daySlots.slots.map((slot) => (
                    <SelectItem key={slot.time} value={slot.time} disabled={slot.status !== "available"}>
                      {slot.time}
                      {slot.status !== "available" && ` — ${slotStatusLabels[slot.status]}`}
                    </SelectItem>
                  ))}
                  {daySlots.slots.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground">Aucun créneau ce jour-là</div>
                  )}
                </SelectContent>
              </Select>
              {daySlots.dayOff && (
                <p className="text-xs text-destructive">Ce praticien ne travaille pas ce jour-là.</p>
              )}
              {!daySlots.dayOff && selectedSlotUnavailable && (
                <p className="text-xs text-destructive">
                  Ce créneau n'est plus disponible ({slotStatusLabels[selectedSlotStatus as Exclude<SlotStatus, "available">]}). Choisissez-en un autre.
                </p>
              )}
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

          {/* Recurrence — only offered when creating a brand-new appointment;
              turning an existing occurrence into a series isn't supported. */}
          {!appointment && (
            <div className="space-y-3 border rounded-md p-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is-recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
                <Label htmlFor="is-recurring" className="flex items-center gap-2 font-normal cursor-pointer">
                  <Repeat className="w-4 h-4" />
                  Rendez-vous récurrent
                </Label>
              </div>

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-2">
                    <Label>Fréquence</Label>
                    <Select
                      value={recurrenceFrequency}
                      onValueChange={(value) => setRecurrenceFrequency(value as RecurrenceFrequency)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(recurrenceFrequencyLabels) as RecurrenceFrequency[]).map((freq) => (
                          <SelectItem key={freq} value={freq}>
                            {recurrenceFrequencyLabels[freq]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Se termine</Label>
                    <Select
                      value={recurrenceEndType}
                      onValueChange={(value) => setRecurrenceEndType(value as "count" | "until")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">Après un nombre d'occurrences</SelectItem>
                        <SelectItem value="until">À une date précise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {recurrenceEndType === "count" ? (
                    <div className="space-y-2">
                      <Label htmlFor="recurrence-count">Nombre d'occurrences</Label>
                      <Input
                        id="recurrence-count"
                        type="number"
                        min={1}
                        max={104}
                        value={recurrenceCount}
                        onChange={(e) => setRecurrenceCount(Math.max(1, Math.min(104, parseInt(e.target.value, 10) || 1)))}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Dernière occurrence avant</Label>
                      <Popover open={showRecurrenceUntilCalendar} onOpenChange={setShowRecurrenceUntilCalendar}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            {format(recurrenceUntil, "PPP", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={recurrenceUntil}
                            onSelect={(date) => {
                              if (date) {
                                setRecurrenceUntil(date)
                                setShowRecurrenceUntilCalendar(false)
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground col-span-2">
                    Les créneaux déjà pris seront ignorés — vous verrez lesquels après la création.
                  </p>
                </div>
              )}
            </div>
          )}

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
                <Button
                  variant="destructive"
                  size="sm"
                  className="cursor-pointer"
                  onClick={cancelTarget === "series" ? handleConfirmCancelSeries : handleConfirmCancel}
                >
                  {cancelTarget === "series" ? "Confirmer l'annulation de la série" : "Confirmer l'annulation"}
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
              <Button onClick={handleSave} disabled={selectedSlotUnavailable} className="flex-1 cursor-pointer">
                {appointment
                  ? "Mettre à jour"
                  : isRecurring
                    ? "Créer la série de rendez-vous"
                    : "Créer le rendez-vous"}
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
                      onClick={() => {
                        setCancelTarget("single")
                        setShowCancelReason(true)
                      }}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Annuler le RDV
                    </DropdownMenuItem>
                    {appointment.seriesId && onCancelSeries && (
                      <DropdownMenuItem
                        className="cursor-pointer text-destructive focus:text-destructive"
                        onClick={() => {
                          setCancelTarget("series")
                          setShowCancelReason(true)
                        }}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Annuler toute la série à venir
                      </DropdownMenuItem>
                    )}
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