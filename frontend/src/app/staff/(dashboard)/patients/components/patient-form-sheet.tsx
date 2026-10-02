"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, X } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
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

const patientFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  dob: z.date({
    error: "Date of birth is required.",
  }),
  phone: z.string().min(8, {
    message: "Phone number must contain at least 8 digits.",
  }),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." })
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  preferredContactMethod: z.enum(["whatsapp", "email", "sms", "phone"]).optional(),
  createdVia: z.enum(["online_form", "phone_call", "walk_in"]),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  medicalHistory: z.string().optional(),
  currentMedications: z.string().optional(),
})

export type PatientFormValues = z.infer<typeof patientFormSchema> & {
  allergies: string[]
}

interface PatientFormSheetProps {
  onAddPatient: (patient: PatientFormValues) => void
}

export function PatientFormSheet({ onAddPatient }: PatientFormSheetProps) {
  const [open, setOpen] = useState(false)
  const [allergies, setAllergies] = useState<string[]>([])
  const [allergyInput, setAllergyInput] = useState("")

  const form = useForm<z.infer<typeof patientFormSchema>>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      preferredContactMethod: "whatsapp",
      createdVia: "walk_in",
      emergencyContactName: "",
      emergencyContactPhone: "",
      medicalHistory: "",
      currentMedications: "",
    },
  })

  const addAllergy = () => {
    const value = allergyInput.trim()
    if (value && !allergies.includes(value)) {
      setAllergies((prev) => [...prev, value])
    }
    setAllergyInput("")
  }

  const removeAllergy = (value: string) => {
    setAllergies((prev) => prev.filter((a) => a !== value))
  }

  function onSubmit(data: z.infer<typeof patientFormSchema>) {
    onAddPatient({ ...data, allergies })
    form.reset()
    setAllergies([])
    setOpen(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) {
          form.reset()
          setAllergies([])
        }
      }}
    >
      <SheetTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          New Patient
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
        <SheetHeader>
          <SheetTitle>New Patient</SheetTitle>
          <SheetDescription>
            Fill in the patient&apos;s personal and medical information. Required
            fields are marked with an asterisk.
            <br />
            <span className="text-xs">
              Note: patient creation isn&apos;t wired to the backend yet (no{" "}
              <code>POST /patients</code> endpoint) — this adds the patient
              locally only, for now.
            </span>
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 min-h-0 flex-col overflow-hidden"
          >
            <ScrollArea className="flex-1 min-h-0 px-6">
              <div className="flex flex-col gap-6 p-1 pb-6">
                {/* Personal information */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
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
                      name="lastName"
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
                  <div className="grid grid-cols-2 gap-4">
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
                      name="createdVia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Created via *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="walk_in">Walk-in</SelectItem>
                              <SelectItem value="phone_call">Phone call</SelectItem>
                              <SelectItem value="online_form">Online form</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="+216 22 345 678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preferredContactMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred contact</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue />
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
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="patient@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Full address"
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
                      name="emergencyContactName"
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
                      name="emergencyContactPhone"
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

                <Separator />

                {/* Medical information */}
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Medical Information
                  </h3>
                  <div className="space-y-2">
                    <FormLabel>Known allergies</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type an allergy and press Add"
                        value={allergyInput}
                        onChange={(e) => setAllergyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            addAllergy()
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="cursor-pointer shrink-0"
                        onClick={addAllergy}
                      >
                        Add
                      </Button>
                    </div>
                    {allergies.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {allergies.map((a) => (
                          <Badge key={a} variant="secondary" className="gap-1">
                            {a}
                            <button
                              type="button"
                              onClick={() => removeAllergy(a)}
                              className="cursor-pointer"
                              aria-label={`Remove ${a}`}
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
                    name="currentMedications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current medications</FormLabel>
                        <FormControl>
                          <Textarea className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical history</FormLabel>
                        <FormControl>
                          <Textarea className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>
            <SheetFooter className="border-t">
              <Button type="submit" className="cursor-pointer">
                Save Patient
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}