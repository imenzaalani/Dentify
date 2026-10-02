"use client"

import { useState } from "react"
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
import { Switch } from "@/components/ui/switch"
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

const careTypes = [
  "Consultation",
  "Détartrage",
  "Extraction",
  "Blanchiment dentaire",
  "Couronne dentaire",
  "Implant dentaire",
  "Appareil orthodontique",
  "Urgence",
]

const timeSlots = [
  "8:00 AM", "8:30 AM", "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
]

const leadFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  phone: z.string().min(8, { message: "Phone number must contain at least 8 digits." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  requestedService: z.string().min(1, { message: "Please select a service." }),
  requestedDate: z.date({ error: "Requested date is required." }),
  bookingFor: z.enum(["myself", "dependent", "someone_else"]),
  source: z.enum(["website", "phone", "walk_in", "referral", "instagram", "facebook"]),
  hearAboutUs: z.enum(["google", "instagram_facebook", "yelp", "family_friend", "walk_by", "other"]).optional(),
  comments: z.string().optional(),
  smsConsent: z.boolean(),
})

export type LeadFormValues = z.infer<typeof leadFormSchema> & {
  requestedTime: string
}

interface LeadFormSheetProps {
  onAddLead: (lead: LeadFormValues) => void
}

export function LeadFormSheet({ onAddLead }: LeadFormSheetProps) {
  const [open, setOpen] = useState(false)
  const [requestedTime, setRequestedTime] = useState(timeSlots[2])

  const form = useForm<z.infer<typeof leadFormSchema>>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      requestedService: careTypes[0],
      bookingFor: "myself",
      source: "phone",
      hearAboutUs: undefined,
      comments: "",
      smsConsent: true,
    },
  })

  function onSubmit(data: z.infer<typeof leadFormSchema>) {
    onAddLead({ ...data, requestedTime })
    form.reset()
    setRequestedTime(timeSlots[2])
    setOpen(false)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) form.reset()
      }}
    >
      <SheetTrigger asChild>
        <Button className="cursor-pointer">
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
        <SheetHeader>
          <SheetTitle>New Lead</SheetTitle>
          <SheetDescription>
            Log a lead received by phone or at the front desk. Required fields are
            marked with an asterisk.
          </SheetDescription>
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 min-h-0 flex-col overflow-hidden"
          >
            <ScrollArea className="flex-1 min-h-0 px-6">
              <div className="flex flex-col gap-6 p-1 pb-6">
                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Yassine" {...field} />
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
                            <Input placeholder="Trabelsi" {...field} />
                          </FormControl>
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
                            <Input placeholder="+216 20 145 778" {...field} />
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
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input placeholder="name@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="smsConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>SMS / WhatsApp consent</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Lead agreed to be contacted by text.
                          </p>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Request Details
                  </h3>
                  <FormField
                    control={form.control}
                    name="requestedService"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requested service *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {careTypes.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
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
                      name="requestedDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Requested date *</FormLabel>
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
                                  <CalendarIcon className="mr-2 size-4" />
                                  {field.value ? format(field.value, "PP") : "Pick a date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormItem>
                      <FormLabel>Requested time</FormLabel>
                      <Select value={requestedTime} onValueChange={setRequestedTime}>
                        <FormControl>
                          <SelectTrigger className="w-full cursor-pointer">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timeSlots.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bookingFor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking for</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="myself">Myself</SelectItem>
                              <SelectItem value="dependent">A dependent</SelectItem>
                              <SelectItem value="someone_else">Someone else</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full cursor-pointer">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="phone">Phone</SelectItem>
                              <SelectItem value="walk_in">Walk-in</SelectItem>
                              <SelectItem value="referral">Referral</SelectItem>
                              <SelectItem value="instagram">Instagram</SelectItem>
                              <SelectItem value="facebook">Facebook</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="hearAboutUs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How did they hear about us?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full cursor-pointer">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="google">Google</SelectItem>
                            <SelectItem value="instagram_facebook">Instagram / Facebook</SelectItem>
                            <SelectItem value="yelp">Yelp</SelectItem>
                            <SelectItem value="family_friend">Family / friend</SelectItem>
                            <SelectItem value="walk_by">Walk by</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comments</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Anything the front desk should know..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </ScrollArea>

            <SheetFooter className="flex-row gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 cursor-pointer"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 cursor-pointer">
                Add Lead
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}