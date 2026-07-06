"use client"

import * as React from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DocumentCard,
  CATEGORY_LABEL,
  type PatientDocument,
  type DocumentCategory,
} from "./components/document-card"
import { DocumentPreviewDialog } from "./components/document-preview-dialog"

import documentsData from "./data.json"

const CATEGORIES: (DocumentCategory | "all")[] = [
  "all",
  "prescription",
  "quote",
  "invoice",
  "xray",
  "report",
  "consent",
  "other",
]

export default function PatientDocumentsPage() {
  const { documents } = documentsData as { documents: PatientDocument[] }

  const [category, setCategory] = React.useState<DocumentCategory | "all">("all")
  const [selected, setSelected] = React.useState<PatientDocument | null>(null)
  const [previewOpen, setPreviewOpen] = React.useState(false)

  const filtered = documents
    .filter((d) => category === "all" || d.category === category)
    .sort((a, b) => b.date.localeCompare(a.date))

  const handleOpen = (document: PatientDocument) => {
    setSelected(document)
    setPreviewOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6">
        <h1 className="text-2xl font-semibold">My Documents</h1>
        <p className="text-sm text-muted-foreground">
          Prescriptions, quotes, invoices, x-rays and reports from your visits.
        </p>
      </div>

      <div className="@container/main px-4 lg:px-6">
        <Tabs value={category} onValueChange={(v) => setCategory(v as DocumentCategory | "all")}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {CATEGORIES.filter((c) => c !== "all").map((c) => (
              <TabsTrigger key={c} value={c}>
                {CATEGORY_LABEL[c as DocumentCategory]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.length === 0 ? (
            <div className="col-span-full flex min-h-[150px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              No documents in this category yet.
            </div>
          ) : (
            filtered.map((doc) => (
              <DocumentCard key={doc.id} document={doc} onOpen={handleOpen} />
            ))
          )}
        </div>
      </div>

      <DocumentPreviewDialog
        document={selected}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  )
}