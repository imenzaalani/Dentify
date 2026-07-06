"use client"

import { AlertCircle, CalendarPlus, Mail, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CareType, Patient, WaitlistEntry } from "../types"

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
        entries.map((entry) => {
          const careType = careTypeMap.get(entry.careTypeId)
          const patient = patientMap.get(entry.patientId)
          return (
            <Card key={entry.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">{patient ? `${patient.firstName} ${patient.lastName}` : entry.patientName}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {careType?.name ?? entry.careTypeId} • {entry.desiredDateRange.from || "—"} → {entry.desiredDateRange.to || "—"}
                  </p>
                </div>
                <Badge variant={entry.status === "waiting" ? "secondary" : "outline"}>
                  {entry.status}
                </Badge>
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
