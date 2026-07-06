"use client"

import { useState } from "react"
import { toast } from "sonner"

import { DocumentGrid, type ClinicDocument } from "./components/document-grid"
import { DocumentStatCards } from "./components/document-stat-cards"
import type { UploadDocumentValues } from "./components/upload-document-dialog"

import initialDocumentsData from "./data.json"
import patientsData from "../patients/data.json"

const patients = patientsData as {
  id: number
  firstName: string
  lastName: string
  avatar: string
}[]

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ClinicDocument[]>(
    initialDocumentsData as ClinicDocument[]
  )

  const handleUploadDocument = (data: UploadDocumentValues) => {
    const patient = patients.find((p) => p.id === Number(data.patientId))

    const newDoc: ClinicDocument = {
      id: Math.max(0, ...documents.map((d) => d.id)) + 1,
      patientId: Number(data.patientId),
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : "",
      patientAvatar: patient?.avatar ?? "",
      fileName: data.fileName,
      category: data.category as ClinicDocument["category"],
      fileType: data.fileType,
      fileSizeKb: data.fileSizeKb,
      fileUrl: data.fileUrl,
      uploadedAt: new Date().toISOString().split("T")[0],
      uploadedBy: "You",
      notes: data.notes,
    }

    setDocuments((prev) => [newDoc, ...prev])
    toast.success(`"${data.fileName}" uploaded`, {
      description: `Attached to ${newDoc.patientName}.`,
    })
  }

  const handleDeleteDocument = (id: number) => {
    const doc = documents.find((d) => d.id === id)
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    if (doc) {
      toast.success(`"${doc.fileName}" deleted`)
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
          onUploadDocument={handleUploadDocument}
          onDeleteDocument={handleDeleteDocument}
        />
      </div>
    </div>
  )
}