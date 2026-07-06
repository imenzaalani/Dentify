import { Stethoscope, UserCheck, Tags, CalendarPlus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Doctor } from "./data-table"

interface DoctorStatCardsProps {
  doctors: Doctor[]
}

export function DoctorStatCards({ doctors }: DoctorStatCardsProps) {
  const total = doctors.length
  const active = doctors.filter((d) => d.status === "Active").length
  const specialties = new Set(doctors.map((d) => d.specialty)).size

  const now = new Date()
  const newThisMonth = doctors.filter((d) => {
    const created = new Date(d.createdAt)
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth()
    )
  }).length

  const metrics = [
    { title: "Total Doctors", value: total, icon: Stethoscope },
    { title: "Active Doctors", value: active, icon: UserCheck },
    { title: "Specialties", value: specialties, icon: Tags },
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
