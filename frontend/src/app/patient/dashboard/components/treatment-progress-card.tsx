import Link from "next/link"
import { ClipboardList } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface TreatmentSummary {
  name: string
  progressPct: number
  completedSteps: number
  totalSteps: number
  nextStepLabel: string
}

export function TreatmentProgressCard({
  treatment,
}: {
  treatment: TreatmentSummary | null
}) {
  if (!treatment) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Current Treatment</CardDescription>
          <CardTitle className="text-lg font-medium text-muted-foreground">
            No active treatment
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>Current Treatment</CardDescription>
        <CardTitle className="text-2xl font-semibold @[250px]/card:text-3xl">
          {treatment.name}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">{treatment.progressPct}%</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={treatment.progressPct} />
        <div className="text-sm text-muted-foreground">
          {treatment.completedSteps} / {treatment.totalSteps} steps completed
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ClipboardList className="size-4 text-muted-foreground" />
          <span>
            Next step: <span className="font-medium">{treatment.nextStepLabel}</span>
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" size="sm">
          <Link href="/patient/treatment">View my treatment</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
