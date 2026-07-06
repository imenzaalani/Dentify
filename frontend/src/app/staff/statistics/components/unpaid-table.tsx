"use client"

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
import { ANCHOR_DATE } from "../lib/aggregate"

import invoicesData from "../../billing/data.json"
import type { Invoice } from "../../billing/components/data-table"

const formatTND = (amount: number) => `${amount.toLocaleString("fr-TN")} TND`

const invoices = invoicesData as Invoice[]

export function UnpaidTable() {
  const unpaid = invoices
    .filter(
      (inv) =>
        inv.type === "Invoice" &&
        inv.status !== "Paid" &&
        inv.status !== "Draft" &&
        inv.balance > 0 &&
        inv.dueDate
    )
    .map((inv) => {
      const daysOverdue = Math.max(
        0,
        Math.round(
          (ANCHOR_DATE.getTime() - new Date(inv.dueDate as string).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
      return { ...inv, daysOverdue }
    })
    .sort((a, b) => b.daysOverdue - a.daysOverdue)

  const handleExport = () => {
    downloadCsv({
      filename: `outstanding-payments-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["Invoice", "Patient", "Balance (TND)", "Overdue days"],
      rows: unpaid.map((inv) => [inv.number, inv.patientName, inv.balance, inv.daysOverdue]),
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
              {unpaid.length ? (
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
                        href={`/staff/patients/${inv.patientId}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {inv.patientName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatTND(inv.balance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {inv.daysOverdue > 0 ? (
                        <Badge className="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                          {inv.daysOverdue} days
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
