import { Bell, MessageCircle, FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface DashboardNotification {
  id: string
  type: "reminder" | "message" | "document"
  title: string
  message: string
  date: string // ISO
  read: boolean
}

const ICONS: Record<DashboardNotification["type"], typeof Bell> = {
  reminder: Bell,
  message: MessageCircle,
  document: FileText,
}

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return `${diffDays} days ago`
}

export function NotificationsCard({
  notifications,
}: {
  notifications: DashboardNotification[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>Recent Notifications</CardDescription>
        <CardTitle className="text-lg font-medium">
          {notifications.filter((n) => !n.read).length} unread
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {notifications.length === 0 && (
          <p className="text-sm text-muted-foreground">No notifications at the moment.</p>
        )}
        {notifications.map((n) => {
          const Icon = ICONS[n.type]
          return (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-3 rounded-md p-2 text-sm",
                !n.read && "bg-muted/50"
              )}
            >
              <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="size-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 font-medium">
                  {n.title}
                  {!n.read && <span className="size-1.5 rounded-full bg-primary" />}
                </div>
                <p className="text-muted-foreground">{n.message}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {relativeTime(n.date)}
              </span>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
