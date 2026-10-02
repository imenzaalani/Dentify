import { z } from "zod"

export const schema = z.object({
  id: z.string(),
  patientName: z.string(),
  patientAvatar: z.string(),
  procedure: z.string(),
  status: z.string(),
  nextAppointment: z.string(),
  balance: z.string(),
  doctor: z.string(),
})

export type Patient = z.infer<typeof schema>