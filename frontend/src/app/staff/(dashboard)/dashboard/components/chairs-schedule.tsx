import { Armchair, DoorOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Resource } from "../../planning/types"

export interface ChairScheduleEntry {
  id: string
  resourceId: string
  time: string
  patientName: string
  doctorName: string
  status: string
}

interface ChairsScheduleProps {
  resources: Resource[]
  entries: ChairScheduleEntry[]
}

function getStatusColor(status: string) {
  switch (status) {
    case "Arrivé":
      return "text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/20"
    case "Confirmé":
      return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
    case "En attente":
    default:
      return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
  }
}

export function ChairsSchedule({ resources, entries }: ChairsScheduleProps) {
  const activeResources = resources.filter((resource) => resource.active)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today by Chair &amp; Room</CardTitle>
        <CardDescription>Schedule viewed by resource, not just by doctor</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {activeResources.map((resource) => {
            const resourceEntries = entries
              .filter((entry) => entry.resourceId === resource.id)
              .sort((a, b) => a.time.localeCompare(b.time))

            return (
              <div key={resource.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  {resource.type === "chair" ? (
                    <Armchair className="size-4 text-muted-foreground" />
                  ) : (
                    <DoorOpen className="size-4 text-muted-foreground" />
                  )}
                  {resource.name}
                </div>
                {resourceEntries.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Aucun rendez-vous
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {resourceEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1 hover:bg-muted/50"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {entry.time} · {entry.patientName}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {entry.doctorName}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`shrink-0 text-[10px] ${getStatusColor(entry.status)}`}
                        >
                          {entry.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
