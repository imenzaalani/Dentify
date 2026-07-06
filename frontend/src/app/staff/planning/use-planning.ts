"use client"

import { useState, useCallback } from "react"
import { type Appointment } from "./types"

export interface UsePlanningState {
  selectedDate: Date
  showAppointmentForm: boolean
  editingAppointment: Appointment | null
  showPlanningSheet: boolean
  appointments: Appointment[]
}

export interface UsePlanningActions {
  setSelectedDate: (date: Date) => void
  setShowAppointmentForm: (show: boolean) => void
  setEditingAppointment: (appointment: Appointment | null) => void
  setShowPlanningSheet: (show: boolean) => void
  handleDateSelect: (date: Date) => void
  handleNewAppointment: () => void
  handleBlockSlot: () => void
  handleSaveAppointment: (appointmentData: Partial<Appointment>) => void
  handleCancelAppointment: (appointmentId: number, reason?: string) => void
  handleMarkCompleted: (appointmentId: number) => void
  handleMarkNoShow: (appointmentId: number) => void
  handleCheckIn: (appointmentId: number) => void
  handleEditAppointment: (appointment: Appointment) => void
}

export interface UsePlanningReturn extends UsePlanningState, UsePlanningActions {}

export function usePlanning(initialAppointments: Appointment[] = []): UsePlanningReturn {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showPlanningSheet, setShowPlanningSheet] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments)

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date)
    // Auto-close mobile sheet when date is selected
    setShowPlanningSheet(false)
  }, [])

  const handleNewAppointment = useCallback(() => {
    setEditingAppointment(null)
    setShowAppointmentForm(true)
  }, [])

  const handleBlockSlot = useCallback(() => {
    console.log("Blocage d'un créneau (congé, pause, formation)")
    // In a real app, this would open the slot-blocking form
  }, [])

  const handleSaveAppointment = useCallback((appointmentData: Partial<Appointment>) => {
    console.log("Enregistrement du RDV:", appointmentData)
    // In a real app, this would POST/PATCH to the appointments API
    // with conflict validation against the selected slot
    setShowAppointmentForm(false)
    setEditingAppointment(null)
  }, [])

  const handleCancelAppointment = useCallback((appointmentId: number, reason?: string) => {
    console.log("Annulation du RDV:", appointmentId, "motif:", reason)
    // In a real app: status -> cancelled, cancellation_reason saved
    setShowAppointmentForm(false)
    setEditingAppointment(null)
  }, [])

  const handleMarkCompleted = useCallback((appointmentId: number) => {
    console.log("RDV marqué comme terminé:", appointmentId)
    // In a real app: status -> completed
  }, [])

  const handleMarkNoShow = useCallback((appointmentId: number) => {
    console.log("RDV marqué comme absence:", appointmentId)
    // In a real app: status -> no_show, increments patient's no-show counter
  }, [])

  const handleCheckIn = useCallback((appointmentId: number) => {
    setAppointments((prev) => prev.map((appointment) =>
      appointment.id === appointmentId ? { ...appointment, status: "arrived" } : appointment
    ))
    setShowAppointmentForm(false)
    setEditingAppointment(null)
  }, [])

  const handleEditAppointment = useCallback((appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowAppointmentForm(true)
  }, [])

  return {
    // State
    selectedDate,
    showAppointmentForm,
    editingAppointment,
    showPlanningSheet,
    appointments,
    // Actions
    setSelectedDate,
    setShowAppointmentForm,
    setEditingAppointment,
    setShowPlanningSheet,
    handleDateSelect,
    handleNewAppointment,
    handleBlockSlot,
    handleSaveAppointment,
    handleCancelAppointment,
    handleMarkCompleted,
    handleMarkNoShow,
    handleCheckIn,
    handleEditAppointment,
  }
}
