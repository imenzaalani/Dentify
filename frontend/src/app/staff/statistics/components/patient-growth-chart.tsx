"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
import { portfolioGrowth } from "../lib/aggregate"

const chartConfig = {
  existing: {
    label: "Existing patients",
    color: "var(--chart-3, #f59e0b)",
  },
  new: {
    label: "New patients",
    color: "var(--chart-1, #2563eb)",
  },
}

interface PatientGrowthChartProps {
  range: PeriodRange
}

export function PatientGrowthChart({ range }: PatientGrowthChartProps) {
  const data = portfolioGrowth(range)
  const latest = data[data.length - 1]

  const handleExport = () => {
    downloadCsv({
      filename: `patient-growth-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["Period", "Existing patients", "New patients", "Total patients"],
      rows: data.map((entry) => [entry.label, entry.existing, entry.new, entry.total]),
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Patient Portfolio Growth</CardTitle>
          <CardDescription>
            Cumulative patients{" "}
            {latest ? `— ${latest.total.toLocaleString()} total` : ""}
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
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorExisting" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-existing)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-existing)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-new)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--color-new)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="existing"
              stackId="1"
              stroke="var(--color-existing)"
              fill="url(#colorExisting)"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey="new"
              stackId="1"
              stroke="var(--color-new)"
              fill="url(#colorNew)"
              strokeWidth={1}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
