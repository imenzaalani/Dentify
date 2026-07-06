"use client"

import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourcesTab } from "../planning/components/resources-tab"
import { CareTypesTab } from "./components/care-types-tab"
import { PoliciesTab } from "./components/policies-tab"

const WEEKDAY_LABELS: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
}

const businessHourSchema = z.object({
  day: z.string(),
  start: z.string().optional(),
  end: z.string().optional(),
  off: z.boolean(),
})

const configFormSchema = z.object({
  practiceName: z.string().min(2, "Practice name is required."),
  address: z.string().min(2, "Address is required."),
  phone: z.string().min(6, "Enter a valid phone number."),
  email: z.string().email("Enter a valid email address."),
  website: z.string().optional(),
  timezone: z.string().min(1, "Select a timezone."),
  currency: z.string().min(1, "Select a currency."),
  appointmentDuration: z.string().min(1, "Select a default duration."),
  businessHours: z.array(businessHourSchema).length(7),
})

type ConfigFormValues = z.infer<typeof configFormSchema>

const defaultBusinessHours = [
  { day: "Mon", start: "08:30", end: "18:00", off: false },
  { day: "Tue", start: "08:30", end: "18:00", off: false },
  { day: "Wed", start: "08:30", end: "18:00", off: false },
  { day: "Thu", start: "08:30", end: "18:00", off: false },
  { day: "Fri", start: "08:30", end: "18:00", off: false },
  { day: "Sat", start: "09:00", end: "13:00", off: false },
  { day: "Sun", start: "", end: "", off: true },
]

export default function ConfigurationPage() {
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: {
      practiceName: "Dentify Dental Studio",
      address: "12 Avenue Habib Bourguiba, Tunis, Tunisia",
      phone: "+216 71 234 567",
      email: "contact@dentapp.tn",
      website: "https://perfectsmile.tn",
      timezone: "Africa/Tunis",
      currency: "TND",
      appointmentDuration: "30",
      businessHours: defaultBusinessHours,
    },
  })

  const { fields } = useFieldArray({ control: form.control, name: "businessHours" })

  function onSubmit(data: ConfigFormValues) {
    console.log("Practice configuration saved:", data)
    toast.success("Practice settings saved")
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold">Configuration</h1>
        <p className="text-muted-foreground">
          Configure your practice information, regional preferences, default
          business hours, and chairs/rooms.
        </p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general" className="cursor-pointer">General</TabsTrigger>
          <TabsTrigger value="care-types" className="cursor-pointer">Care Types</TabsTrigger>
          <TabsTrigger value="policies" className="cursor-pointer">Policies</TabsTrigger>
          <TabsTrigger value="resources" className="cursor-pointer">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Practice Information</CardTitle>
              <CardDescription>
                Shown on invoices, patient communications, and the public website.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="practiceName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Practice name</FormLabel>
                    <FormControl>
                      <Input placeholder="Dentify Dental Studio" {...field} />
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
                      <Textarea className="min-h-16" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+216 71 234 567" {...field} />
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
                      <FormLabel>Contact email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourpractice.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>
                Used for scheduling, invoicing, and default appointment length.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Africa/Tunis">Africa/Tunis (GMT+1)</SelectItem>
                        <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                        <SelectItem value="Africa/Casablanca">
                          Africa/Casablanca (GMT+1)
                        </SelectItem>
                        <SelectItem value="Africa/Cairo">Africa/Cairo (GMT+2)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="TND">TND — Tunisian Dinar</SelectItem>
                        <SelectItem value="EUR">EUR — Euro</SelectItem>
                        <SelectItem value="USD">USD — US Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="appointmentDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default appointment length</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="cursor-pointer w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">60 minutes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
              <CardDescription>
                Default hours used to generate the schedule grid and online booking
                availability. Individual doctors can still override their own hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {fields.map((field, index) => {
                const isOff = form.watch(`businessHours.${index}.off`)
                return (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 rounded-lg border p-2.5"
                  >
                    <span className="w-24 text-sm font-medium shrink-0">
                      {WEEKDAY_LABELS[field.day]}
                    </span>
                    {isOff ? (
                      <span className="flex-1 text-sm text-muted-foreground">Closed</span>
                    ) : (
                      <div className="flex flex-1 items-center gap-2">
                        <FormField
                          control={form.control}
                          name={`businessHours.${index}.start`}
                          render={({ field: startField }) => (
                            <Input type="time" className="h-8" {...startField} />
                          )}
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <FormField
                          control={form.control}
                          name={`businessHours.${index}.end`}
                          render={({ field: endField }) => (
                            <Input type="time" className="h-8" {...endField} />
                          )}
                        />
                      </div>
                    )}
                    <FormField
                      control={form.control}
                      name={`businessHours.${index}.off`}
                      render={({ field: offField }) => (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">Closed</span>
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
            </CardContent>
            <CardFooter className="justify-end border-t">
              <Button type="submit" className="cursor-pointer">
                Save changes
              </Button>
            </CardFooter>
          </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="care-types">
          <CareTypesTab />
        </TabsContent>

        <TabsContent value="policies">
          <PoliciesTab />
        </TabsContent>

        <TabsContent value="resources">
          <ResourcesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}