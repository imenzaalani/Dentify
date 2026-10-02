"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"

import { waitlistApi } from "@/lib/api/waitlist"
import { ApiError } from "@/lib/api/client"
import { type Patient, type WaitlistEntry } from "./types"
import { buildWaitlistEntry, toWaitlistCreateRequest } from "./data"

export interface UseWaitlistReturn {
  entries: WaitlistEntry[]
  handleAdd: (entry: Omit<WaitlistEntry, "id" | "createdAt" | "status">) => Promise<void>
  handleMarkContacted: (id: string) => Promise<void>
  handleRemove: (id: string) => Promise<void>
  // Called once the appointment created from a waitlist prefill is
  // actually saved — links the two records and drops the entry out of
  // the active waiting list, without a page reload.
  handleScheduled: (waitlistId: string, appointmentId: string) => Promise<void>
}

function errorMessage(err: unknown): string | undefined {
  return err instanceof ApiError || err instanceof Error ? err.message : undefined
}

export function useWaitlist(initialEntries: WaitlistEntry[], refs: { patients: Patient[] }): UseWaitlistReturn {
  const [entries, setEntries] = useState<WaitlistEntry[]>(initialEntries)

  const handleAdd = useCallback(
    async (entry: Omit<WaitlistEntry, "id" | "createdAt" | "status">) => {
      if (!entry.patientId || !entry.careTypeId) {
        toast.error("Sélectionnez un patient et un type de soin")
        return
      }
      try {
        const created = await waitlistApi.createWaitlistEntry(toWaitlistCreateRequest(entry))
        setEntries((prev) => [buildWaitlistEntry(created, refs), ...prev])
        toast.success("Ajouté à la liste d'attente")
      } catch (err) {
        toast.error("Impossible d'ajouter à la liste d'attente", { description: errorMessage(err) })
      }
    },
    [refs]
  )

  const handleMarkContacted = useCallback(
    async (id: string) => {
      const previous = entries
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status: "contacted" } : e))) // optimistic
      try {
        const updated = await waitlistApi.markContacted(id)
        setEntries((prev) => prev.map((e) => (e.id === id ? buildWaitlistEntry(updated, refs) : e)))
      } catch (err) {
        setEntries(previous)
        toast.error("Impossible de marquer ce contact", { description: errorMessage(err) })
      }
    },
    [entries, refs]
  )

  const handleRemove = useCallback(async (id: string) => {
    const previous = entries
    setEntries((prev) => prev.filter((e) => e.id !== id)) // optimistic
    try {
      await waitlistApi.deleteWaitlistEntry(id)
    } catch (err) {
      setEntries(previous)
      toast.error("Impossible de retirer cette entrée", { description: errorMessage(err) })
    }
  }, [entries])

  const handleScheduled = useCallback(
    async (waitlistId: string, appointmentId: string) => {
      try {
        const updated = await waitlistApi.scheduleEntry(waitlistId, appointmentId)
        setEntries((prev) => prev.map((e) => (e.id === waitlistId ? buildWaitlistEntry(updated, refs) : e)))
      } catch (err) {
        // The appointment itself was already created successfully at this
        // point — surface the link failure without pretending the booking
        // failed too.
        toast.error("Rendez-vous créé, mais la liste d'attente n'a pas pu être mise à jour", {
          description: errorMessage(err),
        })
      }
    },
    [refs]
  )

  return { entries, handleAdd, handleMarkContacted, handleRemove, handleScheduled }
}