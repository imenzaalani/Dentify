"use client"

import { useState } from "react"
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
  ChevronDown,
  EllipsisVertical,
  Pencil,
  Trash2,
  Download,
  Search,
  KeyRound,
  Ban,
  CircleCheck,
  MailPlus,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"

import { ReceptionistFormSheet, type ReceptionistFormValues } from "./receptionist-form-sheet"

export interface Receptionist {
  id: string
  firstName: string
  lastName: string
  avatar: string
  avatarUrl?: string
  email: string
  phone?: string
  notes?: string
  status: "Active" | "Inactive"
  createdAt: string
  lastLogin?: string
  isVerified: boolean
}

interface DataTableProps {
  receptionists: Receptionist[]
  isLoading?: boolean
  onAddReceptionist: (values: ReceptionistFormValues) => void
  onEditReceptionist: (id: string, values: ReceptionistFormValues) => void
  onDeleteReceptionist: (id: string) => void
  onToggleStatus: (id: string) => void
}

export function DataTable({
  receptionists,
  isLoading = false,
  onAddReceptionist,
  onEditReceptionist,
  onDeleteReceptionist,
  onToggleStatus,
}: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  const [editingReceptionist, setEditingReceptionist] = useState<Receptionist | null>(null)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [deletingReceptionist, setDeletingReceptionist] = useState<Receptionist | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
      default:
        return "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-900/20"
    }
  }

  const exactFilter = (row: Row<Receptionist>, columnId: string, value: string) =>
    row.getValue(columnId) === value

  const openEdit = (r: Receptionist) => {
    setEditingReceptionist(r)
    setEditSheetOpen(true)
  }

  const handleEditSubmit = (values: ReceptionistFormValues) => {
    if (editingReceptionist) {
      onEditReceptionist(editingReceptionist.id, values)
    }
  }

  const columns: ColumnDef<Receptionist>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center px-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 50,
    },
    {
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: "name",
      header: "Receptionist",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt={`${r.firstName} ${r.lastName}`} /> : null}
              <AvatarFallback className="text-xs font-medium text-white bg-slate-500">
                {r.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{r.firstName} {r.lastName}</span>
              <span className="text-sm text-muted-foreground">{r.email}</span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm">{(row.getValue("phone") as string) || "—"}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("createdAt")}</span>
      ),
    },
    {
      accessorKey: "lastLogin",
      header: "Last login",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {(row.getValue("lastLogin") as string) || "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant="secondary" className={getStatusColor(status)}>
            {status}
          </Badge>
        )
      },
      filterFn: exactFilter,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => openEdit(r)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit receptionist</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer">
                  <EllipsisVertical className="size-4" />
                  <span className="sr-only">More actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!r.isVerified && (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={async () => {
                      try {
                        await authApi.staff.resendInvite(r.id)
                        toast.success(`Invite resent to ${r.email}`)
                      } catch (err) {
                        toast.error(err instanceof ApiError ? err.message : "Couldn't resend the invite")
                      }
                    }}
                  >
                    <MailPlus className="mr-2 size-4" />
                    Resend Invite
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => toast.success(`Password reset email sent to ${r.email}`)}
                >
                  <KeyRound className="mr-2 size-4" />
                  Reset Password
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    onToggleStatus(r.id)
                    toast.success(
                      r.status === "Active" ? `${r.lastName} deactivated` : `${r.lastName} activated`
                    )
                  }}
                >
                  {r.status === "Active" ? (
                    <>
                      <Ban className="mr-2 size-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CircleCheck className="mr-2 size-4" />
                      Activate
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => setDeletingReceptionist(r)}
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete Account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data: receptionists,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
  })

  const statusFilter = table.getColumn("status")?.getFilterValue() as string

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original)
    if (rows.length === 0) {
      toast.info("No receptionists to export")
      return
    }

    const headers = ["First Name", "Last Name", "Email", "Phone", "Status", "Joined", "Last Login"]
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [r.firstName, r.lastName, r.email, r.phone ?? "", r.status, r.createdAt, r.lastLogin ?? ""]
          .map((value) => escape(String(value)))
          .join(",")
      ),
    ]

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `receptionists-export-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast.success(`Exported ${rows.length} receptionist${rows.length > 1 ? "s" : ""}`)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search receptionists..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="cursor-pointer" onClick={handleExport}>
            <Download className="mr-2 size-4" />
            Export
          </Button>
          <ReceptionistFormSheet mode="create" onSubmitReceptionist={onAddReceptionist} />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
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
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Loading receptionists...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 text-sm text-muted-foreground hidden sm:block">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2 hidden sm:block">
            <p className="text-sm font-medium">Page</p>
            <strong className="text-sm">
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
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

      <ReceptionistFormSheet
        mode="edit"
        receptionist={editingReceptionist ?? undefined}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        onSubmitReceptionist={handleEditSubmit}
      />

      <Dialog
        open={deletingReceptionist !== null}
        onOpenChange={(open) => !open && setDeletingReceptionist(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete receptionist account?</DialogTitle>
            <DialogDescription>
              {deletingReceptionist && (
                <>
                  This will permanently remove {deletingReceptionist.firstName}{" "}
                  {deletingReceptionist.lastName}&apos;s account and login access.
                  This action cannot be undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setDeletingReceptionist(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer border border-red-600 bg-red-600 text-white shadow-sm hover:border-red-700 hover:bg-red-700 dark:border-red-500 dark:bg-red-500 dark:hover:border-red-400 dark:hover:bg-red-400"
              onClick={() => {
                if (deletingReceptionist) {
                  onDeleteReceptionist(deletingReceptionist.id)
                  toast.success(`${deletingReceptionist.firstName} ${deletingReceptionist.lastName} was removed`)
                  setDeletingReceptionist(null)
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}