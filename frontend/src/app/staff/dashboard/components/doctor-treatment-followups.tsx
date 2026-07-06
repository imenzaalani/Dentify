import { ArrowRight } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface TreatmentFollowupEntry {
  id: number
  patientName: string
  patientAvatar: string
  patientId: number
  title: string
  nextStep: string
  tooth: string
  estDuration: number
}

interface DoctorTreatmentFollowupsProps {
  entries: TreatmentFollowupEntry[]
}

export function DoctorTreatmentFollowups({ entries }: DoctorTreatmentFollowupsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Plans — Next Step</CardTitle>
        <CardDescription>Ongoing plans that need their next visit scheduled</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No treatment plans awaiting a next step.
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">{entry.patientAvatar}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.patientName}</p>
                <p className="truncate text-xs text-muted-foreground">{entry.title}</p>
              </div>
              <div className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <ArrowRight className="size-3.5" />
                {entry.nextStep}
              </div>
              <Badge variant="outline" className="shrink-0">
                {entry.tooth}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
