"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Mail, MessageCircle, MessageSquare } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
import { DEFAULT_BUFFER_MINUTES } from "../../planning/availability"

const policiesFormSchema = z
  .object({
    bufferMinutes: z.string().min(1, "Sélectionnez une durée."),
    noShowThreshold: z.string().min(1, "Sélectionnez un seuil."),
    noShowWindowMonths: z.string().min(1, "Sélectionnez une période."),
    cancellationNoticeHours: z.string().min(1, "Sélectionnez un délai."),
    cancellationFeeType: z.enum(["none", "fixed", "percentage"]),
    cancellationFeeValue: z.string().optional(),
    cancellationPolicyText: z.string().min(1, "Le texte de la politique est requis."),
    channelEmail: z.boolean(),
    channelSms: z.boolean(),
    channelWhatsapp: z.boolean(),
    defaultChannel: z.enum(["email", "sms", "whatsapp"]),
  })
  .refine(
    (data) =>
      data.cancellationFeeType === "none" ||
      (data.cancellationFeeValue && Number(data.cancellationFeeValue) > 0),
    {
      message: "Indiquez un montant supérieur à 0.",
      path: ["cancellationFeeValue"],
    }
  )
  .refine(
    (data) => {
      if (data.defaultChannel === "email") return data.channelEmail
      if (data.defaultChannel === "sms") return data.channelSms
      return data.channelWhatsapp
    },
    {
      message: "Le canal par défaut doit être activé.",
      path: ["defaultChannel"],
    }
  )

type PoliciesFormValues = z.infer<typeof policiesFormSchema>

export function PoliciesTab() {
  const form = useForm<PoliciesFormValues>({
    resolver: zodResolver(policiesFormSchema),
    defaultValues: {
      bufferMinutes: String(DEFAULT_BUFFER_MINUTES),
      noShowThreshold: "3",
      noShowWindowMonths: "6",
      cancellationNoticeHours: "24",
      cancellationFeeType: "percentage",
      cancellationFeeValue: "50",
      cancellationPolicyText:
        "Toute annulation ou report doit être signalé au moins 24h à l'avance. En dessous de ce délai, des frais peuvent s'appliquer et une absence non justifiée sera comptabilisée comme un rendez-vous manqué.",
      channelEmail: true,
      channelSms: true,
      channelWhatsapp: false,
      defaultChannel: "sms",
    },
  })

  const feeType = form.watch("cancellationFeeType")
  const channelEmail = form.watch("channelEmail")
  const channelSms = form.watch("channelSms")
  const channelWhatsapp = form.watch("channelWhatsapp")

  function onSubmit(data: PoliciesFormValues) {
    console.log("Practice policies saved:", data)
    toast.success("Politiques enregistrées")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Battement entre rendez-vous</CardTitle>
            <CardDescription>
              Temps minimum laissé libre entre deux rendez-vous consécutifs
              d&apos;un même praticien, ou sur un même fauteuil/salle, pour le
              nettoyage et la préparation. Le planning grise les créneaux qui
              ne respectent pas ce délai.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="bufferMinutes"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Durée du battement</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0" className="cursor-pointer">
                        Aucun
                      </SelectItem>
                      <SelectItem value="5" className="cursor-pointer">
                        5 min
                      </SelectItem>
                      <SelectItem value="10" className="cursor-pointer">
                        10 min
                      </SelectItem>
                      <SelectItem value="15" className="cursor-pointer">
                        15 min
                      </SelectItem>
                      <SelectItem value="20" className="cursor-pointer">
                        20 min
                      </SelectItem>
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
            <CardTitle>Alertes absences (no-show)</CardTitle>
            <CardDescription>
              Un patient est signalé sur sa fiche dès qu&apos;il atteint ce
              nombre d&apos;absences non justifiées sur la période choisie.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="noShowThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seuil d&apos;alerte</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1" className="cursor-pointer">
                        1 absence
                      </SelectItem>
                      <SelectItem value="2" className="cursor-pointer">
                        2 absences
                      </SelectItem>
                      <SelectItem value="3" className="cursor-pointer">
                        3 absences
                      </SelectItem>
                      <SelectItem value="5" className="cursor-pointer">
                        5 absences
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="noShowWindowMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sur une période de</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1" className="cursor-pointer">
                        1 mois
                      </SelectItem>
                      <SelectItem value="3" className="cursor-pointer">
                        3 mois
                      </SelectItem>
                      <SelectItem value="6" className="cursor-pointer">
                        6 mois
                      </SelectItem>
                      <SelectItem value="12" className="cursor-pointer">
                        12 mois
                      </SelectItem>
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
            <CardTitle>Politique d&apos;annulation</CardTitle>
            <CardDescription>
              Délai de prévenance attendu et frais éventuels en cas
              d&apos;annulation tardive. Le texte est affiché au patient lors
              de la prise de rendez-vous et dans les rappels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="cancellationNoticeHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Délai minimum</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="12" className="cursor-pointer">
                          12 heures
                        </SelectItem>
                        <SelectItem value="24" className="cursor-pointer">
                          24 heures
                        </SelectItem>
                        <SelectItem value="48" className="cursor-pointer">
                          48 heures
                        </SelectItem>
                        <SelectItem value="72" className="cursor-pointer">
                          72 heures
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cancellationFeeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frais en cas de retard</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full cursor-pointer">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none" className="cursor-pointer">
                          Aucun
                        </SelectItem>
                        <SelectItem value="fixed" className="cursor-pointer">
                          Montant fixe (TND)
                        </SelectItem>
                        <SelectItem value="percentage" className="cursor-pointer">
                          Pourcentage de l&apos;acte
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {feeType !== "none" && (
                <FormField
                  control={form.control}
                  name="cancellationFeeValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {feeType === "percentage" ? "Pourcentage" : "Montant (TND)"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          step={feeType === "percentage" ? 1 : 0.5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="cancellationPolicyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texte affiché au patient</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-24" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Canal de notification par défaut</CardTitle>
            <CardDescription>
              Canal utilisé pour les rappels de rendez-vous et les
              communications automatiques lorsque le patient n&apos;a pas de
              préférence enregistrée sur sa fiche.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="channel-email">Email</Label>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="channelEmail"
                  render={({ field }) => (
                    <Switch
                      id="channel-email"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="cursor-pointer"
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="channel-sms">SMS</Label>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="channelSms"
                  render={({ field }) => (
                    <Switch
                      id="channel-sms"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="cursor-pointer"
                    />
                  )}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="size-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="channel-whatsapp">WhatsApp</Label>
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="channelWhatsapp"
                  render={({ field }) => (
                    <Switch
                      id="channel-whatsapp"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="cursor-pointer"
                    />
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="defaultChannel"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Canal par défaut</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col gap-2 sm:flex-row sm:gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="email"
                          id="default-email"
                          disabled={!channelEmail}
                          className="cursor-pointer"
                        />
                        <Label htmlFor="default-email" className="font-normal">
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="sms"
                          id="default-sms"
                          disabled={!channelSms}
                          className="cursor-pointer"
                        />
                        <Label htmlFor="default-sms" className="font-normal">
                          SMS
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem
                          value="whatsapp"
                          id="default-whatsapp"
                          disabled={!channelWhatsapp}
                          className="cursor-pointer"
                        />
                        <Label htmlFor="default-whatsapp" className="font-normal">
                          WhatsApp
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="justify-end border-t">
            <Button type="submit" className="cursor-pointer">
              Enregistrer les politiques
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}