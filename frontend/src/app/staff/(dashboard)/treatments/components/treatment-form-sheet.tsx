"use client"

import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, X, ArrowUp, ArrowDown, GripVertical } from "lucide-react"

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

import type { TreatmentPlan } from "./data-table"

const stepSchema = z.object({
  label: z.string().min(2, { message: "Procedure name is required." }),
  tooth: z.string().optional(),
  estDuration: z
    .number({ error: "Enter a duration in minutes." })
    .min(0)
    .optional(),
})

const treatmentFormSchema = z.object({
  patientId: z.string().min(1, { message: "Please select a patient." }),
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  diagnosis: z.string().optional(),
  startDate: z.date({ error: "Start date is required." }),
  endDate: z.date().optional(),
  notes: z.string().optional(),
  steps: z.array(stepSchema).min(1, { message: "Add at least one step." }),
})

export type TreatmentFormValues = z.infer<typeof treatmentFormSchema>

interface TreatmentFormSheetProps {
  mode?: "create" | "edit"
  initialData?: TreatmentPlan
  patients: { id: string; firstName: string; lastName: string }[]
  /** Pre-selects and locks the patient — used when planning from a patient's own record. */
  defaultPatientId?: string
  /** Pass `null` to render no trigger at all (fully controlled via `open`/`onOpenChange`). */
  trigger?: React.ReactNode | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit: (data: TreatmentFormValues) => void
}

const emptyStep = { label: "", tooth: "", estDuration: undefined }

const emptyDefaults: TreatmentFormValues = {
  patientId: "",
  title: "",
  diagnosis: "",
  notes: "",
  steps: [emptyStep],
} as TreatmentFormValues

function planToFormValues(plan: TreatmentPlan): TreatmentFormValues {
  return {
    patientId: String(plan.patientId),
    title: plan.title,
    diagnosis: plan.diagnosis ?? "",
    startDate: new Date(plan.startDate),
    endDate: plan.endDate ? new Date(plan.endDate) : undefined,
    notes: plan.notes ?? "",
    steps: plan.steps.length
      ? plan.steps.map((s) => ({
          label: s.label,
          tooth: s.tooth ?? "",
          estDuration: s.estDuration,
        }))
      : [emptyStep],
  }
}

export function TreatmentFormSheet({
  mode = "create",
  initialData,
  patients,
  defaultPatientId,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onSubmit: onSubmitPlan,
}: TreatmentFormSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = isControlled ? onOpenChangeProp ?? (() => {}) : setInternalOpen
  const isEdit = mode === "edit"
  const defaults = initialData
    ? planToFormValues(initialData)
    : { ...emptyDefaults, patientId: defaultPatientId ?? "" }

  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentFormSchema),
    defaultValues: defaults,
  })

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "steps",
  })

  // Re-sync form whenever the sheet opens (covers switching which row is being edited)
  useEffect(() => {
    if (open) {
      form.reset(initialData ? planToFormValues(initialData) : { ...emptyDefaults, patientId: defaultPatientId ?? "" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData, defaultPatientId])

  function handleSubmit(data: TreatmentFormValues) {
    onSubmitPlan(data)
    setOpen(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) {
          form.reset(initialData ? planToFormValues(initialData) : { ...emptyDefaults, patientId: defaultPatientId ?? "" })
        }
      }}
    >
      {trigger !== null && (
        <SheetTrigger asChild>
          {trigger ?? (
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              New Treatment Plan
            </Button>
          )}
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Treatment Plan" : "New Treatment Plan"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update the plan's general information and procedure steps."
              : "Define the general information and the procedure steps. Required fields are marked with an asterisk."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-1 min-h-0 flex-col overflow-hidden"
          >
            <ScrollArea className="flex-1 min-h-0 px-6">
              <div className="flex flex-col gap-6 p-1 pb-6">
                {/* General information */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    General Information
                  </h3>
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!isEdit && !!defaultPatientId}
                        >
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
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Treatment title *</FormLabel>
                        <FormControl>
                          <Input placeholder="Orthodontic Treatment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="diagnosis"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diagnosis</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Clinical diagnosis"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start date *</FormLabel>
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
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Estimated end date</FormLabel>
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
                                  {field.value ? format(field.value, "PPP") : <span>Optional</span>}
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

                {/* Step builder */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground">
                      Procedure Steps
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => append({ ...emptyStep })}
                    >
                      <Plus className="mr-1 size-3.5" />
                      Add step
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex flex-col gap-2 rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <GripVertical className="size-3.5" />
                            Step {index + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 cursor-pointer"
                              disabled={index === 0}
                              onClick={() => move(index, index - 1)}
                            >
                              <ArrowUp className="size-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 cursor-pointer"
                              disabled={index === fields.length - 1}
                              onClick={() => move(index, index + 1)}
                            >
                              <ArrowDown className="size-3.5" />
                            </Button>
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
                        </div>
                        <FormField
                          control={form.control}
                          name={`steps.${index}.label`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Procedure *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g. Composite filling" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name={`steps.${index}.tooth`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Tooth concerned</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g. 36" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`steps.${index}.estDuration`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Est. duration (min)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={0}
                                    placeholder="30"
                                    name={field.name}
                                    ref={field.ref}
                                    onBlur={field.onBlur}
                                    value={field.value ?? ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value === "" ? undefined : Number(e.target.value)
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional notes about this plan"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>
            <SheetFooter className="border-t">
              <Button type="submit" className="cursor-pointer">
                {isEdit ? "Save Changes" : "Save Treatment Plan"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}