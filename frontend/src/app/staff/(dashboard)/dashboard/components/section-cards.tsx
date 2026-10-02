import { TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SectionCardsProps {
  todayAppointmentCount?: number
  activePatientCount?: number
  doctorsOnDuty?: number
  doctorsTotal?: number
  revenueLast30Days?: number
  revenueTrendPct?: number
}

export function SectionCards({
  todayAppointmentCount = 0,
  activePatientCount = 0,
  doctorsOnDuty = 0,
  doctorsTotal = 0,
  revenueLast30Days = 0,
  revenueTrendPct = 0,
}: SectionCardsProps) {
  const revenueUp = revenueTrendPct >= 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Revenue (Last 30 Days)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {revenueLast30Days.toLocaleString()} TND
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {revenueUp ? <TrendingUp /> : <TrendingDown />}
              {revenueUp ? "+" : ""}
              {revenueTrendPct.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {revenueUp ? "Trending up this period" : "Down from last period"}{" "}
            {revenueUp ? (
              <TrendingUp className="size-4" />
            ) : (
              <TrendingDown className="size-4" />
            )}
          </div>
          <div className="text-muted-foreground">
            Consultations &amp; treatments combined
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Today&apos;s Appointments</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {todayAppointmentCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              On schedule
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Wednesday, July 1 <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Across all chairs and doctors
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Patients</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {activePatientCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp />
              Practice-wide
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady patient base <TrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Includes upcoming &amp; recent visits
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Doctors on Duty</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {doctorsOnDuty}
            <span className="text-muted-foreground text-lg font-normal">
              {" "}
              / {doctorsTotal}
            </span>
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Today</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Full chair coverage
          </div>
          <div className="text-muted-foreground">
            Based on today&apos;s schedule
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}