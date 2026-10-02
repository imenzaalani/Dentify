import { TrendingUp, Clock, FileWarning, FileQuestion } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Invoice } from "./data-table"

interface BillingStatCardsProps {
  invoices: Invoice[]
}

const formatTND = (amount: number) =>
  `${amount.toLocaleString("fr-TN", { maximumFractionDigits: 0 })} TND`

export function BillingStatCards({ invoices }: BillingStatCardsProps) {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const revenueThisMonth = invoices
    .flatMap((inv) => inv.payments)
    .filter((p) => {
      const d = new Date(p.payment_date)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    .reduce((sum, p) => sum + p.amount, 0)

  const pendingTotal = invoices
    .filter(
      (inv) =>
        inv.doc_type === "invoice" && inv.status !== "paid" && inv.status !== "draft"
    )
    .reduce((sum, inv) => sum + inv.balance, 0)

  const unpaidInvoiceCount = invoices.filter(
    (inv) =>
      inv.doc_type === "invoice" &&
      (inv.status === "sent" ||
        inv.status === "partially_paid" ||
        inv.status === "overdue")
  ).length

  const pendingQuoteCount = invoices.filter(
    (inv) =>
      inv.doc_type === "quote" && (inv.status === "draft" || inv.status === "sent")
  ).length

  const metrics = [
    {
      title: "Revenue This Month",
      value: formatTND(revenueThisMonth),
      icon: TrendingUp,
    },
    { title: "Pending Payment", value: formatTND(pendingTotal), icon: Clock },
    {
      title: "Unpaid Invoices",
      value: unpaidInvoiceCount,
      icon: FileWarning,
    },
    {
      title: "Quotes Awaiting Validation",
      value: pendingQuoteCount,
      icon: FileQuestion,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="border">
          <CardContent className="space-y-3">
            <metric.icon className="text-muted-foreground size-6" />
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm font-medium">
                {metric.title}
              </p>
              <div className="text-2xl font-bold">{metric.value}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}