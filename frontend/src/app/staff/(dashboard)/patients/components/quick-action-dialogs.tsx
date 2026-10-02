"use client"

import { useEffect, useState } from "react"
import { format, parse } from "date-fns"
import { CalendarIcon, Repeat, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { appointmentApi } from "@/lib/api/appointments"
import { authApi } from "@/lib/api/auth"
import { careTypeApi } from "@/lib/api/care-types"
import { ApiError } from "@/lib/api/client"
import type { StaffMember } from "@/types/auth"
import type { CareType } from "@/types/care-type"
import type { RecurrenceFrequency } from "@/types/appointment"

const timeSlots = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
]

const recurrenceFrequencyLabels: Record<RecurrenceFrequency, string> = {
  weekly: "Every week",
  biweekly: "Every 2 weeks",
  monthly: "Every month",
}

interface QuickAppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  patientName: string
  onCreated?: () => void
}

export function QuickAppointmentDialog({
  open,
  onOpenChange,
  patientId,
  patientName,
  onCreated,
}: QuickAppointmentDialogProps) {
  const [date, setDate] = useState<Date>(new Date())
  const [time, setTime] = useState(timeSlots[2])
  const [showCalendar, setShowCalendar] = useState(false)

  const [dentists, setDentists] = useState<StaffMember[]>([])
  const [careTypes, setCareTypes] = useState<CareType[]>([])
  const [dentistId, setDentistId] = useState<string>("")
  const [careTypeId, setCareTypeId] = useState<string>("")
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  useEffect(() => {
    if (!open) return
    setIsRecurring(false)
    setRecurrenceFrequency("weekly")
    setRecurrenceEndType("count")
    setRecurrenceCount(6)
    let cancelled = false
    setLoadingOptions(true)
    Promise.all([authApi.staff.list("dentist"), careTypeApi.listCareTypes()])
      .then(([staffRes, careTypesRes]) => {
        if (cancelled) return
        setDentists(staffRes)
        setCareTypes(careTypesRes)
        setDentistId((current) => current || staffRes[0]?.id || "")
        setCareTypeId((current) => current || careTypesRes[0]?.id || "")
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(err instanceof ApiError ? err.message : "Couldn't load dentists or care types")
      })
      .finally(() => {
        if (!cancelled) setLoadingOptions(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const handleCreate = async () => {
    if (!dentistId || !careTypeId) {
      toast.error("Select a dentist and a type of care")
      return
    }
    const careType = careTypes.find((c) => c.id === careTypeId)
    const scheduledAt = parse(time, "h:mm a", date)

    setSubmitting(true)
    try {
      if (isRecurring) {
        const response = await appointmentApi.createRecurringAppointments({
          patient_id: patientId,
          dentist_id: dentistId,
          care_type_id: careTypeId,
          resource_id: null,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: careType?.default_duration_minutes ?? 30,
          prep_notes: null,
          internal_notes: null,
          recurrence: {
            frequency: recurrenceFrequency,
            count: recurrenceEndType === "count" ? recurrenceCount : null,
            until: recurrenceEndType === "until" ? recurrenceUntil.toISOString().slice(0, 10) : null,
          },
        })
        if (response.skipped.length > 0) {
          toast.warning(
            `${response.created.length} appointments scheduled, ${response.skipped.length} skipped (slot already taken)`
          )
        } else {
          toast.success(`${response.created.length} appointments scheduled for ${patientName}`)
        }
      } else {
        await appointmentApi.createAppointment({
          patient_id: patientId,
          dentist_id: dentistId,
          care_type_id: careTypeId,
          resource_id: null,
          scheduled_at: scheduledAt.toISOString(),
          duration_minutes: careType?.default_duration_minutes ?? 30,
          prep_notes: null,
          internal_notes: null,
        })
        toast.success(`Appointment scheduled for ${patientName}`, {
          description: `${format(date, "PPP")} at ${time}${careType ? ` — ${careType.name}` : ""}`,
        })
      }
      onOpenChange(false)
      onCreated?.()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't create the appointment")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for {patientName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start font-normal cursor-pointer">
                    <CalendarIcon className="mr-2 size-4" />
                    {format(date, "PP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      if (d) {
                        setDate(d)
                        setShowCalendar(false)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dentist</Label>
            <Select value={dentistId} onValueChange={setDentistId} disabled={loadingOptions}>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder={loadingOptions ? "Loading..." : "Select a dentist"} />
              </SelectTrigger>
              <SelectContent>
                {dentists.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    Dr. {d.first_name} {d.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Type of care</Label>
            <Select value={careTypeId} onValueChange={setCareTypeId} disabled={loadingOptions}>
              <SelectTrigger className="w-full cursor-pointer">
                <SelectValue placeholder={loadingOptions ? "Loading..." : "Select a type of care"} />
              </SelectTrigger>
              <SelectContent>
                {careTypes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 border rounded-md p-3">
            <div className="flex items-center space-x-2">
              <Switch id="quick-is-recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
              <Label htmlFor="quick-is-recurring" className="flex items-center gap-2 font-normal cursor-pointer">
                <Repeat className="w-4 h-4" />
                Recurring appointment
              </Label>
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={recurrenceFrequency}
                    onValueChange={(value) => setRecurrenceFrequency(value as RecurrenceFrequency)}
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(recurrenceFrequencyLabels) as RecurrenceFrequency[]).map((freq) => (
                        <SelectItem key={freq} value={freq}>{recurrenceFrequencyLabels[freq]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ends</Label>
                  <Select
                    value={recurrenceEndType}
                    onValueChange={(value) => setRecurrenceEndType(value as "count" | "until")}
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="count">After a number of visits</SelectItem>
                      <SelectItem value="until">On a specific date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {recurrenceEndType === "count" ? (
                  <div className="space-y-2">
                    <Label htmlFor="quick-recurrence-count">Number of visits</Label>
                    <Input
                      id="quick-recurrence-count"
                      type="number"
                      min={1}
                      max={104}
                      value={recurrenceCount}
                      onChange={(e) => setRecurrenceCount(Math.max(1, Math.min(104, parseInt(e.target.value, 10) || 1)))}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Last visit before</Label>
                    <Popover open={showRecurrenceUntilCalendar} onOpenChange={setShowRecurrenceUntilCalendar}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start font-normal cursor-pointer">
                          <CalendarIcon className="mr-2 size-4" />
                          {format(recurrenceUntil, "PP")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={recurrenceUntil}
                          onSelect={(d) => {
                            if (d) {
                              setRecurrenceUntil(d)
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
                  Slots that are already taken will be skipped — you'll see which after creating.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="cursor-pointer"
            onClick={handleCreate}
            disabled={submitting || loadingOptions || !dentistId || !careTypeId}
          >
            {isRecurring ? "Create recurring appointments" : "Create appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface QuickMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName: string
}

export function QuickMessageDialog({ open, onOpenChange, patientName }: QuickMessageDialogProps) {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (!message.trim()) return
    toast.success(`Message sent to ${patientName}`)
    setMessage("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Message {patientName}</DialogTitle>
          <DialogDescription>
            This opens a direct conversation with the patient.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          autoFocus
        />

        <DialogFooter>
          <Button variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="cursor-pointer" onClick={handleSend} disabled={!message.trim()}>
            <Send className="mr-2 size-4" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}