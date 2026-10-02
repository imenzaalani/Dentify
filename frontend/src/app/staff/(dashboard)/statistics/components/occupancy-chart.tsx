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
import type { OccupancyEntry } from "@/types/stats"

const chartConfig = {
  occupancy_pct: {
    label: "Occupancy %",
    color: "var(--chart-2, #16a34a)",
  },
}

interface OccupancyChartProps {
  data: OccupancyEntry[]
  loading: boolean
}

export function OccupancyChart({ data, loading }: OccupancyChartProps) {
  const handleExport = () => {
    downloadCsv({
      filename: `occupancy-by-weekday-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["Weekday", "Occupancy %", "Avg. appointments"],
      rows: data.map((entry) => [entry.weekday, entry.occupancy_pct, entry.avg_appointments]),
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
        {loading ? (
          <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
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
                    `${value}% occupied · ${item.payload.avg_appointments} avg. appts`,
                    "",
                  ]}
                />
              }
            />
            <Bar dataKey="occupancy_pct" fill="var(--color-occupancy_pct)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}