import { Clock } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface WaitingRoomEntry {
  id: number
  patientName: string
  patientAvatar: string
  arrivedAt: string
  waitMinutes: number
  appointmentTime: string
  doctorName: string
  resourceName: string
}

interface WaitingRoomQueueProps {
  entries: WaitingRoomEntry[]
}

function getWaitColor(minutes: number) {
  if (minutes >= 20) return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
  if (minutes >= 10)
    return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
  return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
}

export function WaitingRoomQueue({ entries }: WaitingRoomQueueProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Waiting Room</CardTitle>
        <CardDescription>Who&apos;s here and how long they&apos;ve waited</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No one checked in yet.
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
                  {entry.resourceName} · {entry.doctorName} · RDV {entry.appointmentTime}
                </p>
              </div>
              <Badge variant="secondary" className={`shrink-0 gap-1 ${getWaitColor(entry.waitMinutes)}`}>
                <Clock className="size-3" />
                {entry.waitMinutes} min
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
