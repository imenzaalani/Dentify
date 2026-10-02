"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, CheckCircle2 } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Installment } from "./data-table"
import { formatTND } from "./data-table"
import type { MarkInstallmentPaidInput, PaymentMethod } from "@/types/invoice"

const installmentPaymentFormSchema = z.object({
  amount: z
    .number({ error: "Enter the amount received." })
    .positive({ message: "Amount must be greater than 0." }),
  date: z.date({ error: "Payment date is required." }),
  method: z.string().min(1, { message: "Please select a payment method." }),
  reference: z.string().optional(),
})

type InstallmentPaymentFormValues = z.infer<typeof installmentPaymentFormSchema>

interface MarkInstallmentPaidDialogProps {
  installment: Installment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payment: MarkInstallmentPaidInput) => void | Promise<void>
}

export function MarkInstallmentPaidDialog({
  installment,
  open,
  onOpenChange,
  onConfirm,
}: MarkInstallmentPaidDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<InstallmentPaymentFormValues>({
    resolver: zodResolver(installmentPaymentFormSchema),
    defaultValues: { amount: 0, method: "", reference: "" },
  })

  useEffect(() => {
    if (installment && open) {
      form.reset({
        amount: installment.amount,
        date: new Date(),
        method: "",
        reference: "",
      })
    }
  }, [installment, open, form])

  async function onSubmit(data: InstallmentPaymentFormValues) {
    setIsSubmitting(true)
    try {
      await onConfirm({
        amount: data.amount,
        payment_date: data.date.toISOString().split("T")[0],
        method: data.method as PaymentMethod,
        reference: data.reference,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!installment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mark installment #{installment.index} as paid</DialogTitle>
          <DialogDescription>
            Due {new Date(installment.due_date).toLocaleDateString()} —{" "}
            <span className="font-medium text-foreground">
              {formatTND(installment.amount)}
            </span>
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount received (TND) *</FormLabel>
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
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment date *</FormLabel>
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
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment method *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue placeholder="Select a method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="Check number, transfer reference…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
                <CheckCircle2 className="mr-2 size-4" />
                {isSubmitting ? "Confirming..." : "Confirm payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}