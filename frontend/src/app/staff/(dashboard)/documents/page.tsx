"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"

import { DocumentGrid } from "./components/document-grid"
import { DocumentStatCards } from "./components/document-stat-cards"
import type { UploadDocumentValues } from "./components/upload-document-dialog"

import { documentApi } from "@/lib/api/documents"
import { ApiError } from "@/lib/api/client"
import type { ClinicDocument } from "@/types/document"

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ClinicDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    documentApi
      .listDocuments()
      .then((data) => {
        if (!cancelled) setDocuments(data)
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load documents")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleUploadDocument = async (data: UploadDocumentValues) => {
    try {
      const newDoc = await documentApi.uploadDocument({
        patientId: data.patientId,
        category: data.category,
        notes: data.notes,
        file: data.file,
      })
      setDocuments((prev) => [newDoc, ...prev])
      toast.success(`"${newDoc.file_name}" uploaded`, {
        description: `Attached to ${newDoc.patient_name}.`,
      })
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to upload document")
      throw err
    }
  }

  const handleDeleteDocument = async (id: string) => {
    const doc = documents.find((d) => d.id === id)
    try {
      await documentApi.deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      if (doc) toast.success(`"${doc.file_name}" deleted`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete document")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="@container/main px-4 lg:px-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Documents{" "}
            <span className="text-muted-foreground font-normal">
              ({documents.length})
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            All files attached to your patients' records.
          </p>
        </div>
      </div>

      <div className="@container/main px-4 lg:px-6">
        <DocumentStatCards documents={documents} />
      </div>

      <div className="@container/main px-4 lg:px-6 mt-4 lg:mt-6">
        <DocumentGrid
          documents={documents}
          isLoading={isLoading}
          onUploadDocument={handleUploadDocument}
          onDeleteDocument={handleDeleteDocument}
        />
      </div>
    </div>
  )
}
