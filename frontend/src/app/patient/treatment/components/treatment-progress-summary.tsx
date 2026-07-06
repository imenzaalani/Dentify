import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface TreatmentSummary {
  name: string
  progressPct: number
  completedSteps: number
  totalSteps: number
}

export function TreatmentProgressSummary({
  treatment,
}: {
  treatment: TreatmentSummary
}) {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardDescription>Current treatment</CardDescription>
        <CardTitle className="text-2xl font-semibold @[250px]/card:text-3xl">
          {treatment.name}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">{treatment.progressPct}% complete</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Progress value={treatment.progressPct} />
        <p className="text-sm text-muted-foreground">
          {treatment.completedSteps} of {treatment.totalSteps} steps completed
        </p>
      </CardContent>
    </Card>
  )
}
