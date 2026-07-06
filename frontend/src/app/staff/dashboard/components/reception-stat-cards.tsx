import { CalendarClock, Users, Wallet, ListTodo } from "lucide-react"

import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ReceptionStatCardsProps {
  pendingCount: number
  waitingRoomCount: number
  amountToCollect: number
  waitlistCount: number
}

export function ReceptionStatCards({
  pendingCount,
  waitingRoomCount,
  amountToCollect,
  waitlistCount,
}: ReceptionStatCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Awaiting Confirmation</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pendingCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-orange-600 dark:text-orange-400">
              <CalendarClock className="size-3.5" />
              Priority
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            Requests waiting on a call-back or reply
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>In Waiting Room</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {waitingRoomCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Users className="size-3.5" />
              Checked in
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Patients currently on site</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>To Collect Today</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {amountToCollect.toLocaleString()} TND
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Wallet className="size-3.5" />
              Outstanding
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Unpaid &amp; partially paid invoices</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Waitlist to Recontact</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {waitlistCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <ListTodo className="size-3.5" />
              Follow up
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Freed slots since last cancellation</div>
        </CardFooter>
      </Card>
    </div>
  )
}
