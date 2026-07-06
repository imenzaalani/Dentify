"use client"

import { useState } from "react"
import Link from "next/link"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type Row,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowUpDown,
  ChevronDown,
  Eye,
  Pencil,
  Ban,
  Search,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  TreatmentFormSheet,
  type TreatmentFormValues,
} from "./treatment-form-sheet"

export interface TreatmentStep {
  id: string
  label: string
  tooth?: string
  estDuration?: number
  status: "pending" | "completed"
  dependsOnStepId?: string // step must be completed before this one can start
  requiresConsent?: boolean // invasive acts (extraction, surgery, prosthesis...)
  consentSignedAt?: string // ISO date, set once the signed consent doc is archived
}

export interface TreatmentPlan {
  id: number
  patientId: number
  patientName: string
  patientAvatar: string
  title: string
  diagnosis?: string
  startDate: string
  endDate: string | null
  status: "Planned" | "In Progress" | "Completed" | "Abandoned"
  notes?: string
  steps: TreatmentStep[]
  createdAt: string
}

interface DataTableProps {
  plans: TreatmentPlan[]
  onAddPlan: (plan: TreatmentFormValues) => void
  onEditPlan: (id: number, plan: TreatmentFormValues) => void
  onAbandonPlan: (id: number) => void
}

export const statusBadge = (status: TreatmentPlan["status"]) => {
  switch (status) {
    case "Completed":
      return (
        <Badge className="bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
          Completed
        </Badge>
      )
    case "In Progress":
      return (
        <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          In Progress
        </Badge>
      )
    case "Abandoned":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Abandoned
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="text-muted-foreground">
          Planned
        </Badge>
      )
  }
}

export function DataTable({ plans, onAddPlan, onEditPlan, onAbandonPlan }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [editingPlan, setEditingPlan] = useState<TreatmentPlan | null>(null)

  const exactFilter = (
    row: Row<TreatmentPlan>,
    columnId: string,
    value: string
  ) => {
    return row.getValue(columnId) === value
  }

  const columns: ColumnDef<TreatmentPlan>[] = [
    {
      id: "patient",
      accessorFn: (row) => row.patientName,
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="cursor-pointer px-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Patient
          <ArrowUpDown className="ml-2 size-3.5" />
        </Button>
      ),
      cell: ({ row }) => {
        const plan = row.original
        return (
          <Link
            href={`/staff/patients/${plan.patientId}`}
            className="flex items-center gap-3 hover:underline"
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-medium">
                {plan.patientAvatar}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{plan.patientName}</span>
          </Link>
        )
      },
    },
    {
      accessorKey: "title",
      header: "Treatment",
      cell: ({ row }) => {
        const plan = row.original
        return (
          <Link href={`/staff/treatments/${plan.id}`} className="hover:underline">
            <span className="text-sm font-medium">{plan.title}</span>
          </Link>
        )
      },
    },
    {
      id: "startDate",
      accessorFn: (row) => row.startDate,
      header: "Start",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.original.startDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "endDate",
      accessorFn: (row) => row.endDate,
      header: "End",
      cell: ({ row }) => {
        const end = row.original.endDate
        return (
          <span className="text-sm text-muted-foreground">
            {end ? new Date(end).toLocaleDateString() : "—"}
          </span>
        )
      },
    },
    {
      id: "progress",
      header: "Progress",
      cell: ({ row }) => {
        const steps = row.original.steps
        const total = steps.length
        const done = steps.filter((s) => s.status === "completed").length
        const pct = total > 0 ? Math.round((done / total) * 100) : 0
        return (
          <div className="flex flex-col gap-1 min-w-[120px]">
            <span className="text-xs text-muted-foreground">
              {done}/{total} steps
            </span>
            <Progress value={pct} className="h-1.5" />
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      filterFn: exactFilter,
      cell: ({ row }) => statusBadge(row.original.status),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const plan = row.original
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                  asChild
                >
                  <Link href={`/staff/treatments/${plan.id}`}>
                    <Eye className="size-4" />
                    <span className="sr-only">View plan</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View plan</TooltipContent>
            </Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 cursor-pointer"
                >
                  <ChevronDown className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href={`/staff/treatments/${plan.id}`}>
                    <Eye className="mr-2 size-4" />
                    View plan
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => setEditingPlan(plan)}
                >
                  <Pencil className="mr-2 size-4" />
                  Edit plan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive focus:text-destructive"
                  disabled={plan.status === "Abandoned"}
                  onClick={() => onAbandonPlan(plan.id)}
                >
                  <Ban className="mr-2 size-4" />
                  Mark as abandoned
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: plans,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue).toLowerCase()
      const plan = row.original
      return (
        plan.patientName.toLowerCase().includes(search) ||
        plan.title.toLowerCase().includes(search)
      )
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  })

  const statusFilter = table.getColumn("status")?.getFilterValue() as string

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by patient or treatment title..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
            <TreatmentFormSheet mode="create" onSubmit={onAddPlan} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="status-filter" className="text-sm font-medium">
            Status
          </Label>
          <Select
            value={statusFilter || ""}
            onValueChange={(value) =>
              table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="status-filter">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Abandoned">Abandoned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-start-3">
          <Label htmlFor="column-visibility" className="text-sm font-medium">
            Column Visibility
          </Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild id="column-visibility">
              <Button variant="outline" className="cursor-pointer w-full">
                Columns <ChevronDown className="ml-2 size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
                  No treatment plans found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="page-size" className="text-sm font-medium">
            Show
          </Label>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-20 cursor-pointer" id="page-size">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2 hidden sm:block">
            <p className="text-sm font-medium">Page</p>
            <strong className="text-sm">
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            </strong>
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

      {editingPlan && (
        <TreatmentFormSheet
          mode="edit"
          trigger={null}
          initialData={editingPlan}
          open={!!editingPlan}
          onOpenChange={(v) => !v && setEditingPlan(null)}
          onSubmit={(data) => {
            onEditPlan(editingPlan.id, data)
            setEditingPlan(null)
          }}
        />
      )}
    </div>
  )
}