import { apiRequest } from "./client"
import type {
  Appointment,
  AppointmentCancelRequest,
  AppointmentCreateRequest,
  AppointmentListParams,
  AppointmentUpdateRequest,
  RecurringAppointmentCreateRequest,
  RecurringAppointmentCreateResponse,
  SeriesCancelRequest,
} from "@/types/appointment"

export const appointmentApi = {
  async listAppointments(params?: AppointmentListParams): Promise<Appointment[]> {
    const search = new URLSearchParams()
    if (params?.day) search.set("day", params.day)
    if (params?.date_from) search.set("date_from", params.date_from)
    if (params?.date_to) search.set("date_to", params.date_to)
    if (params?.dentist_id) search.set("dentist_id", params.dentist_id)
    if (params?.patient_id) search.set("patient_id", params.patient_id)
    if (params?.status) search.set("status", params.status)
    const qs = search.toString()
    return apiRequest<Appointment[]>(`/appointments/${qs ? `?${qs}` : ""}`)
  },

  async getAppointment(id: string): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}`)
  },

  async createAppointment(payload: AppointmentCreateRequest): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async createRecurringAppointments(
    payload: RecurringAppointmentCreateRequest
  ): Promise<RecurringAppointmentCreateResponse> {
    return apiRequest<RecurringAppointmentCreateResponse>(`/appointments/recurring`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  async listSeriesAppointments(seriesId: string): Promise<Appointment[]> {
    return apiRequest<Appointment[]>(`/appointments/series/${seriesId}`)
  },

  async cancelSeries(seriesId: string, payload: SeriesCancelRequest = {}): Promise<Appointment[]> {
    return apiRequest<Appointment[]>(`/appointments/series/${seriesId}/cancel`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  // Reschedule/reassign/rebook — see AppointmentUpdateRequest. Use the
  // action methods below for status transitions.
  async updateAppointment(id: string, payload: AppointmentUpdateRequest): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    })
  },

  async confirmAppointment(id: string): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}/confirm`, { method: "POST" })
  },

  async checkInAppointment(id: string): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}/check-in`, { method: "POST" })
  },

  async completeAppointment(id: string): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}/complete`, { method: "POST" })
  },

  async markNoShow(id: string): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}/no-show`, { method: "POST" })
  },

  async cancelAppointment(id: string, payload: AppointmentCancelRequest = {}): Promise<Appointment> {
    return apiRequest<Appointment>(`/appointments/${id}/cancel`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
}