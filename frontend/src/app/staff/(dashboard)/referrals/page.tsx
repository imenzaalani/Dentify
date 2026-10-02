"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { patientApi } from "@/lib/api/patients"
import { referralApi } from "@/lib/api/referrals"
import { ApiError } from "@/lib/api/client"

import { DataTable, type Referral } from "./components/data-table"
import { ReferralStatCards } from "./components/referral-stat-cards"
import type { ReferralFormValues } from "./components/referral-form-sheet"
import { buildCreatePayload, buildUpdatePayload, mapReferral, toSimplePatient, type SimplePatient } from "./data"

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([])
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

        const referralsRes = await referralApi.listReferrals()
        const mappedReferrals = referralsRes.map((r) => mapReferral(r, mappedPatients))

        if (cancelled) return
        setPatients(mappedPatients)
        setReferrals(mappedReferrals)
        setError(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Couldn't load referrals")
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

  const handleAddReferral = async (data: ReferralFormValues) => {
    try {
      const created = await referralApi.createReferral(buildCreatePayload(data))
      const mapped = mapReferral(created, patients)
      setReferrals((prev) => [mapped, ...prev])
      toast.success(`Referral to ${mapped.specialistName} created`, {
        description: `For ${mapped.patientName}.`,
      })
    } catch (err) {
      toast.error("Couldn't save the referral", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  const handleEditReferral = async (id: string, data: ReferralFormValues) => {
    try {
      const updated = await referralApi.updateReferral(id, buildUpdatePayload(data))
      setReferrals((prev) => prev.map((r) => (r.id === id ? mapReferral(updated, patients) : r)))
      toast.success("Referral updated")
    } catch (err) {
      toast.error("Couldn't update the referral", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  const handleCancelReferral = async (id: string) => {
    const previous = referrals
    setReferrals((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Cancelled" as const } : r))) // optimistic
    try {
      const updated = await referralApi.updateReferralStatus(id, "cancelled")
      setReferrals((prev) => prev.map((r) => (r.id === id ? mapReferral(updated, patients) : r)))
      toast.success("Referral cancelled")
    } catch (err) {
      setReferrals(previous)
      toast.error("Couldn't cancel the referral", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
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

      {error && (
        <div className="@container/main px-4 lg:px-6">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="@container/main px-4 lg:px-6">
        <ReferralStatCards referrals={referrals} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        <DataTable
          referrals={referrals}
          patients={patients}
          onAddReferral={handleAddReferral}
          onEditReferral={handleEditReferral}
          onCancelReferral={handleCancelReferral}
        />
        {loading && <p className="mt-4 text-sm text-muted-foreground">Loading referrals…</p>}
      </div>
    </div>
  )
}
