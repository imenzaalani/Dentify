"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import { occupancyByWeekday } from "../lib/aggregate"

const chartConfig = {
  occupancyPct: {
    label: "Occupancy %",
    color: "var(--chart-2, #16a34a)",
  },
}

interface OccupancyChartProps {
  range: PeriodRange
}

export function OccupancyChart({ range }: OccupancyChartProps) {
  const data = occupancyByWeekday(range)

  const handleExport = () => {
    downloadCsv({
      filename: `occupancy-by-weekday-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["Weekday", "Occupancy %", "Avg. appointments"],
      rows: data.map((entry) => [entry.weekday, entry.occupancyPct, entry.avgAppointments]),
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Schedule Occupancy</CardTitle>
          <CardDescription>Average slot usage per weekday</CardDescription>
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
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="weekday"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, _name, item) => [
                    `${value}% occupied · ${item.payload.avgAppointments} avg. appts`,
                    "",
                  ]}
                />
              }
            />
            <Bar dataKey="occupancyPct" fill="var(--color-occupancyPct)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
