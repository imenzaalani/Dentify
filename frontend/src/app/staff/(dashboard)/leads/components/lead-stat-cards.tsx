import { UserPlus2, PhoneOff, UserCheck, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Lead } from "./types"

interface LeadStatCardsProps {
  leads: Lead[]
}

export function LeadStatCards({ leads }: LeadStatCardsProps) {
  const total = leads.length
  const pending = leads.filter((l) => l.status === "pending").length
  const noResponse = leads.filter((l) => l.status === "no_response").length
  const converted = leads.filter((l) => l.status === "converted").length
  const closed = leads.filter(
    (l) => l.status === "converted" || l.status === "rejected"
  ).length
  const conversionRate = closed > 0 ? Math.round((converted / closed) * 100) : 0

  const metrics = [
    { title: "Total Leads", value: total, icon: UserPlus2 },
    { title: "Pending", value: pending, icon: UserCheck },
    { title: "No Response", value: noResponse, icon: PhoneOff },
    { title: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp },
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