"use client"

import { useEffect, useMemo, useState } from "react"

import { useCurrentRole } from "@/lib/rbac"
import { statsApi } from "@/lib/api/stats"
import { ApiError } from "@/lib/api/client"
import type { StatsFull, StatsOperational } from "@/types/stats"

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
  toDateParam,
  type PeriodPreset,
  type PeriodRange,
} from "./lib/aggregate"

export default function StatisticsPage() {
  const role = useCurrentRole()
  // Revenue and consolidated figures are owner-only server-side
  // (Category.STATS_FULL) — mirror that here so we don't even ask for
  // data the API would just 403 on.
  const canSeeFull = role === "owner"

  const [preset, setPreset] = useState<PeriodPreset>("30d")
  const [customRange, setCustomRange] = useState<PeriodRange | undefined>()
  const range = useMemo(
    () => presetToRange(preset, customRange),
    [preset, customRange]
  )

  const [operational, setOperational] = useState<StatsOperational | null>(null)
  const [full, setFull] = useState<StatsFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const start = toDateParam(range.start)
    const end = toDateParam(range.end)

    const requests: Promise<unknown>[] = [
      statsApi.getOperational(start, end).then((data) => {
        if (!cancelled) setOperational(data)
      }),
    ]

    if (canSeeFull) {
      requests.push(
        statsApi.getFull(start, end).then((data) => {
          if (!cancelled) setFull(data)
        })
      )
    } else {
      setFull(null)
    }

    Promise.all(requests)
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load statistics")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [range, canSeeFull])

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

      {error && (
        <div className="@container/main px-4 lg:px-6">
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        </div>
      )}

      {canSeeFull ? (
        <div className="@container/main px-4 lg:px-6">
          <KpiCards kpis={full?.kpis ?? null} loading={loading} />
        </div>
      ) : (
        <div className="@container/main px-4 lg:px-6">
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            Revenue and consolidated figures are visible to the practice owner only.
          </p>
        </div>
      )}

      <div className="@container/main px-4 lg:px-6 grid gap-4 lg:grid-cols-2">
        {canSeeFull && (
          <>
            <RevenueChart
              data={full?.revenue_series ?? []}
              groupBy={full?.group_by ?? "day"}
              loading={loading}
            />
            <CareBreakdownChart entries={full?.care_breakdown ?? []} loading={loading} />
          </>
        )}
        <OccupancyChart data={operational?.occupancy ?? []} loading={loading} />
        {canSeeFull && (
          <PatientGrowthChart data={full?.patient_growth ?? []} loading={loading} />
        )}
      </div>

      {canSeeFull && (
        <div className="@container/main px-4 lg:px-6 grid gap-4 lg:grid-cols-2">
          <TopActsTable acts={full?.top_acts ?? []} loading={loading} />
          <UnpaidTable />
        </div>
      )}

      <div className="@container/main px-4 lg:px-6 pb-6">
        <CancellationCard stats={operational?.cancellations ?? null} loading={loading} />
      </div>
    </div>
  )
}