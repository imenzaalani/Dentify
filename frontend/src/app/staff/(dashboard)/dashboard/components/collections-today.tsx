"use client"

import Link from "next/link"
import { toast } from "sonner"

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

export interface CollectionEntry {
  id: string
  patientName: string
  patientAvatar: string
  invoiceNumber: string
  amountDue: number
  status: "Unpaid" | "Partially Paid"
}

interface CollectionsTodayProps {
  entries: CollectionEntry[]
}

function getStatusColor(status: CollectionEntry["status"]) {
  return status === "Unpaid"
    ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
    : "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
}

export function CollectionsToday({ entries }: CollectionsTodayProps) {
  const total = entries.reduce((sum, entry) => sum + entry.amountDue, 0)

  const handleCollect = (entry: CollectionEntry) => {
    toast.success(`Encaissement enregistré pour ${entry.patientName}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>To Collect Today</CardTitle>
        <CardDescription>
          {total.toLocaleString()} TND outstanding across {entries.length} invoice
          {entries.length > 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nothing outstanding right now.
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
                <p className="truncate text-xs text-muted-foreground font-mono">
                  {entry.invoiceNumber}
                </p>
              </div>
              <Badge variant="secondary" className={`shrink-0 ${getStatusColor(entry.status)}`}>
                {entry.status}
              </Badge>
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {entry.amountDue.toLocaleString()} TND
              </span>
              <Button size="sm" variant="outline" onClick={() => handleCollect(entry)}>
                Collect
              </Button>
            </div>
          ))
        )}
      </CardContent>
      {entries.length > 0 && (
        <div className="px-6 pb-4">
          <Button variant="link" className="h-auto p-0 text-sm" asChild>
            <Link href="/staff/billing">View all billing</Link>
          </Button>
        </div>
      )}
    </Card>
  )
}
