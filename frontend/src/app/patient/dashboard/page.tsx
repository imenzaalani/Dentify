"use client"

import { useEffect, useState } from "react"

import { NextAppointmentCard, type NextAppointment } from "./components/next-appointment-card"
import { TreatmentProgressCard, type TreatmentSummary } from "./components/treatment-progress-card"
import { NotificationsCard, type DashboardNotification } from "./components/notifications-card"
import { QuickActions } from "./components/quick-actions"

import { RequireAuth } from "@/app/(auth)/components/require-auth"
import { apiRequest, ApiError } from "@/lib/api"

interface DashboardData {
  nextAppointment: NextAppointment | null
  treatment: TreatmentSummary | null
  notifications: DashboardNotification[]
}

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    apiRequest<DashboardData>("/patients/me/dashboard")
      .then((res) => {
        if (!cancelled) setData(res)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : "Couldn't load your dashboard.")
        // Fail soft: show the page with empty cards rather than a dead end.
        setData({ nextAppointment: null, treatment: null, notifications: [] })
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (!data) {
    return (
      <div className="px-4 py-16 text-center text-sm text-muted-foreground lg:px-6">
        Loading your dashboard…
      </div>
    )
  }

  return (
    <>
      {/* Page Title and Description */}
      <div className="px-4 lg:px-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome — here&apos;s where you are in your care journey.
          </p>
        </div>
        {error && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {error} Showing what we could load.
          </p>
        )}
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <QuickActions />
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs grid gap-4 md:grid-cols-2">
          <NextAppointmentCard appointment={data.nextAppointment} />
          <TreatmentProgressCard treatment={data.treatment} />
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6 space-y-6">
        <NotificationsCard notifications={data.notifications} />
      </div>
    </>
  )
}

export default function PatientDashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  )
}