import { CheckCircle2, Circle, CircleDot } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export type TreatmentStepStatus = "done" | "next" | "upcoming"

export interface TreatmentStep {
  id: string
  date: string // ISO date
  procedure: string
  tooth: string
  practitioner: string
  notes: string | null // only steps marked visible-to-patient reach the client
  status: TreatmentStepStatus
}

function StepIcon({ status }: { status: TreatmentStepStatus }) {
  if (status === "done") {
    return <CheckCircle2 className="size-5 text-primary" />
  }
  if (status === "next") {
    return <CircleDot className="size-5 text-primary" />
  }
  return <Circle className="size-5 text-muted-foreground" />
}

export function TreatmentTimeline({ steps }: { steps: TreatmentStep[] }) {
  return (
    <div className="flex flex-col">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        const formattedDate = new Date(step.date).toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })

        return (
          <div key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <div
                className={cn(
                  "absolute left-[10px] top-6 h-full w-px",
                  step.status === "upcoming" ? "bg-border" : "bg-primary/40"
                )}
              />
            )}

            <div className="z-10 flex size-5 shrink-0 items-center justify-center">
              <StepIcon status={step.status} />
            </div>

            <Card
              className={cn(
                "flex-1",
                step.status === "next" && "border-primary shadow-sm",
                step.status === "upcoming" && "opacity-70"
              )}
            >
              <CardContent className="flex flex-col gap-1.5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{formattedDate}</span>
                  {step.status === "next" && <Badge>Next appointment</Badge>}
                  {step.status === "done" && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Completed
                    </Badge>
                  )}
                </div>
                <h3 className="font-medium">{step.procedure}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>Tooth/area: {step.tooth}</span>
                  <span>Practitioner: {step.practitioner}</span>
                </div>
                {step.notes && (
                  <p className="mt-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
                    {step.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
