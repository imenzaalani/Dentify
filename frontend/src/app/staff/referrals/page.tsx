"use client"

import { useState } from "react"
import { toast } from "sonner"

import { DataTable, type Referral } from "./components/data-table"
import { ReferralStatCards } from "./components/referral-stat-cards"
import type { ReferralFormValues } from "./components/referral-form-sheet"

import initialReferralsData from "./data.json"
import patientsData from "../patients/data.json"

const patients = patientsData as {
  id: number
  firstName: string
  lastName: string
  avatar: string
}[]

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>(
    initialReferralsData as Referral[]
  )

  const handleAddReferral = (data: ReferralFormValues) => {
    const patient = patients.find((p) => p.id === Number(data.patientId))

    const newReferral: Referral = {
      id: Math.max(0, ...referrals.map((r) => r.id)) + 1,
      patientId: Number(data.patientId),
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
      patientAvatar: patient?.avatar ?? "",
      specialistName: data.specialistName,
      specialty: data.specialty,
      reason: data.reason,
      date: data.date.toISOString().split("T")[0],
      status: "Pending",
      notes: data.notes,
      createdAt: new Date().toISOString().split("T")[0],
    }

    setReferrals((prev) => [newReferral, ...prev])
    toast.success(`Referral to ${newReferral.specialistName} created`, {
      description: `For ${newReferral.patientName}.`,
    })
  }

  const handleEditReferral = (id: number, data: ReferralFormValues) => {
    setReferrals((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const patient = patients.find((p) => p.id === Number(data.patientId))
        return {
          ...r,
          patientId: Number(data.patientId),
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : r.patientName,
          patientAvatar: patient?.avatar ?? r.patientAvatar,
          specialistName: data.specialistName,
          specialty: data.specialty,
          reason: data.reason,
          date: data.date.toISOString().split("T")[0],
          notes: data.notes,
        }
      })
    )
    toast.success("Referral updated")
  }

  const handleCancelReferral = (id: number) => {
    setReferrals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "Cancelled" as const } : r))
    )
    toast.success("Referral cancelled")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Referrals{" "}
            <span className="text-muted-foreground font-normal">
              ({referrals.length})
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Specialist referrals across your patients.
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6">
        <ReferralStatCards referrals={referrals} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        <DataTable
          referrals={referrals}
          onAddReferral={handleAddReferral}
          onEditReferral={handleEditReferral}
          onCancelReferral={handleCancelReferral}
        />
      </div>
    </div>
  )
}