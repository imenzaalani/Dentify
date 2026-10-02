"use client"

import { Bar, BarChart, Cell, LabelList, XAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { conditionColors, conditionLabels, type ToothCondition, type ToothRecord } from "@/types/dental"

interface ConditionSummaryChartProps {
  teeth: ToothRecord[]
  totalTeeth?: number
}

const TRACKED_CONDITIONS: ToothCondition[] = [
  "caries", "surgery", "implantation", "gingivitis", "periodontitis", "removal", "periostitis",
]

export function ConditionSummaryChart({ teeth, totalTeeth = 32 }: ConditionSummaryChartProps) {
  const data = TRACKED_CONDITIONS.map((condition) => {
    const count = teeth.filter((t) => t.condition === condition).length
    const pct = totalTeeth === 0 ? 0 : Math.round((count / totalTeeth) * 100)
    return {
      condition: conditionLabels[condition],
      pct,
      // Bar height is driven by this, not `pct` — a real 0% would render as
      // a zero-height bar that recharts collapses entirely, which is what
      // was causing categories to vanish (bar, color, and tick all gone).
      // Flooring the drawn height to a thin sliver keeps the category
      // visually present and its label anchored above something, while the
      // label itself still reads the true `pct` (e.g. "0%").
      barValue: Math.max(pct, 2),
      fill: conditionColors[condition],
    }
  })
  const chartConfig = Object.fromEntries(data.map((d) => [d.condition, { label: d.condition, color: d.fill }]))

  return (
    <ChartContainer config={chartConfig} className="h-[220px] w-full">
      <BarChart data={data} margin={{ top: 24, left: 4, right: 4 }}>
        <XAxis
          dataKey="condition"
          tickLine={false}
          axisLine={false}
          fontSize={12}
          tickMargin={10}
          interval={0}
          stroke="var(--muted-foreground)"
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel formatter={(value) => `${value}%`} />} />
        <Bar dataKey="barValue" radius={[8, 8, 8, 8]} maxBarSize={44}>
          {data.map((d) => (
            <Cell key={d.condition} fill={d.fill} />
          ))}
          <LabelList
            dataKey="pct"
            position="top"
            offset={8}
            formatter={(value: any) => `${value}%`}
            fontSize={13}
            fontWeight={700}
            fill="var(--foreground)"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}