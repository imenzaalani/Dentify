"use client"

import { Download } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { downloadCsv } from "@/lib/export"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { PeriodRange } from "../lib/aggregate"
import { topActs } from "../lib/aggregate"

const formatTND = (amount: number) => `${amount.toLocaleString("fr-TN")} TND`

interface TopActsTableProps {
  range: PeriodRange
}

export function TopActsTable({ range }: TopActsTableProps) {
  const acts = topActs(range, 10)

  const handleExport = () => {
    downloadCsv({
      filename: `top-procedures-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["Rank", "Procedure", "Count", "Revenue (TND)"],
      rows: acts.map((act, index) => [index + 1, act.type, act.count, act.revenue]),
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Top 10 Procedures</CardTitle>
          <CardDescription>Most frequent procedures in the period</CardDescription>
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
                <TableHead className="w-10">#</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acts.length ? (
                acts.map((act, index) => (
                  <TableRow key={act.type}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium">{act.type}</TableCell>
                    <TableCell className="text-right">{act.count}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatTND(act.revenue)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No procedures recorded for this period.
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
