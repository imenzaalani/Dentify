"use client"

import { useMemo, useState } from "react"

import { PeriodSelector } from "./components/period-selector"
import { KpiCards } from "./components/kpi-cards"
import { RevenueChart } from "./components/revenue-chart"
import { CareBreakdownChart } from "./components/care-breakdown-chart"
import { OccupancyChart } from "./components/occupancy-chart"
import { PatientGrowthChart } from "./components/patient-growth-chart"
import { TopActsTable } from "./components/top-acts-table"
import { UnpaidTable } from "./components/unpaid-table"
import { CancellationCard } from "./components/cancellation-card"
import {
  presetToRange,
  type PeriodPreset,
  type PeriodRange,
} from "./lib/aggregate"

export default function StatisticsPage() {
  const [preset, setPreset] = useState<PeriodPreset>("30d")
  const [customRange, setCustomRange] = useState<PeriodRange | undefined>()

  const range = useMemo(
    () => presetToRange(preset, customRange),
    [preset, customRange]
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Statistics</h1>
          <p className="text-sm text-muted-foreground">
            Practice performance for the selected period.
          </p>
        </div>
        <PeriodSelector
          preset={preset}
          customRange={customRange}
          onPresetChange={setPreset}
          onCustomRangeChange={setCustomRange}
        />
      </div>

      <div className="@container/main px-4 lg:px-6">
        <KpiCards range={range} />
      </div>

      <div className="@container/main px-4 lg:px-6 grid gap-4 lg:grid-cols-2">
        <RevenueChart range={range} />
        <CareBreakdownChart range={range} />
        <OccupancyChart range={range} />
        <PatientGrowthChart range={range} />
      </div>

      <div className="@container/main px-4 lg:px-6 grid gap-4 lg:grid-cols-2">
        <TopActsTable range={range} />
        <UnpaidTable />
      </div>

      <div className="@container/main px-4 lg:px-6 pb-6">
        <CancellationCard range={range} />
      </div>
    </div>
  )
}
