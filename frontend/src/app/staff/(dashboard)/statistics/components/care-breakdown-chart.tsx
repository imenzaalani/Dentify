"use client"

import { useState } from "react"
import { Pie, PieChart } from "recharts"
import { Download } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { downloadCsv } from "@/lib/export"
import type { CareBreakdownEntry as CareBreakdownEntryType } from "@/types/stats"

const PALETTE = [
  "var(--chart-1, #2563eb)",
  "var(--chart-2, #16a34a)",
  "var(--chart-3, #f59e0b)",
  "var(--chart-4, #dc2626)",
  "var(--chart-5, #7c3aed)",
  "var(--chart-1, #2563eb)",
  "var(--chart-2, #16a34a)",
  "var(--chart-3, #f59e0b)",
]

interface CareBreakdownChartProps {
  entries: CareBreakdownEntryType[]
  loading: boolean
}

export function CareBreakdownChart({ entries, loading }: CareBreakdownChartProps) {
  const [hidden, setHidden] = useState<Set<string>>(new Set())

  const totalCount = entries.reduce((a, e) => a + e.count, 0)

  const data = entries.map((e, i) => ({
    type: e.type,
    count: e.count,
    revenue: e.revenue,
    fill: PALETTE[i % PALETTE.length],
  }))

  const visibleData = data.filter((d) => !hidden.has(d.type))
  const chartConfig = Object.fromEntries(
    data.map((d) => [d.type, { label: d.type, color: d.fill }])
  )

  const handleExport = () => {
    downloadCsv({
      filename: `care-breakdown-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["Procedure type", "Count", "Revenue (TND)"],
      rows: visibleData.map((entry) => [entry.type, entry.count, entry.revenue]),
    })
  }

  const toggle = (type: string) => {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Care Type Breakdown</CardTitle>
          <CardDescription>Procedures performed by type</CardDescription>
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
      <CardContent className="flex flex-1 justify-center">
        {loading ? (
          <div className="flex h-[280px] w-full items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <div className="flex justify-center">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square w-full max-w-[280px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={visibleData}
                  dataKey="count"
                  nameKey="type"
                  innerRadius={55}
                  strokeWidth={4}
                />
              </PieChart>
            </ChartContainer>
          </div>
          <div className="flex flex-col justify-center space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {data.map((item) => {
              const isHidden = hidden.has(item.type)
              const pct = totalCount === 0 ? 0 : (item.count / totalCount) * 100
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => toggle(item.type)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-left transition-colors cursor-pointer ${
                    isHidden ? "opacity-40" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{item.count}</div>
                    <div className="text-xs text-muted-foreground">
                      {pct.toFixed(0)}%
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  )
}