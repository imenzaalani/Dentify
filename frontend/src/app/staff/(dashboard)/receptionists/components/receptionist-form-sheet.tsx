"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Receptionist } from "./data-table"

const receptionistFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required." }),
  lastName: z.string().min(2, { message: "Last name is required." }),
  email: z.string().email({ message: "Enter a valid email." }),
  phone: z.string().optional(),
  notes: z.string().optional(),
  avatarFile: z.instanceof(File).optional(),
})

export type ReceptionistFormValues = z.infer<typeof receptionistFormSchema>

const emptyValues: ReceptionistFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  notes: "",
}

function receptionistToFormValues(r: Receptionist): ReceptionistFormValues {
  return {
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    phone: r.phone ?? "",
    notes: r.notes ?? "",
  }
}

interface ReceptionistFormSheetProps {
  mode?: "create" | "edit"
  receptionist?: Receptionist
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSubmitReceptionist: (values: ReceptionistFormValues) => void
  trigger?: React.ReactNode
}

export function ReceptionistFormSheet({
  mode = "create",
  receptionist,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onSubmitReceptionist,
  trigger,
}: ReceptionistFormSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChangeProp ?? setInternalOpen

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)

  const form = useForm<ReceptionistFormValues>({
    resolver: zodResolver(receptionistFormSchema),
    defaultValues: receptionist ? receptionistToFormValues(receptionist) : emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(receptionist ? receptionistToFormValues(receptionist) : emptyValues)
      setAvatarPreviewUrl(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, receptionist])

  // Revoke the object URL when it's replaced or the sheet unmounts, so we
  // don't leak memory across repeated photo picks.
  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    }
  }, [avatarPreviewUrl])

  const firstName = form.watch("firstName")
  const lastName = form.watch("lastName")
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "RC"

  const existingAvatarUrl = mode === "edit" ? receptionist?.avatarUrl : undefined
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

  function onSubmit(data: ReceptionistFormValues) {
    onSubmitReceptionist(data)
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
            Add Receptionist
          </Button>
        </SheetTrigger>
      ) : null}
      <SheetContent className="sm:max-w-2xl h-full overflow-hidden flex flex-col p-0">
        <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 px-6 py-5 backdrop-blur-xl">
          <div className="flex flex-col gap-1">
            <SheetTitle className="text-2xl font-semibold tracking-tight">
              {mode === "edit" ? "Edit Receptionist" : "Add new receptionist"}
            </SheetTitle>
            <SheetDescription className="max-w-2xl text-sm text-muted-foreground">
              {mode === "edit"
                ? "Update this staff member's details."
                : "Create a receptionist account and send an invite for password setup."
              }
            </SheetDescription>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 min-h-0 px-6 py-5">
          <Form {...form}>
            <form
              id="receptionist-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pb-6"
            >
              <Card className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/80 shadow-sm">
                <CardHeader className="px-4 py-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        Receptionist profile photo
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm text-muted-foreground">
                        Upload a profile photo for the team directory and account profile.
                      </CardDescription>
                    </div>
                    <Avatar className="h-16 w-16 ring-1 ring-slate-200">
                      {displayedAvatarUrl ? <AvatarImage src={displayedAvatarUrl} alt="Profile preview" /> : null}
                      <AvatarFallback className="text-base font-semibold text-white bg-slate-500">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 border-t border-slate-200 px-4 py-4 sm:grid-cols-[1fr_auto]">
                  <div className="text-sm text-muted-foreground">
                    Add an optional profile image so the receptionist is easily recognizable in the app.
                    {form.formState.errors.avatarFile ? (
                      <p className="mt-1 text-sm font-medium text-destructive">
                        {form.formState.errors.avatarFile.message as string}
                      </p>
                    ) : null}
                  </div>
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
                    className="h-11 self-start"
                    onClick={handlePhotoButtonClick}
                  >
                    Upload photo
                  </Button>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input placeholder="Sarra" {...field} />
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
                        <Input placeholder="Gharbi" {...field} />
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
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="reception@dentapp.tn" {...field} />
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
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+216 20 000 000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Shift preferences, internal notes…"
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>
        <SheetFooter className="border-t bg-background/80 px-6 py-4 backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {mode === "create" ? (
              <p className="text-sm text-muted-foreground">
                The receptionist will receive an invite email to complete their account setup.
              </p>
            ) : null}
            <Button type="submit" form="receptionist-form" size="lg">
              {mode === "edit" ? "Save changes" : "Create receptionist account"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}