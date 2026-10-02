"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { leadApi } from "@/lib/api/leads"
import { DataTable, type Lead, type LeadStatus } from "./components/data-table"
import { LeadStatCards } from "./components/lead-stat-cards"
import type { LeadFormValues } from "./components/lead-form-sheet"

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    leadApi
      .listLeads()
      .then((data) => {
        if (!cancelled) setLeads(data as Lead[])
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load leads")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleAddLead = async (data: LeadFormValues) => {
    const requestedDateTime = new Date(data.requestedDate)
    try {
      const created = await leadApi.createLead({
        requested_service: data.requestedService,
        requested_datetime: requestedDateTime.toISOString(),
        booking_for: data.bookingFor,
        patient_first_name: data.firstName,
        patient_last_name: data.lastName,
        patient_dob: "", // not collected by this form yet — backend requires it
        contact_email: data.email,
        contact_phone: data.phone,
        sms_consent: data.smsConsent,
        comments: data.comments || null,
        hear_about_us: data.hearAboutUs || null,
      })
      setLeads((prev) => [created, ...prev])
      toast.success(`${data.firstName} ${data.lastName} added as a lead`)
    } catch (err) {
      toast.error("Couldn't save the lead", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  // For every status EXCEPT "converted" — converting has its own dedicated
  // flow below because it creates a real Patient record, not just a status
  // flip. The backend rejects PATCH attempts to set status="converted"
  // directly, so this must never be called with that value.
  const handleChangeStatus = async (id: string, status: Exclude<LeadStatus, "converted">) => {
    const previous = leads
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l))) // optimistic
    try {
      const updated = await leadApi.updateLead(id, { status })
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)))
    } catch (err) {
      setLeads(previous) // roll back
      toast.error("Couldn't update status", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  const handleConvertToPatient = async (id: string) => {
    try {
      const { lead, patient } = await leadApi.convertLead(id)
      setLeads((prev) => prev.map((l) => (l.id === id ? lead : l)))
      toast.success(`${patient.first_name} ${patient.last_name} added as a patient`, {
        description: `Patient #${patient.patient_number}`,
      })
    } catch (err) {
      toast.error("Couldn't convert lead to patient", {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  if (loading) {
    return <div className="px-4 py-8 text-sm text-muted-foreground lg:px-6">Loading leads…</div>
  }

  if (error) {
    return <div className="px-4 py-8 text-sm text-destructive lg:px-6">{error}</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Leads <span className="text-muted-foreground font-normal">({leads.length})</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Booking requests and inquiries waiting to be followed up.
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6">
        <LeadStatCards leads={leads} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        <DataTable
          leads={leads}
          onAddLead={handleAddLead}
          onChangeStatus={handleChangeStatus}
          onConvertToPatient={handleConvertToPatient}
        />
      </div>
    </div>
  )
}