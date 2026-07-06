"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, CalendarClock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Invoice, PaymentPlan } from "./data-table"
import { formatTND } from "./data-table"
import { buildPaymentPlan } from "./payment-plan"

const paymentPlanFormSchema = z.object({
  numberOfInstallments: z.string().min(1, "Select a number of installments."),
  frequency: z.enum(["weekly", "biweekly", "monthly"], {
    error: "Select a frequency.",
  }),
  firstDueDate: z.date({ error: "First due date is required." }),
})

type PaymentPlanFormValues = z.infer<typeof paymentPlanFormSchema>

interface PaymentPlanDialogProps {
  invoice: Invoice
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreatePlan: (plan: PaymentPlan) => void
}

export function PaymentPlanDialog({
  invoice,
  open,
  onOpenChange,
  onCreatePlan,
}: PaymentPlanDialogProps) {
  const form = useForm<PaymentPlanFormValues>({
    resolver: zodResolver(paymentPlanFormSchema),
    defaultValues: {
      numberOfInstallments: "3",
      frequency: "monthly",
      firstDueDate: new Date(),
    },
  })

  const numberOfInstallments = Number(form.watch("numberOfInstallments"))
  const frequency = form.watch("frequency")
  const firstDueDate = form.watch("firstDueDate")

  const preview =
    numberOfInstallments > 0 && frequency && firstDueDate
      ? buildPaymentPlan({
          totalAmount: invoice.balance,
          numberOfInstallments,
          frequency,
          firstDueDate,
        })
      : null

  function onSubmit() {
    if (!preview) return
    onCreatePlan(preview)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set up a payment plan</DialogTitle>
          <DialogDescription>
            {invoice.number} — {invoice.patientName}. Remaining balance to split:{" "}
            <span className="font-medium text-foreground">
              {formatTND(invoice.balance)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numberOfInstallments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Installments *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[2, 3, 4, 6, 12].map((n) => (
                          <SelectItem
                            key={n}
                            value={String(n)}
                            className="cursor-pointer"
                          >
                            {n} installments
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
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="weekly" className="cursor-pointer">
                          Weekly
                        </SelectItem>
                        <SelectItem value="biweekly" className="cursor-pointer">
                          Every 2 weeks
                        </SelectItem>
                        <SelectItem value="monthly" className="cursor-pointer">
                          Monthly
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="firstDueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>First due date *</FormLabel>
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

            {preview && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">
                    Schedule preview
                  </p>
                  <div className="flex flex-col gap-1 rounded-lg border p-2.5 text-sm">
                    {preview.installments.map((installment) => (
                      <div
                        key={installment.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-muted-foreground">
                          #{installment.index} —{" "}
                          {new Date(installment.dueDate).toLocaleDateString()}
                        </span>
                        <span className="font-medium">
                          {formatTND(installment.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="submit" className="cursor-pointer">
                <CalendarClock className="mr-2 size-4" />
                Create payment plan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}