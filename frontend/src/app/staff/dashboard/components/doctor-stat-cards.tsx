import { CalendarClock, ClipboardList, ListChecks, MessageCircle } from "lucide-react"

import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface DoctorStatCardsProps {
  appointmentCount: number
  pendingNotesCount: number
  treatmentFollowupCount: number
  messageCount: number
}

export function DoctorStatCards({
  appointmentCount,
  pendingNotesCount,
  treatmentFollowupCount,
  messageCount,
}: DoctorStatCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Today&apos;s Appointments</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {appointmentCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <CalendarClock className="size-3.5" />
              My patients
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Your clinical schedule for today</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Notes to Finalize</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pendingNotesCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-orange-600 dark:text-orange-400">
              <ClipboardList className="size-3.5" />
              To do
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Dossiers awaiting clinical notes</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Treatment Follow-ups</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {treatmentFollowupCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ListChecks className="size-3.5" />
              Next step
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Plans needing their next visit</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Patient Messages</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {messageCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-orange-600 dark:text-orange-400">
              <MessageCircle className="size-3.5" />
              Clinical
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Awaiting a clinical reply from you</div>
        </CardFooter>
      </Card>
    </div>
  )
}
