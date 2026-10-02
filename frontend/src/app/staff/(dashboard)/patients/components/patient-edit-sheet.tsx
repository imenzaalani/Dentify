"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Patient } from "./types"
import type { PatientUpdateRequest, PreferredContactMethod } from "@/types/patient"

const patientEditSchema = z.object({
  first_name: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  last_name: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  dob: z.date({
    error: "Date of birth is required.",
  }),
  phone: z.string().optional().or(z.literal("")),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  preferred_contact_method: z.enum(["whatsapp", "email", "sms", "phone"]).optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
})

// Used for the outer payload/handling shape only — NOT passed to useForm's
// generic. allergies is managed as separate local state (see PatientFormSheet
// for the same pattern), so the RHF form type and the zodResolver's inferred
// type always match exactly and never diverge into `FieldValues`.
type PatientEditFormValues = z.infer<typeof patientEditSchema> & {
  allergies: string[]
}

interface PatientEditSheetProps {
  patient: Patient
  open: boolean
  onOpenChange: (open: boolean) => void
  canEditClinical: boolean
  onSave: (payload: PatientUpdateRequest) => Promise<void> | void
}

function getInitialValues(patient: Patient): z.infer<typeof patientEditSchema> {
  return {
    first_name: patient.first_name ?? "",
    last_name: patient.last_name ?? "",
    dob: parseDate(patient.dob) ?? new Date(),
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    address: patient.address ?? "",
    preferred_contact_method: patient.preferred_contact_method ?? undefined,
    emergency_contact_name: patient.emergency_contact_name ?? "",
    emergency_contact_phone: patient.emergency_contact_phone ?? "",
    medical_history: patient.medical_history ?? "",
    current_medications: patient.current_medications ?? "",
  }
}

function parseDate(value?: string | null) {
  if (!value) return undefined
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function normalizeString(value: string | undefined) {
  return value?.trim() ? value.trim() : null
}

function sameAllergies(a: string[], b: string[]) {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

export function PatientEditSheet({
  patient,
  open,
  onOpenChange,
  canEditClinical,
  onSave,
}: PatientEditSheetProps) {
  const [allergies, setAllergies] = useState<string[]>(patient.allergies ?? [])
  const [allergyInput, setAllergyInput] = useState("")

  const form = useForm<z.infer<typeof patientEditSchema>>({
    resolver: zodResolver(patientEditSchema),
    defaultValues: getInitialValues(patient),
  })

  useEffect(() => {
    if (open) {
      form.reset(getInitialValues(patient))
      setAllergies(patient.allergies ?? [])
      setAllergyInput("")
    }
  }, [form, open, patient])

  const addAllergy = () => {
    const value = allergyInput.trim()
    if (!value) return
    setAllergies((current) => (current.includes(value) ? current : [...current, value]))
    setAllergyInput("")
  }

  const removeAllergy = (value: string) => {
    setAllergies((current) => current.filter((item) => item !== value))
  }

  async function handleSubmit(values: z.infer<typeof patientEditSchema>) {
    const payload: PatientUpdateRequest = {}
    const { dirtyFields } = form.formState

    if (dirtyFields.first_name) {
      payload.first_name = normalizeString(values.first_name) ?? undefined
    }
    if (dirtyFields.last_name) {
      payload.last_name = normalizeString(values.last_name) ?? undefined
    }
    if (dirtyFields.dob) {
      payload.dob = values.dob ? format(values.dob, "yyyy-MM-dd") : undefined
    }
    if (dirtyFields.phone) {
      payload.phone = normalizeString(values.phone) ?? null
    }
    if (dirtyFields.email) {
      payload.email = normalizeString(values.email) ?? null
    }
    if (dirtyFields.address) {
      payload.address = normalizeString(values.address) ?? null
    }
    if (dirtyFields.preferred_contact_method) {
      payload.preferred_contact_method = values.preferred_contact_method ?? null
    }
    if (dirtyFields.emergency_contact_name) {
      payload.emergency_contact_name = normalizeString(values.emergency_contact_name) ?? null
    }
    if (dirtyFields.emergency_contact_phone) {
      payload.emergency_contact_phone = normalizeString(values.emergency_contact_phone) ?? null
    }

    if (canEditClinical) {
      if (!sameAllergies(allergies, patient.allergies ?? [])) {
        payload.allergies = allergies
      }
      if (dirtyFields.medical_history) {
        payload.medical_history = normalizeString(values.medical_history) ?? null
      }
      if (dirtyFields.current_medications) {
        payload.current_medications = normalizeString(values.current_medications) ?? null
      }
    }

    if (Object.keys(payload).length === 0) {
      onOpenChange(false)
      return
    }

    try {
      await onSave(payload)
      onOpenChange(false)
    } catch {
      // Keep the sheet open so the user can retry without losing their edits.
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6">
          <SheetTitle>Edit patient</SheetTitle>
          <SheetDescription>
            Update the patient&apos;s contact information and any clinical details you are allowed to edit.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex flex-1 min-h-0 flex-col overflow-hidden">
            <ScrollArea className="flex-1 min-h-0 px-6">
              <div className="flex flex-col gap-6 py-4 pb-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Personal information</h3>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Amira" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Bouzid" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="dob"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date of birth *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start text-left font-normal cursor-pointer",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(field.value, "PPP") : "Pick a date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                captionLayout="dropdown"
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preferred_contact_method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred contact</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(value as PreferredContactMethod)}
                            value={field.value ?? ""}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue placeholder="Select preferred contact" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="sms">SMS</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+216 22 345 678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="patient@example.com" {...field} />
                          </FormControl>
                          {patient.portal_status !== "not_invited" && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              This patient has a portal account — changing this email also updates their login.
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Full address" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="emergency_contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency contact</FormLabel>
                          <FormControl>
                            <Input placeholder="Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergency_contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {canEditClinical && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-4">
                      <h3 className="text-sm font-semibold text-muted-foreground">Clinical information</h3>

                      <div className="space-y-2">
                        <FormLabel>Known allergies</FormLabel>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Type an allergy and press Add"
                            value={allergyInput}
                            onChange={(event) => setAllergyInput(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault()
                                addAllergy()
                              }
                            }}
                          />
                          <Button type="button" variant="outline" className="cursor-pointer shrink-0" onClick={addAllergy}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add
                          </Button>
                        </div>
                        {allergies.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {allergies.map((item) => (
                              <Badge key={item} variant="secondary" className="gap-1">
                                {item}
                                <button
                                  type="button"
                                  onClick={() => removeAllergy(item)}
                                  className="cursor-pointer"
                                  aria-label={`Remove ${item}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name="medical_history"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medical history</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Relevant conditions or past procedures" className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="current_medications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current medications</FormLabel>
                            <FormControl>
                              <Textarea placeholder="List current medications and dosages" className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>

            <SheetFooter className="border-t px-6 py-4">
              <Button type="button" variant="outline" className="cursor-pointer" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="cursor-pointer" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}