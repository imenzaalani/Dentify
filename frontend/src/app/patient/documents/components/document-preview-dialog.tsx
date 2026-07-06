"use client"

import { FileText, Download } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { PatientDocument } from "./document-card"

export function DocumentPreviewDialog({
  document,
  open,
  onOpenChange,
}: {
  document: PatientDocument | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!document) return null

  const handleDownload = () => {
    // TODO: request a signed S3 URL from GET /documents/{id}/download and
    // redirect to it instead of this mock toast.
    toast("Preparing download", {
      description: "A secure, time-limited download link will open shortly.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{document.title}</DialogTitle>
          <DialogDescription>
            {new Date(document.date).toLocaleDateString("en-US", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/30 text-muted-foreground">
          <FileText className="size-10" />
          <p className="text-sm">PDF preview will render here once files are wired up</p>
        </div>

        <DialogFooter>
          <Button onClick={handleDownload}>
            <Download />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}