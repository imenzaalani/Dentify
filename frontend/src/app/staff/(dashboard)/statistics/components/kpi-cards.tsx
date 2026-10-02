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
import type { Kpis } from "@/types/stats"

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
  kpis: Kpis | null
  loading: boolean
}

export function KpiCards({ kpis, loading }: KpiCardsProps) {
  const cards = [
    {
      title: "Patients Seen",
      value: kpis ? kpis.patients_seen.value.toLocaleString() : "—",
      changePct: kpis?.patients_seen.change_pct ?? null,
      icon: Users,
      subfooter: "Completed consultations",
    },
    {
      title: "New Patients",
      value: kpis ? kpis.new_patients.value.toLocaleString() : "—",
      changePct: kpis?.new_patients.change_pct ?? null,
      icon: UserPlus,
      subfooter: "New records created",
    },
    {
      title: "Revenue",
      value: kpis ? formatTND(kpis.revenue.value) : "—",
      changePct: kpis?.revenue.change_pct ?? null,
      icon: Wallet,
      subfooter: "Total billed",
    },
    {
      title: "Occupancy Rate",
      value: kpis ? `${kpis.occupancy_rate.value.toFixed(1)}%` : "—",
      changePct: kpis?.occupancy_rate.change_pct ?? null,
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
              {loading ? "…" : card.value}
            </CardTitle>
            <CardAction>
              <ChangeBadge changePct={loading ? null : card.changePct} />
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