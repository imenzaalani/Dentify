"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

import { patientApi } from "@/lib/api/patients"
import { treatmentApi } from "@/lib/api/treatments"
import { ApiError } from "@/lib/api/client"
import type { Patient } from "@/types/patient"
import type { TreatmentPlan } from "@/types/treatment"

const lineItemSchema = z.object({
  description: z.string().min(2, { message: "Description is required." }),
  tooth: z.string().optional(),
  quantity: z.number({ error: "Required." }).min(1),
  unitPrice: z.number({ error: "Required." }).min(0),
  discountPct: z.number().min(0).max(100).optional(),
})

const invoiceFormSchema = z.object({
  type: z.enum(["Quote", "Invoice"]),
  patientId: z.string().min(1, { message: "Please select a patient." }),
  treatmentPlanId: z.string().optional(),
  issueDate: z.date({ error: "Issue date is required." }),
  dueDate: z.date().optional(),
  globalDiscountPct: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, { message: "Add at least one line." }),
})

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>

interface InvoiceFormSheetProps {
  onAddInvoice: (invoice: InvoiceFormValues) => void | Promise<void>
  /** Pre-selects and locks the patient — used when billing from a patient's own record. */
  defaultPatientId?: string
  /** Pass `null` to render no trigger at all (fully controlled via `open`/`onOpenChange`). */
  trigger?: React.ReactNode | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const emptyLine = { description: "", tooth: "", quantity: 1, unitPrice: 0, discountPct: 0 }

function buildDefaultValues(defaultPatientId?: string): InvoiceFormValues {
  return {
    type: "Quote",
    patientId: defaultPatientId ?? "",
    treatmentPlanId: "",
    globalDiscountPct: 0,
    notes: "",
    paymentTerms: "Paiement à réception de la facture.",
    lineItems: [emptyLine],
  } as InvoiceFormValues
}

export function InvoiceFormSheet({
  onAddInvoice,
  defaultPatientId,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: InvoiceFormSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = isControlled ? onOpenChangeProp ?? (() => {}) : setInternalOpen
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([])
  const defaultValues = buildDefaultValues(defaultPatientId)

  useEffect(() => {
    if (!open) return
    Promise.all([patientApi.listPatients(), treatmentApi.listTreatmentPlans()])
      .then(([patientsData, plansData]) => {
        setPatients(patientsData)
        setTreatmentPlans(plansData)
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load patients")
      })
  }, [open])

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(defaultPatientId))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultPatientId])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  })

  const type = form.watch("type")
  const selectedPatientId = form.watch("patientId")
  const lineItems = form.watch("lineItems")
  const globalDiscountPct = form.watch("globalDiscountPct") ?? 0

  const availablePlans = treatmentPlans.filter(
    (p) => p.patient_id === selectedPatientId
  )

  const subtotal = lineItems.reduce((sum, line) => {
    const qty = line.quantity || 0
    const price = line.unitPrice || 0
    const discount = line.discountPct || 0
    return sum + qty * price * (1 - discount / 100)
  }, 0)
  const total = subtotal * (1 - globalDiscountPct / 100)

  async function onSubmit(data: InvoiceFormValues) {
    setIsSubmitting(true)
    try {
      await onAddInvoice(data)
      form.reset(defaultValues)
      setOpen(false)
    } catch {
      // onAddInvoice already surfaces its own error toast
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) form.reset(defaultValues)
      }}
    >
      {trigger !== null && (
        <SheetTrigger asChild>
          {trigger ?? (
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              New Document
            </Button>
          )}
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col">
        <SheetHeader>
          <SheetTitle>New Quote / Invoice</SheetTitle>
          <SheetDescription>
            Build the document header and line items. The document number is
            assigned automatically. Required fields are marked with an
            asterisk.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 min-h-0 flex-col overflow-hidden"
          >
            <ScrollArea className="flex-1 min-h-0 px-6">
              <div className="flex flex-col gap-6 p-1 pb-6">
                {/* Header */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Document Header
                  </h3>

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type *</FormLabel>
                        <FormControl>
                          <ToggleGroup
                            type="single"
                            variant="outline"
                            value={field.value}
                            onValueChange={(value) => {
                              if (value) field.onChange(value)
                            }}
                            className="w-full"
                          >
                            <ToggleGroupItem value="Quote" className="flex-1 cursor-pointer">
                              Quote
                            </ToggleGroupItem>
                            <ToggleGroupItem value="Invoice" className="flex-1 cursor-pointer">
                              Invoice
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            form.setValue("treatmentPlanId", "")
                          }}
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
                    name="treatmentPlanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Associated treatment plan</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!selectedPatientId}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availablePlans.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="issueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Issue date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal cursor-pointer",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                captionLayout="dropdown"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  disabled={type === "Quote"}
                                  className={cn(
                                    "w-full justify-start text-left font-normal cursor-pointer",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>{type === "Quote" ? "N/A for quotes" : "Pick a date"}</span>
                                  )}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                captionLayout="dropdown"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Line items */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Line Items
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => append({ ...emptyLine })}
                    >
                      <Plus className="mr-1 size-3.5" />
                      Add line
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {fields.map((field, index) => {
                      const line = lineItems[index]
                      const lineTotal =
                        line
                          ? (line.quantity || 0) *
                            (line.unitPrice || 0) *
                            (1 - (line.discountPct || 0) / 100)
                          : 0
                      return (
                        <div
                          key={field.id}
                          className="flex flex-col gap-2 rounded-lg border p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              Line {index + 1}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 cursor-pointer text-destructive"
                              disabled={fields.length === 1}
                              onClick={() => remove(index)}
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                          <FormField
                            control={form.control}
                            name={`lineItems.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">
                                  Description *
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. Composite filling" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-4 gap-2">
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.tooth`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Tooth</FormLabel>
                                  <FormControl>
                                    <Input placeholder="36" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Qty *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={1}
                                      value={field.value ?? ""}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value === "" ? 0 : Number(e.target.value)
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    Unit price *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.01"
                                      value={field.value ?? ""}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value === "" ? 0 : Number(e.target.value)
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.discountPct`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">
                                    Discount %
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={field.value ?? ""}
                                      onChange={(e) =>
                                        field.onChange(
                                          e.target.value === "" ? 0 : Number(e.target.value)
                                        )
                                      }
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <p className="text-right text-xs text-muted-foreground">
                            Line total:{" "}
                            <span className="font-medium text-foreground">
                              {lineTotal.toLocaleString("fr-TN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{" "}
                              TND
                            </span>
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <Separator />

                {/* Totals */}
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {subtotal.toLocaleString("fr-TN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TND
                    </span>
                  </div>
                  <FormField
                    control={form.control}
                    name="globalDiscountPct"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between gap-4 space-y-0">
                        <FormLabel className="text-sm text-muted-foreground">
                          Global discount (%)
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="w-24 text-right"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? 0 : Number(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-bold">
                      {total.toLocaleString("fr-TN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TND
                    </span>
                  </div>
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes for the patient</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment terms</FormLabel>
                      <FormControl>
                        <Textarea className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <SheetFooter className="border-t flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer flex-1"
                onClick={() =>
                  // TODO: PDF preview requires backend rendering — spec §7.5
                  undefined
                }
                disabled
              >
                Preview PDF
              </Button>
              <Button type="submit" className="cursor-pointer flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save as Draft"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
