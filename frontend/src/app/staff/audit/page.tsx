"use client"

import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Search, Download, ShieldAlert } from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { downloadCsv } from "@/lib/export"

interface AuditLogEntry {
  id: number
  timestamp: string
  actor: string
  actorInitials: string
  actorRole: "Super Admin" | "Admin" | "Doctor" | "System"
  action: "Create" | "Update" | "Delete" | "Login" | "Export" | "Failed Login"
  target: string
  ipAddress: string
  details: string
}

const auditLogData: AuditLogEntry[] = [
  { id: 1, timestamp: "2026-06-30 09:12", actor: "Amel Ben Salah", actorInitials: "AB", actorRole: "Admin", action: "Login", target: "Session", ipAddress: "197.14.22.10", details: "Successful login" },
  { id: 2, timestamp: "2026-06-30 09:20", actor: "Amel Ben Salah", actorInitials: "AB", actorRole: "Admin", action: "Create", target: "Patient #245", ipAddress: "197.14.22.10", details: "New patient record created" },
  { id: 3, timestamp: "2026-06-30 10:03", actor: "Karim Trabelsi", actorInitials: "KT", actorRole: "Doctor", action: "Update", target: "Treatment Plan #88", ipAddress: "197.14.22.41", details: "Updated treatment steps" },
  { id: 4, timestamp: "2026-06-29 14:47", actor: "System", actorInitials: "SY", actorRole: "System", action: "Export", target: "Global Reports", ipAddress: "—", details: "Scheduled CSV export generated" },
  { id: 5, timestamp: "2026-06-29 13:15", actor: "Unknown", actorInitials: "??", actorRole: "Admin", action: "Failed Login", target: "Session", ipAddress: "41.230.11.5", details: "Invalid password, 3rd attempt" },
  { id: 6, timestamp: "2026-06-29 11:02", actor: "Sonia Gharbi", actorInitials: "SG", actorRole: "Super Admin", action: "Delete", target: "Invoice #INV-1042", ipAddress: "197.14.22.19", details: "Voided duplicate invoice" },
  { id: 7, timestamp: "2026-06-28 17:31", actor: "Sonia Gharbi", actorInitials: "SG", actorRole: "Super Admin", action: "Update", target: "Doctor Account — Yassine Cherif", ipAddress: "197.14.22.19", details: "Deactivated account" },
  { id: 8, timestamp: "2026-06-28 16:05", actor: "Nadia Mejri", actorInitials: "NM", actorRole: "Doctor", action: "Create", target: "Appointment #3391", ipAddress: "197.14.22.52", details: "Booked follow-up appointment" },
  { id: 9, timestamp: "2026-06-27 08:59", actor: "Amel Ben Salah", actorInitials: "AB", actorRole: "Admin", action: "Login", target: "Session", ipAddress: "197.14.22.10", details: "Successful login" },
  { id: 10, timestamp: "2026-06-26 19:22", actor: "System", actorInitials: "SY", actorRole: "System", action: "Export", target: "Patient Records", ipAddress: "—", details: "Nightly backup export completed" },
  { id: 11, timestamp: "2026-06-26 12:40", actor: "Hedi Bouazizi", actorInitials: "HB", actorRole: "Doctor", action: "Update", target: "Patient #198", ipAddress: "197.14.22.33", details: "Updated medical history" },
  { id: 12, timestamp: "2026-06-25 15:18", actor: "Unknown", actorInitials: "??", actorRole: "Admin", action: "Failed Login", target: "Session", ipAddress: "185.23.44.7", details: "Invalid password, 1st attempt" },
]

const ACTION_OPTIONS = ["Create", "Update", "Delete", "Login", "Failed Login", "Export"]
const ROLE_OPTIONS = ["Super Admin", "Admin", "Doctor", "System"]

function getActionColor(action: string) {
  switch (action) {
    case "Create":
      return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
    case "Update":
      return "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20"
    case "Delete":
      return "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20"
    case "Login":
      return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
    case "Failed Login":
      return "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20"
    case "Export":
      return "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20"
    default:
      return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
  }
}

export default function AuditLogsPage() {
  const [sorting, setSorting] = useState<SortingState>([{ id: "timestamp", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const exactFilter = (row: Row<AuditLogEntry>, columnId: string, value: string) => {
    return row.getValue(columnId) === value
  }

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-sm font-mono whitespace-nowrap">
          {row.getValue("timestamp")}
        </span>
      ),
    },
    {
      accessorKey: "actor",
      header: "Actor",
      cell: ({ row }) => {
        const entry = row.original
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">{entry.actorInitials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{entry.actor}</span>
              <span className="text-xs text-muted-foreground">{entry.actorRole}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "actorRole",
      header: "Role",
      cell: () => null,
      filterFn: exactFilter,
      enableHiding: true,
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue("action") as string
        return (
          <Badge variant="secondary" className={getActionColor(action)}>
            {action}
          </Badge>
        )
      },
      filterFn: exactFilter,
    },
    {
      accessorKey: "target",
      header: "Target",
      cell: ({ row }) => <span className="text-sm">{row.getValue("target")}</span>,
    },
    {
      accessorKey: "details",
      header: "Details",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("details")}</span>
      ),
    },
    {
      accessorKey: "ipAddress",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground">
          {row.getValue("ipAddress")}
        </span>
      ),
    },
  ]

  const table = useReactTable({
    data: auditLogData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      columnVisibility: { actorRole: false },
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  const actionFilter = table.getColumn("action")?.getFilterValue() as string
  const roleFilter = table.getColumn("actorRole")?.getFilterValue() as string

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows.map((row) => row.original)
    if (rows.length === 0) {
      toast.info("No audit logs to export")
      return
    }

    downloadCsv({
      filename: `audit-logs-${new Date().toISOString().split("T")[0]}.csv`,
      headers: ["Timestamp", "Actor", "Role", "Action", "Target", "Details", "IP Address"],
      rows: rows.map((entry) => [
        entry.timestamp,
        entry.actor,
        entry.actorRole,
        entry.action,
        entry.target,
        entry.details,
        entry.ipAddress,
      ]),
    })

    toast.success(`Exported ${rows.length} audit log${rows.length > 1 ? "s" : ""}`)
  }

  const failedLogins = auditLogData.filter((e) => e.action === "Failed Login").length

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            A record of account activity across the practice — logins, edits, deletions,
            and exports.
          </p>
        </div>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={handleExport}
        >
          <Download className="mr-2 size-4" />
          Export
        </Button>
      </div>

      {failedLogins > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700 dark:border-orange-800 dark:bg-orange-950/20 dark:text-orange-400">
          <ShieldAlert className="size-4 shrink-0" />
          {failedLogins} failed login attempt{failedLogins > 1 ? "s" : ""} recorded in this log.
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="space-y-1">
            <Label htmlFor="action-filter" className="sr-only">
              Action
            </Label>
            <Select
              value={actionFilter || ""}
              onValueChange={(value) =>
                table.getColumn("action")?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="cursor-pointer w-40" id="action-filter">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {ACTION_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="role-filter" className="sr-only">
              Role
            </Label>
            <Select
              value={roleFilter || ""}
              onValueChange={(value) =>
                table.getColumn("actorRole")?.setFilterValue(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="cursor-pointer w-36" id="role-filter">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} of {auditLogData.length} log entries.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="cursor-pointer"
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="cursor-pointer"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}