"use client"

import { Check, X } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { appointmentApi } from "@/lib/api/appointments"
import { ApiError } from "@/lib/api/client"

export interface PendingConfirmationEntry {
  id: string
  time: string
  patientName: string
  patientAvatar: string
  phone: string
  careLabel: string
  doctorName: string
  requestedAt: string
}

interface PendingConfirmationsProps {
  entries: PendingConfirmationEntry[]
  // Called after the appointment is successfully confirmed/cancelled, so
  // the parent can drop it from the list without a full refetch.
  onConfirmed?: (id: string) => void
  onDeclined?: (id: string) => void
}

function errorMessage(err: unknown): string | undefined {
  return err instanceof ApiError || err instanceof Error ? err.message : undefined
}

export function PendingConfirmations({ entries, onConfirmed, onDeclined }: PendingConfirmationsProps) {
  const handleConfirm = async (entry: PendingConfirmationEntry) => {
    try {
      await appointmentApi.confirmAppointment(entry.id)
      toast.success(`Rendez-vous confirmé pour ${entry.patientName}`)
      onConfirmed?.(entry.id)
    } catch (err) {
      toast.error("Impossible de confirmer le rendez-vous", { description: errorMessage(err) })
    }
  }

  const handleDecline = async (entry: PendingConfirmationEntry) => {
    try {
      await appointmentApi.cancelAppointment(entry.id)
      toast(`Demande refusée pour ${entry.patientName}`)
      onDeclined?.(entry.id)
    } catch (err) {
      toast.error("Impossible de refuser la demande", { description: errorMessage(err) })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Awaiting Confirmation</CardTitle>
        <CardDescription>
          Today&apos;s top priority — confirm before the patient calls back
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nothing waiting on confirmation right now.
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">{entry.patientAvatar}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.patientName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {entry.time} · {entry.careLabel} · {entry.doctorName}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8 text-green-600 hover:text-green-700"
                  onClick={() => handleConfirm(entry)}
                  aria-label={`Confirmer le rendez-vous de ${entry.patientName}`}
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-8 text-red-600 hover:text-red-700"
                  onClick={() => handleDecline(entry)}
                  aria-label={`Refuser le rendez-vous de ${entry.patientName}`}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
