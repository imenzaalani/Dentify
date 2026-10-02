"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus } from "lucide-react"

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

import type { Referral } from "./data-table"

const SPECIALTIES = [
  "Orthodontics",
  "Endodontics",
  "Periodontics",
  "Oral Surgery",
  "Prosthodontics",
  "Pediatric Dentistry",
  "Radiology",
  "Implantology",
] as const

const referralFormSchema = z.object({
  patientId: z.string().min(1, { message: "Please select a patient." }),
  specialistName: z
    .string()
    .min(2, { message: "Specialist name is required." }),
  specialty: z.string().min(1, { message: "Please select a specialty." }),
  reason: z.string().min(3, { message: "Reason must be at least 3 characters." }),
  date: z.date({ error: "Referral date is required." }),
  notes: z.string().optional(),
})

export type ReferralFormValues = z.infer<typeof referralFormSchema>

interface ReferralFormSheetProps {
  mode?: "create" | "edit"
  initialData?: Referral
  patients: { id: string; firstName: string; lastName: string }[]
  /** Pre-selects and locks the patient — used when referring from a patient's own record. */
  defaultPatientId?: string
  /** Pass `null` to render no trigger at all (fully controlled via `open`/`onOpenChange`). */
  trigger?: React.ReactNode | null
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmit: (data: ReferralFormValues) => void
}

const emptyDefaults: ReferralFormValues = {
  patientId: "",
  specialistName: "",
  specialty: "",
  reason: "",
  notes: "",
} as ReferralFormValues

function referralToFormValues(referral: Referral): ReferralFormValues {
  return {
    patientId: String(referral.patientId),
    specialistName: referral.specialistName,
    specialty: referral.specialty,
    reason: referral.reason,
    date: new Date(referral.date),
    notes: referral.notes ?? "",
  }
}

export function ReferralFormSheet({
  mode = "create",
  initialData,
  patients,
  defaultPatientId,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onSubmit: onSubmitReferral,
}: ReferralFormSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : internalOpen
  const setOpen = isControlled ? onOpenChangeProp ?? (() => {}) : setInternalOpen
  const isEdit = mode === "edit"
  const defaults = initialData
    ? referralToFormValues(initialData)
    : { ...emptyDefaults, patientId: defaultPatientId ?? "" }

  const form = useForm<ReferralFormValues>({
    resolver: zodResolver(referralFormSchema),
    defaultValues: defaults,
  })

  // Re-sync form whenever the sheet opens (covers switching which row is being edited)
  useEffect(() => {
    if (open) {
      form.reset(initialData ? referralToFormValues(initialData) : { ...emptyDefaults, patientId: defaultPatientId ?? "" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData, defaultPatientId])

  function handleSubmit(data: ReferralFormValues) {
    onSubmitReferral(data)
    setOpen(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) {
          form.reset(initialData ? referralToFormValues(initialData) : { ...emptyDefaults, patientId: defaultPatientId ?? "" })
        }
      }}
    >
      {trigger !== null && (
        <SheetTrigger asChild>
          {trigger ?? (
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              New Referral
            </Button>
          )}
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Referral" : "New Referral"}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? "Update the referral's details."
              : "Refer a patient to an external specialist. Required fields are marked with an asterisk."}
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex flex-1 min-h-0 flex-col overflow-hidden"
          >
            <ScrollArea className="flex-1 min-h-0 px-6">
              <div className="flex flex-col gap-4 p-1 pb-6">
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
                  name="specialistName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialist name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Fares Ayadi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue placeholder="Select a specialty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPECIALTIES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
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
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for referral *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Clinical justification for the referral"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Referral date *</FormLabel>
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Optional notes about this referral"
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
                {isEdit ? "Save Changes" : "Save Referral"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}