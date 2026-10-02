"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Download } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { downloadCsv } from "@/lib/export"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { statsApi } from "@/lib/api/stats"
import { ApiError } from "@/lib/api/client"
import type { UnpaidInvoice } from "@/types/stats"

const formatTND = (amount: number) => `${amount.toLocaleString("fr-TN")} TND`

export function UnpaidTable() {
  const [unpaid, setUnpaid] = useState<UnpaidInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    statsApi
      .getUnpaidInvoices()
      .then((data) => {
        if (!cancelled) setUnpaid(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Failed to load outstanding payments")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleExport = () => {
    downloadCsv({
      filename: `outstanding-payments-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["Invoice", "Patient", "Balance (TND)", "Overdue days"],
      rows: unpaid.map((inv) => [inv.number, inv.patient_name, inv.balance, inv.days_overdue]),
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Outstanding Payments</CardTitle>
          <CardDescription>Invoices past their due date</CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={handleExport}
          disabled={loading || unpaid.length === 0}
        >
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Overdue by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-destructive">
                    {error}
                  </TableCell>
                </TableRow>
              ) : unpaid.length ? (
                unpaid.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link
                        href={`/staff/billing/${inv.id}`}
                        className="font-mono text-sm font-medium hover:underline"
                      >
                        {inv.number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/staff/patients/${inv.patient_id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {inv.patient_name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatTND(inv.balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.days_overdue > 0 ? (
                        <Badge className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                          {inv.days_overdue} days
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Due soon</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No outstanding payments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}