"use client"

import { Check, X, UserPlus2 } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface PendingConfirmationEntry {
  id: number
  time: string
  patientName: string
  patientAvatar: string
  phone: string
  careLabel: string
  doctorName: string
  isLead: boolean
  requestedAt: string
}

interface PendingConfirmationsProps {
  entries: PendingConfirmationEntry[]
}

export function PendingConfirmations({ entries }: PendingConfirmationsProps) {
  const handleConfirm = (entry: PendingConfirmationEntry) => {
    toast.success(`Rendez-vous confirmé pour ${entry.patientName}`)
  }

  const handleDecline = (entry: PendingConfirmationEntry) => {
    toast(`Demande refusée pour ${entry.patientName}`)
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
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{entry.patientName}</p>
                  {entry.isLead && (
                    <Badge variant="secondary" className="shrink-0 gap-1 text-xs">
                      <UserPlus2 className="size-3" />
                      Lead
                    </Badge>
                  )}
                </div>
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
