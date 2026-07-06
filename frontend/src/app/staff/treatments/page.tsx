"use client"

import { useState } from "react"
import { toast } from "sonner"

import { DataTable, type TreatmentPlan } from "./components/data-table"
import { TreatmentStatCards } from "./components/treatment-stat-cards"
import type { TreatmentFormValues } from "./components/treatment-form-sheet"

import initialPlansData from "./data.json"
import patientsData from "../patients/data.json"

const patients = patientsData as {
  id: number
  firstName: string
  lastName: string
  avatar: string
}[]

export default function TreatmentsPage() {
  const [plans, setPlans] = useState<TreatmentPlan[]>(
    initialPlansData as TreatmentPlan[]
  )

  const handleAddPlan = (data: TreatmentFormValues) => {
    const patient = patients.find((p) => p.id === Number(data.patientId))

    const newPlan: TreatmentPlan = {
      id: Math.max(0, ...plans.map((p) => p.id)) + 1,
      patientId: Number(data.patientId),
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
      patientAvatar: patient?.avatar ?? "",
      title: data.title,
      diagnosis: data.diagnosis,
      startDate: data.startDate.toISOString().split("T")[0],
      endDate: data.endDate ? data.endDate.toISOString().split("T")[0] : null,
      status: "Planned",
      notes: data.notes,
      steps: data.steps.map((step, index) => ({
        id: `new-${Date.now()}-${index}`,
        label: step.label,
        tooth: step.tooth,
        estDuration: step.estDuration,
        status: "pending" as const,
      })),
      createdAt: new Date().toISOString().split("T")[0],
    }

    setPlans((prev) => [newPlan, ...prev])
    toast.success(`Treatment plan "${data.title}" created`, {
      description: `Assigned to ${newPlan.patientName}.`,
    })
  }

  const handleEditPlan = (id: number, data: TreatmentFormValues) => {
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const patient = patients.find((pt) => pt.id === Number(data.patientId))
        return {
          ...p,
          patientId: Number(data.patientId),
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : p.patientName,
          patientAvatar: patient?.avatar ?? p.patientAvatar,
          title: data.title,
          diagnosis: data.diagnosis,
          startDate: data.startDate.toISOString().split("T")[0],
          endDate: data.endDate ? data.endDate.toISOString().split("T")[0] : null,
          notes: data.notes,
          steps: data.steps.map((step, index) => {
            const existing = p.steps[index]
            return {
              id: existing ? existing.id : `new-${Date.now()}-${index}`,
              label: step.label,
              tooth: step.tooth,
              estDuration: step.estDuration,
              status: existing ? existing.status : ("pending" as const),
            }
          }),
        }
      })
    )
    toast.success(`Treatment plan "${data.title}" updated`)
  }

  const handleAbandonPlan = (id: number) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "Abandoned" as const } : p))
    )
    toast.success("Treatment plan marked as abandoned")
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

      <div className="@container/main px-4 lg:px-6">
        <TreatmentStatCards plans={plans} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        <DataTable
          plans={plans}
          onAddPlan={handleAddPlan}
          onEditPlan={handleEditPlan}
          onAbandonPlan={handleAbandonPlan}
        />
      </div>
    </div>
  )
}