import { Headset, UserCheck, UserX, CalendarPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Receptionist } from "./data-table"

interface ReceptionistStatCardsProps {
  receptionists: Receptionist[]
}

export function ReceptionistStatCards({ receptionists }: ReceptionistStatCardsProps) {
  const total = receptionists.length
  const active = receptionists.filter((r) => r.status === "Active").length
  const inactive = total - active

  const now = new Date()
  const newThisMonth = receptionists.filter((r) => {
    const created = new Date(r.createdAt)
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth()
    )
  }).length

  const metrics = [
    { title: "Total Receptionists", value: total, icon: Headset },
    { title: "Active", value: active, icon: UserCheck },
    { title: "Inactive", value: inactive, icon: UserX },
    { title: "New This Month", value: newThisMonth, icon: CalendarPlus },
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