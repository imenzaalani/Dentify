import { FileText } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface PendingNoteEntry {
  id: number
  patientName: string
  patientAvatar: string
  patientId: number
  procedure: string
  seenAt: string
  daysWaiting: number
}

interface DoctorPendingNotesProps {
  entries: PendingNoteEntry[]
}

export function DoctorPendingNotes({ entries }: DoctorPendingNotesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dossiers to Finalize</CardTitle>
        <CardDescription>Clinical notes not yet completed after the act</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            All clinical notes are up to date.
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
                <p className="truncate text-xs text-muted-foreground">
                  {entry.procedure} · {entry.seenAt}
                </p>
              </div>
              {entry.daysWaiting > 0 && (
                <Badge
                  variant="secondary"
                  className="shrink-0 text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
                >
                  {entry.daysWaiting}j
                </Badge>
              )}
              <Button size="sm" variant="outline" className="shrink-0 gap-1.5">
                <FileText className="size-3.5" />
                Compléter
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
