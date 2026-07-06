"use client"

import { TrendingUp, TrendingDown, Minus, Users, UserPlus, Wallet, CalendarCheck } from "lucide-react"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { PeriodRange } from "../lib/aggregate"
import { computeKpis } from "../lib/aggregate"

const formatTND = (amount: number) =>
  `${Math.round(amount).toLocaleString("fr-TN")} TND`

function ChangeBadge({ changePct }: { changePct: number | null }) {
  if (changePct === null) {
    return (
      <Badge variant="outline">
        <Minus className="h-3.5 w-3.5" />
        n/a
      </Badge>
    )
  }
  const isUp = changePct >= 0
  const Icon = isUp ? TrendingUp : TrendingDown
  return (
    <Badge
      variant="outline"
      className={isUp ? "text-green-600" : "text-red-600"}
    >
      <Icon className="h-3.5 w-3.5" />
      {isUp ? "+" : ""}
      {changePct.toFixed(1)}%
    </Badge>
  )
}

interface KpiCardsProps {
  range: PeriodRange
}

export function KpiCards({ range }: KpiCardsProps) {
  const kpis = computeKpis(range)

  const cards = [
    {
      title: "Patients Seen",
      value: kpis.patientsSeen.value.toLocaleString(),
      changePct: kpis.patientsSeen.changePct,
      icon: Users,
      subfooter: "Completed consultations",
    },
    {
      title: "New Patients",
      value: kpis.newPatients.value.toLocaleString(),
      changePct: kpis.newPatients.changePct,
      icon: UserPlus,
      subfooter: "New records created",
    },
    {
      title: "Revenue",
      value: formatTND(kpis.revenue.value),
      changePct: kpis.revenue.changePct,
      icon: Wallet,
      subfooter: "Total billed",
    },
    {
      title: "Occupancy Rate",
      value: `${kpis.occupancyRate.value.toFixed(1)}%`,
      changePct: kpis.occupancyRate.changePct,
      icon: CalendarCheck,
      subfooter: "Slots used vs available",
    },
  ]

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 sm:grid-cols-2 @5xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} data-slot="card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <card.icon className="size-4" />
              {card.title}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <ChangeBadge changePct={card.changePct} />
            </CardAction>
          </CardHeader>
          <CardFooter className="text-sm text-muted-foreground">
            {card.subfooter} vs. previous period
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
