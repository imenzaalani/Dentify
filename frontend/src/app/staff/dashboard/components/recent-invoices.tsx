import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface InvoiceEntry {
  id: number
  number: string
  patientName: string
  patientAvatar: string
  total: number
  status: "Paid" | "Sent" | "Partially Paid" | "Overdue" | "Draft"
  issueDate: string
}

interface RecentInvoicesProps {
  invoices: InvoiceEntry[]
}

function getStatusColor(status: InvoiceEntry["status"]) {
  switch (status) {
    case "Paid":
      return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
    case "Partially Paid":
      return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
    case "Sent":
      return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
    case "Overdue":
      return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
    case "Draft":
    default:
      return "text-gray-500 bg-gray-50 dark:text-gray-500 dark:bg-gray-900/20"
  }
}

export function RecentInvoices({ invoices }: RecentInvoicesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Invoices</CardTitle>
        <CardDescription>Latest billing activity across the practice</CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {invoices.map((invoice) => (
          <div
            key={invoice.id}
            className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-muted/50"
          >
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs">{invoice.patientAvatar}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{invoice.patientName}</p>
              <p className="truncate text-xs text-muted-foreground font-mono">
                {invoice.number} · {invoice.issueDate}
              </p>
            </div>
            <span className="shrink-0 text-sm font-medium tabular-nums">
              {invoice.total.toLocaleString()} TND
            </span>
            <Badge
              variant="secondary"
              className={`shrink-0 ${getStatusColor(invoice.status)}`}
            >
              {invoice.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}