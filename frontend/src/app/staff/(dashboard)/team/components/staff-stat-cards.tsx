import { Users, UserCheck, Stethoscope, Headset, type LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { TeamMember } from "./data-table"

interface StaffStatCardsProps {
  members: TeamMember[]
  isLoading?: boolean
}

interface Metric {
  title: string
  value: number
  icon: LucideIcon
  tint: string
}

export function StaffStatCards({ members, isLoading = false }: StaffStatCardsProps) {
  const total = members.length
  const active = members.filter((m) => m.status === "Active").length
  const dentists = members.filter((m) => m.role === "dentist").length
  const receptionists = members.filter((m) => m.role === "receptionist").length

  const metrics: Metric[] = [
    {
      title: "Total Staff",
      value: total,
      icon: Users,
      tint: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800/60",
    },
    {
      title: "Active",
      value: active,
      icon: UserCheck,
      tint: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20",
    },
    {
      title: "Doctors",
      value: dentists,
      icon: Stethoscope,
      tint: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20",
    },
    {
      title: "Receptionists",
      value: receptionists,
      icon: Headset,
      tint: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.title} className="border">
            <CardContent className="flex items-center gap-4">
              <Skeleton className="size-10 shrink-0 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card
          key={metric.title}
          className="border transition-shadow hover:shadow-sm"
        >
          <CardContent className="flex items-center gap-4">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${metric.tint}`}>
              <metric.icon className="size-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
              <div className="text-2xl font-bold leading-none">{metric.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}