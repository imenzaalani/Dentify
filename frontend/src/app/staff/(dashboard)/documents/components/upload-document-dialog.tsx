"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, Plus, FileUp } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { patientApi } from "@/lib/api/patients"
import { ApiError } from "@/lib/api/client"
import { documentCategoryLabels, documentCategoryOptions } from "@/types/document"
import type { Patient } from "@/types/patient"

const uploadFormSchema = z.object({
  patientId: z.string().min(1, { message: "Please select a patient." }),
  category: z.string().min(1, { message: "Please select a category." }),
  notes: z.string().optional(),
})

type UploadFormSchema = z.infer<typeof uploadFormSchema>

export interface UploadDocumentValues extends UploadFormSchema {
  file: File
}

interface UploadDocumentDialogProps {
  onUploadDocument: (doc: UploadDocumentValues) => void | Promise<void>
  /** Pre-selects and locks the patient — used when uploading from a patient's own record. */
  defaultPatientId?: string
  /** Pass `null` to render no trigger at all (fully controlled via `open`/`onOpenChange`). */
  trigger?: React.ReactNode | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function UploadDocumentDialog({
  onUploadDocument,
  defaultPatientId,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: UploadDocumentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = isControlled ? onOpenChangeProp ?? (() => {}) : setInternalOpen
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    patientApi
      .listPatients()
      .then(setPatients)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load patients")
      })
  }, [open])

  useEffect(() => {
    if (open) {
      form.reset({ patientId: defaultPatientId ?? "", category: "", notes: "" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultPatientId])

  const form = useForm<UploadFormSchema>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      patientId: defaultPatientId ?? "",
      category: "",
      notes: "",
    },
  })

  const resetAll = () => {
    form.reset({ patientId: defaultPatientId ?? "", category: "", notes: "" })
    setFile(null)
    setFileError("")
  }

  async function onSubmit(data: UploadFormSchema) {
    if (!file) {
      setFileError("Please select a file to upload.")
      return
    }

    setIsSubmitting(true)
    try {
      await onUploadDocument({ ...data, file })
      resetAll()
      setOpen(false)
    } catch {
      // onUploadDocument already surfaces its own error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) resetAll()
      }}
    >
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Attach a file to a patient&apos;s record. Required fields are
            marked with an asterisk.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!!defaultPatientId}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.first_name} {p.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {documentCategoryOptions.map((value) => (
                        <SelectItem key={value} value={value}>
                          {documentCategoryLabels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">File *</label>
              <label
                htmlFor="document-file-input"
                className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center hover:bg-muted/50"
              >
                <FileUp className="size-6 text-muted-foreground" />
                <span className="block max-w-full break-words text-sm text-muted-foreground">
                  {file ? file.name : "Click to choose a file"}
                </span>
                {file && (
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                )}
              </label>
              <input
                id="document-file-input"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.dicom,.dcm"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null
                  setFile(selected)
                  if (selected) setFileError("")
                }}
              />
              {fileError && (
                <p className="text-sm text-destructive">{fileError}</p>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes about this document"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                <Upload className="mr-2 size-4" />
                {isSubmitting ? "Uploading..." : "Upload"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
