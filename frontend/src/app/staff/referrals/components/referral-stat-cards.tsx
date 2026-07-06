import { Share2, Send, CheckCircle2, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Referral } from "./data-table"

interface ReferralStatCardsProps {
  referrals: Referral[]
}

export function ReferralStatCards({ referrals }: ReferralStatCardsProps) {
  const total = referrals.length
  const pending = referrals.filter((r) => r.status === "Pending").length
  const completed = referrals.filter((r) => r.status === "Completed").length
  const cancelled = referrals.filter((r) => r.status === "Cancelled").length

  const metrics = [
    { title: "Total Referrals", value: total, icon: Share2 },
    { title: "Pending", value: pending, icon: Send },
    { title: "Completed", value: completed, icon: CheckCircle2 },
    { title: "Cancelled", value: cancelled, icon: XCircle },
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