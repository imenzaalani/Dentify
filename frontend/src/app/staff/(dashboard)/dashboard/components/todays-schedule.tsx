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

export interface ScheduleEntry {
  id: number
  time: string
  patientName: string
  patientAvatar: string
  doctorName: string
  doctorColor: string
  type: string
  status: "Confirmed" | "Waiting" | "In Progress" | "Completed"
}

interface TodaysScheduleProps {
  entries: ScheduleEntry[]
}

function getStatusColor(status: ScheduleEntry["status"]) {
  switch (status) {
    case "Completed":
      return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
    case "In Progress":
      return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
    case "Waiting":
      return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
    case "Confirmed":
    default:
      return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
  }
}

export function TodaysSchedule({ entries }: TodaysScheduleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today&apos;s Schedule</CardTitle>
        <CardDescription>Wednesday, July 1 — {entries.length} appointments</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No appointments scheduled for today.
          </p>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
            >
              <div className="flex w-16 shrink-0 items-center gap-1 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                {entry.time}
              </div>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs">{entry.patientAvatar}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.patientName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {entry.type} · Dr. {entry.doctorName}
                </p>
              </div>
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.doctorColor }}
                aria-hidden
              />
              <Badge
                variant="secondary"
                className={`shrink-0 ${getStatusColor(entry.status)}`}
              >
                {entry.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}