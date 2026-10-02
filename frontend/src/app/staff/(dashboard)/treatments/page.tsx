"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { patientApi } from "@/lib/api/patients"
import { treatmentApi } from "@/lib/api/treatments"
import { ApiError } from "@/lib/api/client"

import { DataTable, type TreatmentPlan } from "./components/data-table"
import { TreatmentStatCards } from "./components/treatment-stat-cards"
import type { TreatmentFormValues } from "./components/treatment-form-sheet"
import { buildCreatePayload, buildUpdatePayload, mapTreatmentPlan, toSimplePatient, type SimplePatient } from "./data"

export default function TreatmentsPage() {
  const [plans, setPlans] = useState<TreatmentPlan[]>([])
  const [patients, setPatients] = useState<SimplePatient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const patientsRes = await patientApi.listPatients()
        const mappedPatients = patientsRes.map(toSimplePatient)

        const plansRes = await treatmentApi.listTreatmentPlans()
        const mappedPlans = plansRes.map((p) => mapTreatmentPlan(p, mappedPatients))

        if (cancelled) return
        setPatients(mappedPatients)
        setPlans(mappedPlans)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load treatment plans")
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

  const handleAddPlan = async (data: TreatmentFormValues) => {
    try {
      const created = await treatmentApi.createTreatmentPlan(buildCreatePayload(data))
      setPlans((prev) => [mapTreatmentPlan(created, patients), ...prev])
      toast.success(`Treatment plan "${data.title}" created`)
    } catch (err) {
      toast.error("Couldn't save the treatment plan", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  const handleEditPlan = async (id: string, data: TreatmentFormValues) => {
    try {
      const updated = await treatmentApi.updateTreatmentPlan(id, buildUpdatePayload(data))
      setPlans((prev) => prev.map((p) => (p.id === id ? mapTreatmentPlan(updated, patients) : p)))
      toast.success(`Treatment plan "${data.title}" updated`)
    } catch (err) {
      toast.error("Couldn't update the treatment plan", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  const handleAbandonPlan = async (id: string) => {
    const previous = plans
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, status: "Abandoned" as const } : p))) // optimistic
    try {
      const updated = await treatmentApi.updateTreatmentPlanStatus(id, "abandoned")
      setPlans((prev) => prev.map((p) => (p.id === id ? mapTreatmentPlan(updated, patients) : p)))
      toast.success("Treatment plan marked as abandoned")
    } catch (err) {
      setPlans(previous)
      toast.error("Couldn't mark the plan as abandoned", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Treatment Plans{" "}
            <span className="text-muted-foreground font-normal">
              ({plans.length})
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            All treatment plans across your patients.
          </p>
        </div>
      </div>

      {error && (
        <div className="@container/main px-4 lg:px-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="@container/main px-4 lg:px-6">
        <TreatmentStatCards plans={plans} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        <DataTable
          plans={plans}
          patients={patients}
          onAddPlan={handleAddPlan}
          onEditPlan={handleEditPlan}
          onAbandonPlan={handleAbandonPlan}
        />
        {loading && <p className="mt-4 text-sm text-muted-foreground">Loading treatment plans…</p>}
      </div>
    </div>
  )
}
