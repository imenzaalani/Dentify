"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"

import { appointmentApi } from "@/lib/api/appointments"
import { treatmentApi } from "@/lib/api/treatments"
import { ApiError } from "@/lib/api/client"
import { type Appointment, type BlockedSlot } from "./types"
import { buildAppointment, buildAppointments, combineDateAndTime, durationToMinutes, type AppointmentRefData } from "./data"
import type { RecurrenceFormData } from "./components/appointment-form"

export interface UsePlanningState {
  selectedDate: Date
  showAppointmentForm: boolean
  editingAppointment: Appointment | null
  showPlanningSheet: boolean
  appointments: Appointment[]
  blockedSlots: BlockedSlot[]
  showBlockSlotForm: boolean
}

export interface UsePlanningActions {
  setSelectedDate: (date: Date) => void
  setShowAppointmentForm: (show: boolean) => void
  setEditingAppointment: (appointment: Appointment | null) => void
  setShowPlanningSheet: (show: boolean) => void
  setShowBlockSlotForm: (show: boolean) => void
  handleDateSelect: (date: Date) => void
  handleNewAppointment: () => void
  handleBlockSlot: () => void
  handleSaveBlockedSlot: (slot: Omit<BlockedSlot, "id">) => void
  handleRemoveBlockedSlot: (id: string) => void
  handleSaveAppointment: (appointmentData: Partial<Appointment>) => Promise<void>
  handleSaveRecurringAppointment: (appointmentData: Partial<Appointment>, recurrence: RecurrenceFormData) => Promise<void>
  handleCancelAppointment: (appointmentId: string, reason?: string) => Promise<void>
  handleCancelSeries: (seriesId: string, reason?: string) => Promise<void>
  handleMarkCompleted: (appointmentId: string) => Promise<void>
  handleMarkNoShow: (appointmentId: string) => Promise<void>
  handleCheckIn: (appointmentId: string) => Promise<void>
  handleEditAppointment: (appointment: Appointment) => void
  handleRescheduleAppointment: (appointmentId: string, date: Date, time: string, dentistId?: string) => Promise<void>
}

export interface UsePlanningReturn extends UsePlanningState, UsePlanningActions {}

export interface UsePlanningOptions {
  onCreated?: (appointment: Appointment) => void
}

function errorMessage(err: unknown): string | undefined {
  return err instanceof ApiError || err instanceof Error ? err.message : undefined
}

export function usePlanning(
  initialAppointments: Appointment[],
  refs: AppointmentRefData,
  options?: UsePlanningOptions
): UsePlanningReturn {
  const onCreated = options?.onCreated
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showPlanningSheet, setShowPlanningSheet] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)
  // No dedicated backend table for blocked slots yet, so this lives client-
  // side for now — same stopgap the waitlist used before it got a real API.
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [showBlockSlotForm, setShowBlockSlotForm] = useState(false)

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    setShowPlanningSheet(false)
  }, [])

  const handleNewAppointment = useCallback(() => {
    setEditingAppointment(null)
    setShowAppointmentForm(true)
  }, [])

  const handleBlockSlot = useCallback(() => {
    setShowBlockSlotForm(true)
  }, [])

  const handleSaveBlockedSlot = useCallback((slot: Omit<BlockedSlot, "id">) => {
    setBlockedSlots((prev) => [...prev, { ...slot, id: `block-${Date.now()}-${Math.round(Math.random() * 1000)}` }])
    setShowBlockSlotForm(false)
    toast.success("Créneau bloqué")
  }, [])

  const handleRemoveBlockedSlot = useCallback((id: string) => {
    setBlockedSlots((prev) => prev.filter((b) => b.id !== id))
    toast.success("Blocage supprimé")
  }, [])

  const handleSaveAppointment = useCallback(
    async (appointmentData: Partial<Appointment>) => {
      if (!appointmentData.date || !appointmentData.time || !appointmentData.dentistId || !appointmentData.careTypeId) {
        toast.error("Rendez-vous incomplet")
        return
      }
      if (!appointmentData.patientId) {
        toast.error("Sélectionnez un patient")
        return
      }

      const scheduled_at = combineDateAndTime(appointmentData.date, appointmentData.time).toISOString()
      const duration_minutes = durationToMinutes(appointmentData.duration ?? "30 min")

      try {
        if (appointmentData.id) {
          const updated = await appointmentApi.updateAppointment(appointmentData.id, {
            patient_id: appointmentData.patientId,
            dentist_id: appointmentData.dentistId,
            care_type_id: appointmentData.careTypeId,
            treatment_step_id: appointmentData.treatmentStepId || null,
            resource_id: appointmentData.resourceId || null,
            scheduled_at,
            duration_minutes,
            send_confirmation: appointmentData.sendConfirmation,
            prep_notes: appointmentData.prepNotes || null,
            internal_notes: appointmentData.internalNotes || null,
          })
          const enriched = buildAppointment(updated, refs)
          setAppointments((prev) => prev.map((a) => (a.id === enriched.id ? enriched : a)))
          toast.success("Rendez-vous mis à jour")
        } else {
          const created = await appointmentApi.createAppointment({
            patient_id: appointmentData.patientId,
            dentist_id: appointmentData.dentistId,
            care_type_id: appointmentData.careTypeId,
            treatment_step_id: appointmentData.treatmentStepId || null,
            resource_id: appointmentData.resourceId || null,
            scheduled_at,
            duration_minutes,
            send_confirmation: appointmentData.sendConfirmation ?? true,
            prep_notes: appointmentData.prepNotes || null,
            internal_notes: appointmentData.internalNotes || null,
          })
          const enriched = buildAppointment(created, refs)
          setAppointments((prev) => [...prev, enriched])
          onCreated?.(enriched)
          toast.success("Rendez-vous créé")
        }
        setShowAppointmentForm(false)
        setEditingAppointment(null)
      } catch (err) {
        toast.error("Impossible d'enregistrer le rendez-vous", { description: errorMessage(err) })
      }
    },
    [refs]
  )

  const handleSaveRecurringAppointment = useCallback(
    async (appointmentData: Partial<Appointment>, recurrence: RecurrenceFormData) => {
      if (!appointmentData.date || !appointmentData.time || !appointmentData.dentistId || !appointmentData.careTypeId) {
        toast.error("Rendez-vous incomplet")
        return
      }
      if (!appointmentData.patientId) {
        toast.error("Sélectionnez un patient")
        return
      }

      const scheduled_at = combineDateAndTime(appointmentData.date, appointmentData.time).toISOString()
      const duration_minutes = durationToMinutes(appointmentData.duration ?? "30 min")

      try {
        const response = await appointmentApi.createRecurringAppointments({
          patient_id: appointmentData.patientId,
          dentist_id: appointmentData.dentistId,
          care_type_id: appointmentData.careTypeId,
          resource_id: appointmentData.resourceId || null,
          scheduled_at,
          duration_minutes,
          send_confirmation: appointmentData.sendConfirmation ?? true,
          prep_notes: appointmentData.prepNotes || null,
          internal_notes: appointmentData.internalNotes || null,
          recurrence: {
            frequency: recurrence.frequency,
            count: recurrence.endType === "count" ? recurrence.count : null,
            until: recurrence.endType === "until" ? recurrence.until.toISOString().slice(0, 10) : null,
          },
        })

        const enriched = buildAppointments(response.created, refs)
        setAppointments((prev) => [...prev, ...enriched])
        enriched.forEach((a) => onCreated?.(a))

        if (response.skipped.length > 0) {
          toast.warning(
            `${enriched.length} rendez-vous créés, ${response.skipped.length} ignoré(s) (créneau déjà pris)`
          )
        } else {
          toast.success(`${enriched.length} rendez-vous créés`)
        }
        setShowAppointmentForm(false)
        setEditingAppointment(null)
      } catch (err) {
        toast.error("Impossible de créer la série de rendez-vous", { description: errorMessage(err) })
      }
    },
    [refs, onCreated]
  )

  const handleCancelSeries = useCallback(
    async (seriesId: string, reason?: string) => {
      try {
        const updated = await appointmentApi.cancelSeries(seriesId, { reason: reason || null, only_future: true })
        const enrichedById = new Map(updated.map((a) => [a.id, buildAppointment(a, refs)]))
        setAppointments((prev) => prev.map((a) => enrichedById.get(a.id) ?? a))
        toast.success(`${updated.length} rendez-vous de la série annulés`)
        setShowAppointmentForm(false)
        setEditingAppointment(null)
      } catch (err) {
        toast.error("Impossible d'annuler la série", { description: errorMessage(err) })
      }
    },
    [refs]
  )

  const handleCancelAppointment = useCallback(
    async (appointmentId: string, reason?: string) => {
      try {
        const updated = await appointmentApi.cancelAppointment(appointmentId, { reason: reason || null })
        const enriched = buildAppointment(updated, refs)
        setAppointments((prev) => prev.map((a) => (a.id === enriched.id ? enriched : a)))
        toast.success("Rendez-vous annulé")
        setShowAppointmentForm(false)
        setEditingAppointment(null)
      } catch (err) {
        toast.error("Impossible d'annuler le rendez-vous", { description: errorMessage(err) })
      }
    },
    [refs]
  )

  const handleMarkCompleted = useCallback(
    async (appointmentId: string) => {
      try {
        const updated = await appointmentApi.completeAppointment(appointmentId)
        const enriched = buildAppointment(updated, refs)
        setAppointments((prev) => prev.map((a) => (a.id === enriched.id ? enriched : a)))

        // If this appointment fulfills a treatment step, mark that step
        // completed too — best-effort, a failure here shouldn't undo the
        // appointment completion that already succeeded above.
        if (enriched.treatmentStepId) {
          try {
            const plans = await treatmentApi.listTreatmentPlans()
            const plan = plans.find((p) => p.steps.some((s) => s.id === enriched.treatmentStepId))
            if (plan) {
              await treatmentApi.updateStepStatus(plan.id, enriched.treatmentStepId, "completed")
            }
          } catch (stepErr) {
            toast.error("Rendez-vous terminé, mais l'étape du plan de traitement n'a pas pu être mise à jour", {
              description: errorMessage(stepErr),
            })
          }
        }
      } catch (err) {
        toast.error("Impossible de marquer le rendez-vous comme terminé", { description: errorMessage(err) })
      }
    },
    [refs]
  )

  const handleMarkNoShow = useCallback(
    async (appointmentId: string) => {
      try {
        const updated = await appointmentApi.markNoShow(appointmentId)
        const enriched = buildAppointment(updated, refs)
        setAppointments((prev) => prev.map((a) => (a.id === enriched.id ? enriched : a)))
      } catch (err) {
        toast.error("Impossible de marquer l'absence", { description: errorMessage(err) })
      }
    },
    [refs]
  )

  const handleCheckIn = useCallback(
    async (appointmentId: string) => {
      const previous = appointments
      setAppointments((prev) =>
        prev.map((appointment) => (appointment.id === appointmentId ? { ...appointment, status: "arrived" } : appointment))
      ) // optimistic
      try {
        const updated = await appointmentApi.checkInAppointment(appointmentId)
        const enriched = buildAppointment(updated, refs)
        setAppointments((prev) => prev.map((a) => (a.id === enriched.id ? enriched : a)))
        setShowAppointmentForm(false)
        setEditingAppointment(null)
      } catch (err) {
        setAppointments(previous) // roll back
        toast.error("Impossible de marquer l'arrivée du patient", { description: errorMessage(err) })
      }
    },
    [appointments, refs]
  )

  const handleEditAppointment = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowAppointmentForm(true)
  }, [])

  // Drag-and-drop reschedule from the day/week grid — a lighter-weight path
  // than the full edit form: only date/time (and optionally the
  // practitioner, when a card is dropped into another column) change, so
  // the PATCH only sends those fields. Optimistic like handleCheckIn, with
  // the same rollback-on-failure behaviour, since this fires straight from
  // a grid drag rather than a confirmed form submission.
  const handleRescheduleAppointment = useCallback(
    async (appointmentId: string, date: Date, time: string, dentistId?: string) => {
      const previous = appointments
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, date, time, dentistId: dentistId ?? a.dentistId } : a
        )
      ) // optimistic

      try {
        const updated = await appointmentApi.updateAppointment(appointmentId, {
          scheduled_at: combineDateAndTime(date, time).toISOString(),
          dentist_id: dentistId,
        })
        const enriched = buildAppointment(updated, refs)
        setAppointments((prev) => prev.map((a) => (a.id === enriched.id ? enriched : a)))
        toast.success("Rendez-vous déplacé")
      } catch (err) {
        setAppointments(previous) // roll back
        toast.error("Impossible de déplacer le rendez-vous", { description: errorMessage(err) })
      }
    },
    [appointments, refs]
  )

  return {
    selectedDate,
    showAppointmentForm,
    editingAppointment,
    showPlanningSheet,
    appointments,
    blockedSlots,
    showBlockSlotForm,
    setSelectedDate,
    setShowAppointmentForm,
    setEditingAppointment,
    setShowPlanningSheet,
    setShowBlockSlotForm,
    handleDateSelect,
    handleNewAppointment,
    handleBlockSlot,
    handleSaveBlockedSlot,
    handleRemoveBlockedSlot,
    handleSaveAppointment,
    handleSaveRecurringAppointment,
    handleCancelAppointment,
    handleCancelSeries,
    handleMarkCompleted,
    handleMarkNoShow,
    handleCheckIn,
    handleEditAppointment,
    handleRescheduleAppointment,
  }
}