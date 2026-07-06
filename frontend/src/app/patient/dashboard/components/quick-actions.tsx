import Link from "next/link"
import { CalendarPlus, MessageSquarePlus, FolderOpen } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"

const ACTIONS = [
  {
    title: "Book an appointment",
    href: "/patient/rendez-vous",
    icon: CalendarPlus,
  },
  {
    title: "Send a message",
    href: "/patient/messages",
    icon: MessageSquarePlus,
  },
  {
    title: "View my documents",
    href: "/patient/documents",
    icon: FolderOpen,
  },
]

export function QuickActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {ACTIONS.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <action.icon className="size-4" />
              </div>
              <span className="text-sm font-medium">{action.title}</span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
