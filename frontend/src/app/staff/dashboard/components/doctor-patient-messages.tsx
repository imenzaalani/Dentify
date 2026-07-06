import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface PatientMessageEntry {
  id: number
  patientName: string
  patientAvatar: string
  patientId: number
  preview: string
  receivedAt: string
}

interface DoctorPatientMessagesProps {
  entries: PatientMessageEntry[]
}

export function DoctorPatientMessages({ entries }: DoctorPatientMessagesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Clinical Messages</CardTitle>
        <CardDescription>
          Patient questions needing a clinical answer — admin requests go to the front desk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No clinical messages waiting on a reply.
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
                <p className="truncate text-xs text-muted-foreground">{entry.preview}</p>
              </div>
              <div className="shrink-0 text-xs text-muted-foreground">{entry.receivedAt}</div>
              <Button size="sm" variant="outline" className="shrink-0">
                Répondre
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
