"use client"

import { CalendarClock, Clock3, Stethoscope } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type AppointmentStatus = "confirmed" | "pending" | "completed" | "cancelled"

export interface Appointment {
  id: string
  date: string // ISO date
  time: string // "HH:mm"
  practitioner: string
  type: string
  status: AppointmentStatus
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending confirmation",
  completed: "Completed",
  cancelled: "Cancelled",
}

const STATUS_VARIANT: Record<AppointmentStatus, "default" | "outline" | "secondary"> = {
  confirmed: "default",
  pending: "outline",
  completed: "secondary",
  cancelled: "outline",
}

export function AppointmentRow({
  appointment,
  minCancelNoticeHours,
  onCancel,
}: {
  appointment: Appointment
  minCancelNoticeHours: number
  onCancel?: (id: string) => void
}) {
  const isUpcoming = appointment.status === "confirmed" || appointment.status === "pending"
  const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`)
  const hoursUntil = (appointmentDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const withinNoticeWindow = hoursUntil < minCancelNoticeHours

  const formattedDate = appointmentDateTime.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{formattedDate}</span>
            <Badge variant={STATUS_VARIANT[appointment.status]}>
              {STATUS_LABEL[appointment.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {appointment.time}
            </span>
            <span className="flex items-center gap-1.5">
              <Stethoscope className="size-3.5" />
              {appointment.practitioner}
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5" />
              {appointment.type}
            </span>
          </div>
        </div>

        {isUpcoming && (
          <div className="flex gap-2">
            {withinNoticeWindow ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="outline" size="sm" disabled>
                      Cancel
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Cancellation requires at least {minCancelNoticeHours}h notice
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCancel?.(appointment.id)}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}