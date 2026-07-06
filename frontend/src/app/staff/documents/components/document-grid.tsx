"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  FileText,
  FileSignature,
  Receipt,
  FlaskConical,
  Image as ImageIcon,
  Download,
  Eye,
  Trash2,
  ChevronDown,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
  UploadDocumentDialog,
  type UploadDocumentValues,
} from "./upload-document-dialog"

export interface ClinicDocument {
  id: number
  patientId: number
  patientName: string
  patientAvatar: string
  fileName: string
  category: "Imaging" | "Consent Form" | "Invoice" | "Lab Report"
  fileType: "pdf" | "jpg" | "png" | "dicom"
  fileSizeKb: number
  uploadedAt: string
  uploadedBy: string
  notes?: string
  fileUrl?: string
}

interface DocumentGridProps {
  documents: ClinicDocument[]
  onUploadDocument: (doc: UploadDocumentValues) => void
  onDeleteDocument: (id: number) => void
}

const categoryMeta: Record<ClinicDocument["category"], { icon: typeof FileText; className: string }> = {
  Imaging: {
    icon: ImageIcon,
    className: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  },
  "Consent Form": {
    icon: FileSignature,
    className:
      "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  },
  Invoice: {
    icon: Receipt,
    className:
      "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
  },
  "Lab Report": {
    icon: FlaskConical,
    className:
      "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
  },
}

const formatSize = (kb: number) => {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

export function DocumentGrid({
  documents,
  onUploadDocument,
  onDeleteDocument,
}: DocumentGridProps) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [previewDoc, setPreviewDoc] = useState<ClinicDocument | null>(null)

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch =
        search.trim() === "" ||
        doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
        doc.patientName.toLowerCase().includes(search.toLowerCase())
      const matchesCategory =
        categoryFilter === "" || doc.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [documents, search, categoryFilter])

  const handleDownload = (doc: ClinicDocument) => {
    const link = document.createElement("a")
    let tempUrl: string | null = null

    if (doc.fileUrl) {
      link.href = doc.fileUrl
    } else {
      const placeholder = new Blob(
        [
          `Document preview/download placeholder.\n\nFile: ${doc.fileName}\nPatient: ${doc.patientName}\nCategory: ${doc.category}\nUploaded: ${doc.uploadedAt} by ${doc.uploadedBy}${
            doc.notes ? `\nNotes: ${doc.notes}` : ""
          }\n`,
        ],
        { type: "text/plain" }
      )
      tempUrl = URL.createObjectURL(placeholder)
      link.href = tempUrl
    }

    link.download = doc.fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    if (tempUrl) {
      window.setTimeout(() => URL.revokeObjectURL(tempUrl as string), 1000)
    }

    toast.success(`Downloading "${doc.fileName}"`)
  }

  const handleDelete = (doc: ClinicDocument) => {
    if (doc.fileUrl) {
      URL.revokeObjectURL(doc.fileUrl)
    }
    onDeleteDocument(doc.id)
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by file name or patient..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <UploadDocumentDialog onUploadDocument={onUploadDocument} />
      </div>

      <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
        <div className="space-y-2">
          <Label htmlFor="category-filter" className="text-sm font-medium">
            Category
          </Label>
          <Select
            value={categoryFilter || ""}
            onValueChange={(value) =>
              setCategoryFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="cursor-pointer w-full" id="category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Imaging">Imaging</SelectItem>
              <SelectItem value="Consent Form">Consent Form</SelectItem>
              <SelectItem value="Invoice">Invoice</SelectItem>
              <SelectItem value="Lab Report">Lab Report</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-32 items-center justify-center rounded-md border text-sm text-muted-foreground">
          No documents found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((doc) => {
            const meta = categoryMeta[doc.category]
            const Icon = meta.icon
            return (
              <Card key={doc.id} className="border">
                <CardContent className="flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg cursor-pointer ${meta.className}`}
                    >
                      <Icon className="size-5" />
                    </button>
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
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye className="mr-2 size-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="mr-2 size-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer text-destructive focus:text-destructive"
                          onClick={() => handleDelete(doc)}
                        >
                          <Trash2 className="mr-2 size-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(doc)}
                      className="truncate text-left text-sm font-medium hover:underline cursor-pointer"
                      title={doc.fileName}
                    >
                      {doc.fileName}
                    </button>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={meta.className}>
                        {doc.category}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatSize(doc.fileSizeKb)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] font-medium">
                          {doc.patientAvatar}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">
                        {doc.patientName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={!!previewDoc} onOpenChange={(value) => !value && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-lg">
          {previewDoc && (
            <>
              <DialogHeader>
                <DialogTitle className="truncate" title={previewDoc.fileName}>
                  {previewDoc.fileName}
                </DialogTitle>
                <DialogDescription>
                  {previewDoc.category} · {formatSize(previewDoc.fileSizeKb)}
                </DialogDescription>
              </DialogHeader>

              <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
                {previewDoc.fileUrl &&
                (previewDoc.fileType === "jpg" || previewDoc.fileType === "png") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.fileName}
                    className="max-h-[320px] w-full object-contain"
                  />
                ) : previewDoc.fileUrl && previewDoc.fileType === "pdf" ? (
                  <iframe
                    src={previewDoc.fileUrl}
                    className="h-[320px] w-full"
                    title={previewDoc.fileName}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                    {(() => {
                      const PreviewIcon = categoryMeta[previewDoc.category].icon
                      return <PreviewIcon className="size-10" />
                    })()}
                    <span className="text-xs">
                      No inline preview available for this file
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Patient</p>
                  <Link
                    href={`/staff/patients/${previewDoc.patientId}`}
                    className="font-medium hover:underline"
                  >
                    {previewDoc.patientName}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                  <p className="font-medium">
                    {new Date(previewDoc.uploadedAt).toLocaleDateString()} ·{" "}
                    {previewDoc.uploadedBy}
                  </p>
                </div>
                {previewDoc.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p>{previewDoc.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => handleDownload(previewDoc)}
                >
                  <Download className="mr-2 size-4" />
                  Download
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}