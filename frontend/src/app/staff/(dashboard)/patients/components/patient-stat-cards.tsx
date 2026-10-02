import { Users, UserCheck, CalendarClock, UserPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Patient } from "./types"
import { isArchived } from "./types"

interface PatientStatCardsProps {
  patients: Patient[]
}

export function PatientStatCards({ patients }: PatientStatCardsProps) {
  const total = patients.length
  const active = patients.filter((p) => !isArchived(p)).length
  const recallDue = patients.filter((p) => p.lifecycle_stage === "recall").length
  const newPatients = patients.filter((p) => p.lifecycle_stage === "new").length

  const metrics = [
    { title: "Total Patients", value: total, icon: Users },
    { title: "Active Patients", value: active, icon: UserCheck },
    { title: "Recall Due", value: recallDue, icon: CalendarClock },
    { title: "New Patients", value: newPatients, icon: UserPlus },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="border">
          <CardContent className="space-y-3">
            <metric.icon className="text-muted-foreground size-6" />
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm font-medium">
                {metric.title}
              </p>
              <div className="text-2xl font-bold">{metric.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}