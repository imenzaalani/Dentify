"use client"

import { useEffect, useRef, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Upload, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardDescription, CardTitle } from "@/components/ui/card"
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
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Doctor } from "./data-table"

const SPECIALTIES = [
  "Généraliste",
  "Orthodontiste",
  "Implantologue",
  "Pédodontiste",
  "Endodontiste",
  "Parodontologue",
  "Prothésiste",
  "Chirurgien-dentiste",
  "Other",
]

const COLOR_SWATCHES = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0d9488",
  "#db2777",
  "#4b5563",
]

const WEEKDAY_LABELS: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
}

const workingHourSchema = z.object({
  day: z.string(),
  start: z.string().optional(),
  end: z.string().optional(),
  off: z.boolean(),
})

const doctorFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required." }),
  lastName: z.string().min(2, { message: "Last name is required." }),
  email: z.string().email({ message: "Enter a valid professional email." }),
  phone: z.string().optional(),
  specialty: z.string().min(1, { message: "Please select a specialty." }),
  specialtyOther: z.string().optional(),
  licenseNumber: z.string().min(1, { message: "License number is required." }),
  bio: z.string().optional(),
  color: z.string().min(1, { message: "Pick a schedule color." }),
  workingHours: z.array(workingHourSchema).length(7),
  avatarFile: z.instanceof(File).optional(),
})

export type DoctorFormValues = z.infer<typeof doctorFormSchema>

const defaultWorkingHours = [
  { day: "Mon", start: "08:30", end: "17:30", off: false },
  { day: "Tue", start: "08:30", end: "17:30", off: false },
  { day: "Wed", start: "08:30", end: "17:30", off: false },
  { day: "Thu", start: "08:30", end: "17:30", off: false },
  { day: "Fri", start: "08:30", end: "17:30", off: false },
  { day: "Sat", start: "09:00", end: "13:00", off: false },
  { day: "Sun", start: "", end: "", off: true },
]

const emptyValues: DoctorFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  specialty: "",
  specialtyOther: "",
  licenseNumber: "",
  bio: "",
  color: COLOR_SWATCHES[0],
  workingHours: defaultWorkingHours,
  avatarFile: undefined,
}

function doctorToFormValues(doctor: Doctor): DoctorFormValues {
  const isKnownSpecialty = SPECIALTIES.slice(0, -1).includes(doctor.specialty)
  return {
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    email: doctor.email,
    phone: doctor.phone ?? "",
    specialty: isKnownSpecialty ? doctor.specialty : "Other",
    specialtyOther: isKnownSpecialty ? "" : doctor.specialty,
    licenseNumber: doctor.licenseNumber,
    bio: doctor.bio ?? "",
    color: doctor.color,
    workingHours: doctor.workingHours,
    avatarFile: undefined,
  }
}

interface DoctorFormSheetProps {
  mode?: "create" | "edit"
  doctor?: Doctor
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmitDoctor: (values: DoctorFormValues) => void
  trigger?: React.ReactNode
}

export function DoctorFormSheet({
  mode = "create",
  doctor,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onSubmitDoctor,
  trigger,
}: DoctorFormSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChangeProp ?? setInternalOpen
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: doctor ? doctorToFormValues(doctor) : emptyValues,
  })

  const { fields } = useFieldArray({ control: form.control, name: "workingHours" })

  useEffect(() => {
    if (open) {
      form.reset(doctor ? doctorToFormValues(doctor) : emptyValues)
      setAvatarPreviewUrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, doctor])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    }
  }, [avatarPreviewUrl])

  const specialty = form.watch("specialty")
  const firstName = form.watch("firstName")
  const lastName = form.watch("lastName")
  const color = form.watch("color")

  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "DR"

  const existingAvatarUrl = mode === "edit" ? doctor?.avatarUrl : undefined
  const displayedAvatarUrl = avatarPreviewUrl ?? existingAvatarUrl

  function handlePhotoButtonClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      form.setError("avatarFile", { message: "Use a JPEG, PNG, or WEBP image." })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      form.setError("avatarFile", { message: "Image must be 5MB or smaller." })
      return
    }

    form.clearErrors("avatarFile")
    form.setValue("avatarFile", file)
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    setAvatarPreviewUrl(URL.createObjectURL(file))
  }

  function onSubmit(data: DoctorFormValues) {
    onSubmitDoctor(data)
    form.reset(emptyValues)
    setAvatarPreviewUrl(null)
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger !== undefined ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : mode === "create" ? (
        <SheetTrigger asChild>
          <Button className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            Add Doctor
          </Button>
        </SheetTrigger>
      ) : null}
      <SheetContent className="sm:max-w-2xl h-full overflow-hidden flex flex-col p-0">
        <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 px-6 py-5 backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-2xl font-semibold tracking-tight">
              {mode === "edit" ? "Edit doctor" : "Add new doctor"}
            </SheetTitle>
            <SheetDescription className="max-w-2xl text-sm text-muted-foreground">
              {mode === "edit"
                ? "Update this practitioner's profile and working hours."
                : "Create a dentist account and send an invite for password setup."
              }
            </SheetDescription>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 min-h-0 px-6 py-5">
          <Form {...form}>
            <form
              id="doctor-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pb-6"
            >
              <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/80 shadow-sm">
                <CardHeader className="px-4 py-5">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    Doctor profile photo
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-muted-foreground">
                    Upload a profile photo for the team directory and patient-facing pages.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 border-t border-slate-200 px-4 py-4 sm:grid-cols-[1fr_auto]">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 ring-1 ring-slate-200">
                      {displayedAvatarUrl ? (
                        <AvatarImage src={displayedAvatarUrl} alt="Profile preview" />
                      ) : (
                        <AvatarFallback
                          className="text-base font-semibold text-white"
                          style={{ backgroundColor: color }}
                        >
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Doctor initials</p>
                      <p className="text-sm text-muted-foreground">
                        This preview updates as you type the first and last name.
                      </p>
                    </div>
                  </div>
                  <CardFooter className="flex justify-start sm:justify-end px-0">
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11"
                        onClick={handlePhotoButtonClick}
                      >
                        <Upload className="mr-2 size-3.5" />
                        Upload photo
                      </Button>
                      {form.formState.errors.avatarFile ? (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.avatarFile.message as string}
                        </p>
                      ) : null}
                    </div>
                  </CardFooter>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="Amel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input placeholder="Ben Salah" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="doctor@dentapp.tn"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+216 71 234 567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="cursor-pointer w-full">
                            <SelectValue placeholder="Select specialty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPECIALTIES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s === "Other" ? "Other…" : s}
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
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License number</FormLabel>
                      <FormControl>
                        <Input placeholder="ONCD-TN-00000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {specialty === "Other" && (
                <FormField
                  control={form.control}
                  name="specialtyOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify specialty</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter specialty" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Shown on public-facing pages."
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule color</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap items-center gap-2">
                        {COLOR_SWATCHES.map((swatch) => (
                          <button
                            key={swatch}
                            type="button"
                            className="size-8 rounded-full border border-slate-200 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            style={{
                              backgroundColor: swatch,
                              boxShadow:
                                field.value === swatch
                                  ? "0 0 0 2px var(--ring)"
                                  : "none",
                            }}
                            aria-label={`Use color ${swatch}`}
                            onClick={() => field.onChange(swatch)}
                          />
                        ))}
                        <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-muted-foreground">
                          <Input
                            type="color"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-9 w-12 cursor-pointer border-none bg-transparent p-0"
                          />
                          <span className="ml-3">Custom</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="border-slate-200" />

              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Working hours</p>
                    <p className="text-sm text-muted-foreground">
                      Set daily availability and mark days off.
                    </p>
                  </div>
                  <p className="text-sm text-slate-600">Use local time formatting for each day.</p>
                </div>
                <div className="space-y-2">
                  {fields.map((field, index) => {
                    const isOff = form.watch(`workingHours.${index}.off`)
                    return (
                      <div
                        key={field.id}
                        className="flex items-center gap-3 rounded-lg border p-2.5"
                      >
                        <span className="w-24 text-sm font-medium shrink-0">
                          {WEEKDAY_LABELS[field.day]}
                        </span>
                        {isOff ? (
                          <span className="flex-1 text-sm text-muted-foreground">
                            Day off
                          </span>
                        ) : (
                          <div className="flex flex-1 items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`workingHours.${index}.start`}
                              render={({ field: startField }) => (
                                <Input
                                  type="time"
                                  className="h-8"
                                  {...startField}
                                />
                              )}
                            />
                            <span className="text-muted-foreground text-sm">
                              to
                            </span>
                            <FormField
                              control={form.control}
                              name={`workingHours.${index}.end`}
                              render={({ field: endField }) => (
                                <Input
                                  type="time"
                                  className="h-8"
                                  {...endField}
                                />
                              )}
                            />
                          </div>
                        )}
                        <FormField
                          control={form.control}
                          name={`workingHours.${index}.off`}
                          render={({ field: offField }) => (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-muted-foreground">
                                Off
                              </span>
                              <Switch
                                checked={offField.value}
                                onCheckedChange={offField.onChange}
                                className="cursor-pointer"
                              />
                            </div>
                          )}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              
            </form>
          </Form>
        </ScrollArea>
        <SheetFooter className="border-t bg-background/80 px-6 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {mode === "create" ? (
              <p className="text-sm text-muted-foreground">
                The doctor will receive an invite email to complete their account setup.
              </p>
            ) : null}
            <Button type="submit" form="doctor-form" size="lg">
              {mode === "edit" ? "Save changes" : "Create doctor account"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
