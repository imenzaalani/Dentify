"use client"

import { PhoneCall } from "lucide-react"
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
import { waitlistApi } from "@/lib/api/waitlist"
import { ApiError } from "@/lib/api/client"

export interface WaitlistAlertEntry {
  id: string
  patientName: string
  patientAvatar: string
  careLabel: string
  priority: "low" | "medium" | "high"
  reason: string
  waitingSince: string
}

interface WaitlistAlertsProps {
  entries: WaitlistAlertEntry[]
  // Called after the entry is successfully marked contacted, so the parent
  // can drop it from the list without a full refetch.
  onContacted?: (id: string) => void
}

function getPriorityColor(priority: WaitlistAlertEntry["priority"]) {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
    case "medium":
      return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
    case "low":
    default:
      return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
  }
}

export function WaitlistAlerts({ entries, onContacted }: WaitlistAlertsProps) {
  const handleContact = async (entry: WaitlistAlertEntry) => {
    try {
      await waitlistApi.markContacted(entry.id)
      toast.success(`${entry.patientName} marqué comme recontacté`)
      onContacted?.(entry.id)
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : undefined
      toast.error("Impossible de marquer ce patient comme recontacté", { description: message })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Waitlist to Recontact</CardTitle>
        <CardDescription>Freed-up slots since the last cancellation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No one is waiting on a freed-up slot.
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
                  <Badge
                    variant="secondary"
                    className={`shrink-0 text-xs ${getPriorityColor(entry.priority)}`}
                  >
                    {entry.priority}
                  </Badge>
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {entry.careLabel} · waiting {entry.waitingSince}
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5"
                onClick={() => handleContact(entry)}
              >
                <PhoneCall className="size-3.5" />
                Contact
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
