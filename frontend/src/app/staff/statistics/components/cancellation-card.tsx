"use client"

import { Area, AreaChart, XAxis } from "recharts"
import { Download, TrendingDown, TrendingUp, Minus } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { downloadCsv } from "@/lib/export"
import type { PeriodRange } from "../lib/aggregate"
import { cancellationStats } from "../lib/aggregate"

const chartConfig = {
  rate: {
    label: "Cancelled + No-show %",
    color: "var(--chart-4, #dc2626)",
  },
}

function TrendBadge({ changePct }: { changePct: number | null }) {
  if (changePct === null) {
    return (
      <Badge variant="outline">
        <Minus className="h-3.5 w-3.5" />
        n/a
      </Badge>
    )
  }
  // Lower cancellation/no-show is better, so a decrease is shown as "good" (green).
  const isImproving = changePct <= 0
  const Icon = changePct >= 0 ? TrendingUp : TrendingDown
  return (
    <Badge variant="outline" className={isImproving ? "text-green-600" : "text-red-600"}>
      <Icon className="h-3.5 w-3.5" />
      {changePct >= 0 ? "+" : ""}
      {changePct.toFixed(1)}%
    </Badge>
  )
}

interface CancellationCardProps {
  range: PeriodRange
}

export function CancellationCard({ range }: CancellationCardProps) {
  const stats = cancellationStats(range)

  const handleExport = () => {
    downloadCsv({
      filename: `cancellation-stats-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["Section", "Metric", "Value"],
      rows: [
        ["Summary", "Cancellation rate", stats.cancelledRate.toFixed(1)],
        ["Summary", "Cancellation rate change", stats.cancelledRateChangePct?.toFixed(1) ?? "n/a"],
        ["Summary", "No-show rate", stats.noShowRate.toFixed(1)],
        ["Summary", "No-show rate change", stats.noShowRateChangePct?.toFixed(1) ?? "n/a"],
        ...stats.weekly.map((item) => ["Weekly", item.label, item.rate.toFixed(1)]),
      ],
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Cancellation &amp; No-show Rate</CardTitle>
          <CardDescription>Share of appointments not honored</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={handleExport}
        >
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-4 space-y-1">
            <div className="text-sm text-muted-foreground">Cancellation rate</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.cancelledRate.toFixed(1)}%</div>
              <TrendBadge changePct={stats.cancelledRateChangePct} />
            </div>
          </div>
          <div className="rounded-lg border p-4 space-y-1">
            <div className="text-sm text-muted-foreground">No-show rate</div>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.noShowRate.toFixed(1)}%</div>
              <TrendBadge changePct={stats.noShowRateChangePct} />
            </div>
          </div>
        </div>

        {stats.weekly.length > 1 && (
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <AreaChart data={stats.weekly} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-rate)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => [`${value}%`, ""]}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="rate"
                stroke="var(--color-rate)"
                fill="url(#colorRate)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
