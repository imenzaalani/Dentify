import Link from "next/link"
import { CalendarClock, Stethoscope, Clock3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface NextAppointment {
  date: string // ISO date, e.g. "2026-07-10"
  time: string // "14:30"
  practitioner: string
  type: string
  status: "confirmed" | "pending"
}

export function NextAppointmentCard({
  appointment,
}: {
  appointment: NextAppointment | null
}) {
  if (!appointment) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Next Appointment</CardDescription>
          <CardTitle className="text-lg font-medium text-muted-foreground">
            No upcoming appointments
          </CardTitle>
        </CardHeader>
        <CardFooter>
          <Button asChild size="sm">
            <Link href="/patient/appointment">Book an appointment</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const formattedDate = new Date(appointment.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>Next Appointment</CardDescription>
        <CardTitle className="text-2xl font-semibold capitalize @[250px]/card:text-3xl">
          {formattedDate}
        </CardTitle>
        <CardAction>
          <Badge variant={appointment.status === "confirmed" ? "default" : "outline"}>
            {appointment.status === "confirmed" ? "Confirmed" : "Pending"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock3 className="size-4" />
          {appointment.time}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Stethoscope className="size-4" />
          {appointment.practitioner}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <CalendarClock className="size-4" />
          {appointment.type}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm">
          <Link href="/patient/appointment">View my appointments</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
