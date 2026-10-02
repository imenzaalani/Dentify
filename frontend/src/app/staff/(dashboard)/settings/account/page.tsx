"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { z } from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Phone as PhoneIcon, Lock, AlertTriangle, Eye, EyeOff, Check, UserRound, ShieldCheck } from "lucide-react"
import { authApi } from "@/lib/api/auth"
import { getAssetUrl } from "@/lib/api/client"
import { Separator } from "@/components/ui/separator"
import { User } from "@/types/auth"
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter"
import { cn } from "@/lib/utils"

const accountFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
})

type AccountFormValues = z.infer<typeof accountFormSchema>

function requirementChecks(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}


function SectionIcon({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
      <Icon className="h-4 w-4" />
    </div>
  )
}

export default function AccountSettings() {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  function onSubmit(data: AccountFormValues) {
    void (async () => {
      try {
        if (selectedFile) {
          const updated = await authApi.staff.uploadMyAvatar(selectedFile)
          setCurrentUser(updated)
          toast.success("Profile photo updated")
        }

        const updatedUser = await authApi.updateMe({
          email: data.email,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: (data as any).phone ?? undefined,
        })
        setCurrentUser(updatedUser)

        if (data.newPassword) {
          if (!data.currentPassword) throw new Error("Current password is required to change password")
          await authApi.changePassword(data.currentPassword, data.newPassword)
          toast.success("Password changed")
        }

        toast.success("Account settings saved")
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unable to save account"
        toast.error(msg)
      }
    })()
  }

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const me = await authApi.me()
        setCurrentUser(me)
        form.reset({
          firstName: me.first_name ?? "",
          lastName: me.last_name ?? "",
          email: me.email ?? "",
          phone: me.phone ?? "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } catch (err) {
        // ignore
      }
    })()
  }, [])

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    }
  }, [avatarPreviewUrl])

  function handlePhotoButtonClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use a JPEG, PNG, or WEBP image.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller.")
      return
    }
    setSelectedFile(file)
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl)
    setAvatarPreviewUrl(URL.createObjectURL(file))
  }

  const newPasswordValue = form.watch("newPassword") || ""
  const checks = requirementChecks(newPasswordValue)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and preferences.
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <Avatar className="h-16 w-16 ring-2 ring-background shadow-sm">
                    {avatarPreviewUrl ? (
                      <AvatarImage src={avatarPreviewUrl} alt="Profile" />
                    ) : currentUser?.avatar_url ? (
                      <AvatarImage src={getAssetUrl(currentUser.avatar_url)} alt="Profile" />
                    ) : (
                      <AvatarFallback className="text-base font-semibold bg-primary text-primary-foreground">
                        {(currentUser?.first_name?.[0] ?? "") + (currentUser?.last_name?.[0] ?? "")}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button
                    onClick={handlePhotoButtonClick}
                    className="absolute -right-1 -bottom-1 bg-background rounded-full p-1.5 shadow-md border border-border hover:bg-muted transition-colors"
                    aria-label="Change photo"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {currentUser ? `${currentUser.first_name ?? ""} ${currentUser.last_name ?? ""}` : "—"}
                  </div>
                  <Badge variant="secondary" className="mt-1 capitalize font-normal">
                    {currentUser?.role ?? "Staff"}
                  </Badge>
                  <div className="text-sm text-muted-foreground truncate mt-1">{currentUser?.email}</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="text-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last login</span>
                  <span className="text-right">
                    {(currentUser as any)?.last_login ?? (currentUser as any)?.created_at ?? "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <SectionIcon icon={UserRound} />
                <div>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal information that will be displayed on your profile.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your first name" {...field} />
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your last name" {...field} />
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter your email" {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="+216 71 234 567" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <div className="flex items-center gap-3">
                <SectionIcon icon={Lock} />
                <div>
                  <CardTitle>Password &amp; Security</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showCurrentPassword ? "text" : "password"}
                          placeholder="Enter current password"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNewPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((s) => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Irreversible and destructive actions.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Separator className="mb-4 bg-destructive/20" />
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <h4 className="font-semibold">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                  </p>
                </div>
                <Button type="button" variant="destructive" className="border-0">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="h-20" />
        </form>
      </Form>

      {form.formState.isDirty && (
        <div className="fixed left-0 right-0 bottom-4 flex justify-center pointer-events-none z-50">
          <div className="bg-background/95 backdrop-blur border shadow-lg rounded-xl px-4 py-3 flex items-center gap-4 pointer-events-auto w-[min(980px,96%)]">
            <div className="flex-1 text-sm text-muted-foreground">Changes not saved</div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  if (currentUser) {
                    form.reset({
                      firstName: currentUser.first_name ?? "",
                      lastName: currentUser.last_name ?? "",
                      email: currentUser.email ?? "",
                      phone: currentUser.phone ?? "",
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    })
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() =>
                  form.handleSubmit((d) => {
                    void (async () => {
                      await onSubmit(d)
                      setLastSavedAt(new Date())
                      form.reset(form.getValues())
                    })()
                  })()
                }
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
      {lastSavedAt && (
        <div className="text-sm text-muted-foreground">Changes saved at {lastSavedAt.toLocaleTimeString()}</div>
      )}
    </div>
  )
}