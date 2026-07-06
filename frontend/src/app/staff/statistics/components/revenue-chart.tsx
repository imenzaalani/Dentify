"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
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
import type { PeriodRange } from "../lib/aggregate"
import { groupByForRange, revenueSeries } from "../lib/aggregate"

const chartConfig = {
  revenue: {
    label: "Revenue (TND)",
    color: "var(--chart-1, #2563eb)",
  },
}

const groupByLabel: Record<string, string> = {
  day: "by day",
  week: "by week",
  month: "by month",
}

interface RevenueChartProps {
  range: PeriodRange
}

export function RevenueChart({ range }: RevenueChartProps) {
  const data = revenueSeries(range)
  const groupBy = groupByForRange(range)

  const handleExport = () => {
    downloadCsv({
      filename: `revenue-trend-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["Period", "Revenue (TND)"],
      rows: data.map((point) => [point.label, point.revenue]),
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>
            Billed revenue {groupByLabel[groupBy]} over the selected period
          </CardDescription>
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
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => [`${Number(value).toLocaleString()} TND`, ""]}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
