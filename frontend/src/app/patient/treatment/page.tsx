"use client"

import { useEffect, useState } from "react"

import { treatmentApi } from "@/lib/api/treatments"
import { ApiError } from "@/lib/api/client"

import {
  TreatmentProgressSummary,
  type TreatmentSummary,
} from "./components/treatment-progress-summary"
import { TreatmentTimeline, type TreatmentStep } from "./components/treatment-timeline"

export default function PatientTreatmentPage() {
  const [treatment, setTreatment] = useState<TreatmentSummary | null>(null)
  const [steps, setSteps] = useState<TreatmentStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const plans = await treatmentApi.listMyTreatmentPlans()
        if (cancelled) return

        // Show the most relevant active plan: in-progress first, then
        // planned, then completed — abandoned plans are hidden from the
        // patient view entirely.
        const priority = { in_progress: 0, planned: 1, completed: 2, abandoned: 3 } as const
        const current = [...plans]
          .filter((p) => p.status !== "abandoned")
          .sort((a, b) => priority[a.status] - priority[b.status])[0]

        if (!current) {
          setTreatment(null)
          setSteps([])
          return
        }

        const orderedSteps = [...current.steps].sort((a, b) => a.position - b.position)
        const total = orderedSteps.length
        const completed = orderedSteps.filter((s) => s.status === "completed").length
        const firstPendingIndex = orderedSteps.findIndex((s) => s.status !== "completed")

        setTreatment({
          name: current.title,
          progressPct: total > 0 ? Math.round((completed / total) * 100) : 0,
          completedSteps: completed,
          totalSteps: total,
        })

        setSteps(
          orderedSteps.map((s, index) => ({
            id: s.id,
            date: current.start_date,
            procedure: s.label,
            tooth: s.tooth ?? "Not specified",
            practitioner: "",
            notes: null,
            status:
              s.status === "completed" ? "done" : index === firstPendingIndex ? "next" : "upcoming",
          }))
        )
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError && err.status === 404
              ? null
              : "Couldn't load your treatment plan"
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <h1 className="text-2xl font-semibold">My Treatment</h1>
        <p className="text-sm text-muted-foreground">
          A timeline of your care journey, from first consultation to completion.
        </p>
      </div>

      {loading ? (
        <div className="@container/main px-4 lg:px-6 py-8 text-center text-sm text-muted-foreground">
          Loading your treatment plan…
        </div>
      ) : error ? (
        <div className="@container/main px-4 lg:px-6 py-8 text-center text-sm text-destructive">
          {error}
        </div>
      ) : (
        <>
          {treatment && (
            <div className="@container/main px-4 lg:px-6">
              <TreatmentProgressSummary treatment={treatment} />
            </div>
          )}

          <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
            {steps.length === 0 ? (
              <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
                No treatment plan on file yet.
              </div>
            ) : (
              <TreatmentTimeline steps={steps} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
