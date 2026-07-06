"use client"

import {
  FileText,
  Receipt,
  ScanLine,
  ClipboardList,
  Pill,
  File,
  FileSignature,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export type DocumentCategory =
  | "prescription"
  | "quote"
  | "invoice"
  | "xray"
  | "report"
  | "consent"
  | "other"

export interface PatientDocument {
  id: string
  title: string
  category: DocumentCategory
  date: string // ISO date
  isNew: boolean
}

export const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  prescription: "Prescription",
  quote: "Quote",
  invoice: "Invoice",
  xray: "X-ray",
  report: "Report",
  consent: "Consent Form",
  other: "Other",
}

const CATEGORY_ICON: Record<DocumentCategory, typeof FileText> = {
  prescription: Pill,
  quote: ClipboardList,
  invoice: Receipt,
  xray: ScanLine,
  report: FileText,
  consent: FileSignature,
  other: File,
}

export function DocumentCard({
  document,
  onOpen,
}: {
  document: PatientDocument
  onOpen: (document: PatientDocument) => void
}) {
  const Icon = CATEGORY_ICON[document.category]
  const formattedDate = new Date(document.date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen(document)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(document)}
      className="cursor-pointer transition-colors hover:bg-muted/50"
    >
      <CardContent className="flex items-center gap-3 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium">{document.title}</span>
            {document.isNew && <Badge className="shrink-0">New</Badge>}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="text-xs">
              {CATEGORY_LABEL[document.category]}
            </Badge>
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}