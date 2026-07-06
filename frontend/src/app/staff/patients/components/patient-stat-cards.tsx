import { Users, UserCheck, ClipboardList, UserPlus2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Patient } from "./data-table"

interface PatientStatCardsProps {
  patients: Patient[]
}

export function PatientStatCards({ patients }: PatientStatCardsProps) {
  const total = patients.length
  const active = patients.filter((p) => p.status === "Active").length
  const activeTreatments = patients.filter((p) => p.activeTreatment.active).length
  const pendingLeads = patients.filter((p) => p.patientStatus === "lead").length

  const metrics = [
    { title: "Total Patients", value: total, icon: Users },
    { title: "Active Patients", value: active, icon: UserCheck },
    { title: "Ongoing Treatments", value: activeTreatments, icon: ClipboardList },
    { title: "Pending Leads", value: pendingLeads, icon: UserPlus2 },
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