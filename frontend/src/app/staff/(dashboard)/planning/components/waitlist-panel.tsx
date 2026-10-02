"use client"

import { useMemo } from "react"
import { AlertCircle, CalendarPlus, Mail, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CareType, Patient, WaitlistEntry, WaitlistPriority } from "../types"

const priorityRank: Record<WaitlistPriority, number> = { high: 0, medium: 1, low: 2 }

const priorityLabels: Record<WaitlistPriority, string> = {
  high: "Priorité haute",
  medium: "Priorité moyenne",
  low: "Priorité basse",
}

// Left-border accent + badge tone, so priority reads at a glance without
// having to parse the badge text on every row.
const priorityStyles: Record<WaitlistPriority, { border: string; badge: string }> = {
  high: { border: "border-l-4 border-l-red-500", badge: "bg-red-100 text-red-700 hover:bg-red-100" },
  medium: { border: "border-l-4 border-l-amber-400", badge: "bg-amber-100 text-amber-700 hover:bg-amber-100" },
  low: { border: "border-l-4 border-l-muted-foreground/30", badge: "" },
}

interface WaitlistPanelProps {
  entries: WaitlistEntry[]
  careTypes: CareType[]
  patients: Patient[]
  onAdd: (entry: Omit<WaitlistEntry, "id" | "createdAt" | "status">) => void
  onMarkContacted: (id: string) => void
  onSchedule: (entry: WaitlistEntry) => void
  onRemove: (id: string) => void
}

export function WaitlistPanel({
  entries,
  careTypes,
  patients,
  onAdd,
  onMarkContacted,
  onSchedule,
  onRemove,
}: WaitlistPanelProps) {
  const careTypeMap = new Map(careTypes.map((careType) => [careType.id, careType]))
  const patientMap = new Map(patients.map((patient) => [patient.id, patient]))

  // Highest priority first, then oldest request first within the same
  // priority — otherwise `priority` sat on the entry with no visible effect
  // on the order staff actually work through the list in.
  const sortedEntries = useMemo(
    () =>
      [...entries].sort((a, b) => {
        const rankDiff = priorityRank[a.priority] - priorityRank[b.priority]
        if (rankDiff !== 0) return rankDiff
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }),
    [entries]
  )

  return (
    <div className="flex-1 space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Liste d&apos;attente</h2>
          <p className="text-sm text-muted-foreground">
            Suivi des patients à recontacter ou à reprogrammer.
          </p>
        </div>
        <Button variant="outline" className="cursor-pointer" onClick={() => onAdd({
          patientId: patients[0]?.id ?? "",
          patientName: patients[0] ? `${patients[0].firstName} ${patients[0].lastName}` : "",
          careTypeId: careTypes[0]?.id ?? "",
          desiredDateRange: { from: "", to: "" },
          priority: "medium",
          notes: "Ajouté depuis le planning",
        })}>
          <CalendarPlus className="mr-2 size-4" />
          Ajouter
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="mb-3 size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Aucune demande en attente</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Les patients qui souhaitent un créneau non disponible apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      ) : (
        sortedEntries.map((entry) => {
          const careType = careTypeMap.get(entry.careTypeId)
          const patient = patientMap.get(entry.patientId)
          const priority = priorityStyles[entry.priority]
          return (
            <Card key={entry.id} className={cn(priority.border)}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{patient ? `${patient.firstName} ${patient.lastName}` : entry.patientName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {careType?.name ?? entry.careTypeId} • {entry.desiredDateRange.from || "—"} → {entry.desiredDateRange.to || "—"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant={entry.status === "waiting" ? "secondary" : "outline"}>
                    {entry.status}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[11px]", priority.badge)}>
                    {priorityLabels[entry.priority]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">
                  {entry.notes || "Aucune note"}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => onMarkContacted(entry.id)}>
                    <Mail className="mr-2 size-4" />
                    Contacter
                  </Button>
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => onSchedule(entry)}>
                    <CalendarPlus className="mr-2 size-4" />
                    Planifier
                  </Button>
                  <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => onRemove(entry.id)}>
                    <Trash2 className="mr-2 size-4" />
                    Retirer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}
