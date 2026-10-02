import { apiRequest } from "./client"
import type { MedicalCheckup, MedicalCheckupSubmitRequest } from "@/types/dental"

// TODO(backend): no /appointments/{id}/checkup route exists yet — same
// situation lib/api/... treatments.ts was in before treatment plans got
// wired up. Points at the endpoint from the architecture notes so this
// module is a drop-in once it lands; every call will 404 until then.
export const checkupApi = {
  async getCheckup(appointmentId: string): Promise<MedicalCheckup | null> {
    return apiRequest<MedicalCheckup | null>(`/appointments/${appointmentId}/checkup`)
  },

  async saveCheckup(
    appointmentId: string,
    payload: MedicalCheckupSubmitRequest
  ): Promise<MedicalCheckup> {
    return apiRequest<MedicalCheckup>(`/appointments/${appointmentId}/checkup`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
}
