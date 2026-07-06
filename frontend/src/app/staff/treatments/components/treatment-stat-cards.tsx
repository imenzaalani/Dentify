import { ClipboardList, Activity, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { TreatmentPlan } from "./data-table"

interface TreatmentStatCardsProps {
  plans: TreatmentPlan[]
}

export function TreatmentStatCards({ plans }: TreatmentStatCardsProps) {
  const total = plans.length
  const inProgress = plans.filter((p) => p.status === "In Progress").length
  const completed = plans.filter((p) => p.status === "Completed").length
  const abandoned = plans.filter((p) => p.status === "Abandoned").length

  const metrics = [
    { title: "Total Plans", value: total, icon: ClipboardList },
    { title: "In Progress", value: inProgress, icon: Activity },
    { title: "Completed", value: completed, icon: CheckCircle2 },
    { title: "Abandoned", value: abandoned, icon: XCircle },
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