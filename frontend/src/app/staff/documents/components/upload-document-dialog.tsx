"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Upload, Plus, FileUp } from "lucide-react"

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

import patientsData from "../../patients/data.json"

const uploadFormSchema = z.object({
  patientId: z.string().min(1, { message: "Please select a patient." }),
  category: z.string().min(1, { message: "Please select a category." }),
  notes: z.string().optional(),
})

type UploadFormSchema = z.infer<typeof uploadFormSchema>

export interface UploadDocumentValues extends UploadFormSchema {
  fileName: string
  fileSizeKb: number
  fileType: "pdf" | "jpg" | "png" | "dicom"
  fileUrl: string
}

interface UploadDocumentDialogProps {
  onUploadDocument: (doc: UploadDocumentValues) => void
}

const patients = patientsData as { id: number; firstName: string; lastName: string }[]

const inferFileType = (fileName: string): UploadDocumentValues["fileType"] => {
  const ext = fileName.split(".").pop()?.toLowerCase()
  if (ext === "jpg" || ext === "jpeg") return "jpg"
  if (ext === "png") return "png"
  if (ext === "dicom" || ext === "dcm") return "dicom"
  return "pdf"
}

export function UploadDocumentDialog({
  onUploadDocument,
}: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState("")

  const form = useForm<UploadFormSchema>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      patientId: "",
      category: "",
      notes: "",
    },
  })

  const resetAll = () => {
    form.reset({ patientId: "", category: "", notes: "" })
    setFile(null)
    setFileError("")
  }

  function onSubmit(data: UploadFormSchema) {
    if (!file) {
      setFileError("Please select a file to upload.")
      return
    }

    onUploadDocument({
      ...data,
      fileName: file.name,
      fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
      fileType: inferFileType(file.name),
      fileUrl: URL.createObjectURL(file),
    })
    resetAll()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) resetAll()
      }}
    >
      <DialogTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.firstName} {p.lastName}
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
                      <SelectItem value="Imaging">Imaging</SelectItem>
                      <SelectItem value="Consent Form">Consent Form</SelectItem>
                      <SelectItem value="Invoice">Invoice</SelectItem>
                      <SelectItem value="Lab Report">Lab Report</SelectItem>
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
                <span className="text-sm text-muted-foreground">
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
              <Button type="submit" className="cursor-pointer">
                <Upload className="mr-2 size-4" />
                Upload
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}