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
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Upload,
  Phone as PhoneIcon,
  Lock,
  AlertTriangle,
  AlertCircle,
  Eye,
  EyeOff,
  UserRound,
  ShieldCheck,
  MapPin,
  Stethoscope,
  Mail,
  MessageCircle,
} from "lucide-react"
import { authApi } from "@/lib/api/auth"
import { patientApi } from "@/lib/api/patients"
import { getAssetUrl } from "@/lib/api/client"
import { User } from "@/types/auth"
import type { PatientSelf, PreferredContactMethod } from "@/types/patient"

const patientFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  preferredContactMethod: z.enum(["whatsapp", "email", "sms", "phone"]),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  medicalHistory: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
})

type PatientFormValues = z.infer<typeof patientFormSchema>

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

const emptyDefaults: PatientFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  preferredContactMethod: "email",
  allergies: "",
  currentMedications: "",
  medicalHistory: "",
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
}

function toFormValues(user: User, patient: PatientSelf): PatientFormValues {
  return {
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    address: patient.address ?? "",
    preferredContactMethod: (patient.preferred_contact_method as PreferredContactMethod) ?? "email",
    allergies: (patient.allergies ?? []).join(", "),
    currentMedications: patient.current_medications ?? "",
    medicalHistory: patient.medical_history ?? "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  }
}

export default function PatientProfilePage() {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: emptyDefaults,
  })

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentPatient, setCurrentPatient] = useState<PatientSelf | null>(null)
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    void (async () => {
      try {
        const [me, patient] = await Promise.all([authApi.me(), patientApi.getMyRecord()])
        setCurrentUser(me)
        setCurrentPatient(patient)
        form.reset(toFormValues(me, patient))
      } catch {
        // ignore — page renders with empty defaults, same fail-soft as staff settings
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

  function onSubmit(data: PatientFormValues) {
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
          phone: data.phone ?? undefined,
        })
        setCurrentUser(updatedUser)

        const updatedPatient = await patientApi.updateMyRecord({
          address: data.address ?? null,
          preferred_contact_method: data.preferredContactMethod,
          allergies: data.allergies
            ? data.allergies.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          current_medications: data.currentMedications ?? null,
          medical_history: data.medicalHistory ?? null,
        })
        setCurrentPatient(updatedPatient)

        if (data.newPassword) {
          if (!data.currentPassword) throw new Error("Current password is required to change password")
          await authApi.changePassword(data.currentPassword, data.newPassword)
          toast.success("Password changed")
        }

        toast.success("Profile saved")
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unable to save profile"
        toast.error(msg)
      }
    })()
  }

  const newPasswordValue = form.watch("newPassword") || ""
  const checks = requirementChecks(newPasswordValue)

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="text-muted-foreground mt-1">
            Manage your personal information, medical details, and preferences.
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
                    type="button"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {currentUser ? `${currentUser.first_name ?? ""} ${currentUser.last_name ?? ""}` : "—"}
                  </div>
                  <Badge variant="secondary" className="mt-1 capitalize font-normal">
                    Patient
                  </Badge>
                  <div className="text-sm text-muted-foreground truncate mt-1">{currentUser?.email}</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="text-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {currentUser?.is_verified ? "Verified" : "Pending"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="text-right">
                    {(currentUser as any)?.created_at
                      ? new Date((currentUser as any).created_at).toLocaleDateString()
                      : "—"}
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
                <SectionIcon icon={MapPin} />
                <div>
                  <CardTitle>Address &amp; Contact Preference</CardTitle>
                  <CardDescription>Where you are and how you&apos;d like us to reach you.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your address" {...field} />
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
                    <FormLabel>Preferred Contact Method</FormLabel>
                    <FormControl>
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label htmlFor="channel-whatsapp" className="font-medium">WhatsApp</Label>
                              <p className="text-sm text-muted-foreground">Receive updates via WhatsApp</p>
                            </div>
                          </div>
                          <RadioGroupItem value="whatsapp" id="channel-whatsapp" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label htmlFor="channel-email" className="font-medium">Email</Label>
                              <p className="text-sm text-muted-foreground">Receive updates via email</p>
                            </div>
                          </div>
                          <RadioGroupItem value="email" id="channel-email" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label htmlFor="channel-sms" className="font-medium">SMS</Label>
                              <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
                            </div>
                          </div>
                          <RadioGroupItem value="sms" id="channel-sms" />
                        </div>
                      </RadioGroup>
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
                <SectionIcon icon={Stethoscope} />
                <div>
                  <CardTitle>Medical Information</CardTitle>
                  <CardDescription>Your health details and medical history</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">Important: Allergies</p>
                    <p className="text-sm text-yellow-800">
                      Always inform your dentist about these allergies before treatment
                    </p>
                  </div>
                </div>
              </div>
              <FormField
                control={form.control}
                name="allergies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Known Allergies</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List any known allergies, comma-separated (e.g., Penicillin, Latex)"
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
                name="currentMedications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Medications</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List any medications you're currently taking"
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
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Previous surgeries, treatments, or relevant medical events"
                        className="resize-none"
                        {...field}
                      />
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
                  if (currentUser && currentPatient) {
                    form.reset(toFormValues(currentUser, currentPatient))
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