"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  MessageCircle,
  CreditCard,
  CalendarDays,
  FileSpreadsheet,
  ShieldCheck,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  connected: boolean
}

const initialIntegrations: Integration[] = [
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    description: "Send appointment reminders and confirmations via WhatsApp.",
    icon: MessageCircle,
    connected: true,
  },
  {
    id: "payments",
    name: "Payment Gateway",
    description: "Accept card payments and sync transactions with Billing.",
    icon: CreditCard,
    connected: true,
  },
  {
    id: "calendar",
    name: "Google Calendar Sync",
    description: "Two-way sync between the practice schedule and Google Calendar.",
    icon: CalendarDays,
    connected: false,
  },
  {
    id: "accounting",
    name: "Accounting Export",
    description: "Export invoices and payments to your accounting software.",
    icon: FileSpreadsheet,
    connected: false,
  },
  {
    id: "cnam",
    name: "CNAM Claims",
    description: "Submit and track national health insurance claims electronically.",
    icon: ShieldCheck,
    connected: false,
  },
]

const WEBHOOK_EVENTS = [
  { id: "appointment.created", label: "Appointment created" },
  { id: "appointment.cancelled", label: "Appointment cancelled" },
  { id: "invoice.paid", label: "Invoice paid" },
  { id: "patient.created", label: "Patient created" },
]

function maskKey(key: string) {
  return `${key.slice(0, 8)}${"•".repeat(20)}${key.slice(-4)}`
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(initialIntegrations)
  const [webhookUrl, setWebhookUrl] = useState("https://dentapp.tn/api/webhooks/inbound")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    "appointment.created",
    "invoice.paid",
  ])

  const [liveKey] = useState("sk_live_51H8gT9k2p7Qz3nB4234")
  const [testKey] = useState("sk_test_51H8gT9k2p7Qz3nB5678")

  const toggleIntegration = (id: string) => {
    setIntegrations((prev) =>
      prev.map((integration) => {
        if (integration.id !== id) return integration
        const next = !integration.connected
        toast.success(
          next ? `${integration.name} connected` : `${integration.name} disconnected`
        )
        return { ...integration, connected: next }
      })
    )
  }

  const copyKey = (label: string, key: string) => {
    navigator.clipboard?.writeText(key)
    toast.success(`${label} copied to clipboard`)
  }

  const regenerateKey = (label: string) => {
    toast.success(`${label} regenerated`, {
      description: "The previous key will stop working within 5 minutes.",
    })
  }

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    )
  }

  const saveWebhook = () => {
    toast.success("Webhook settings saved")
  }

  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect third-party services and manage API access for the practice.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Services</CardTitle>
          <CardDescription>
            OAuth connections used across scheduling, billing, and patient
            communication.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {integrations.map((integration, index) => (
              <div key={integration.id}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <integration.icon className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        {integration.name}
                        <Badge
                          variant={integration.connected ? "secondary" : "outline"}
                          className={
                            integration.connected
                              ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20"
                              : ""
                          }
                        >
                          {integration.connected ? "Connected" : "Not connected"}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {integration.description}
                      </div>
                    </div>
                  </div>
                  <Switch
                    className="cursor-pointer"
                    checked={integration.connected}
                    onCheckedChange={() => toggleIntegration(integration.id)}
                  />
                </div>
                {index < integrations.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Use these keys to authenticate requests against the DentApp API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="font-medium">Production key</div>
              <div className="text-sm text-muted-foreground font-mono">
                {maskKey(liveKey)}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => regenerateKey("Production key")}
              >
                <RefreshCw className="mr-2 size-3.5" />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => copyKey("Production key", liveKey)}
              >
                <Copy className="mr-2 size-3.5" />
                Copy
              </Button>
            </div>
          </div>
          <Separator />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="font-medium">Test key</div>
              <div className="text-sm text-muted-foreground font-mono">
                {maskKey(testKey)}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => regenerateKey("Test key")}
              >
                <RefreshCw className="mr-2 size-3.5" />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                onClick={() => copyKey("Test key", testKey)}
              >
                <Copy className="mr-2 size-3.5" />
                Copy
              </Button>
            </div>
          </div>
          <Separator />
          <Button
            variant="outline"
            className="cursor-pointer"
            onClick={() => toast.success("New API key created")}
          >
            <Plus className="mr-2 size-4" />
            Create new key
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Send real-time event notifications to an external endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Endpoint URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-server.com/webhooks"
              />
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer text-destructive shrink-0"
                onClick={() => setWebhookUrl("")}
              >
                <Trash2 className="size-4" />
                <span className="sr-only">Clear endpoint</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Events to send</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {WEBHOOK_EVENTS.map((event) => (
                <div key={event.id} className="flex items-center gap-2">
                  <Checkbox
                    id={event.id}
                    checked={selectedEvents.includes(event.id)}
                    onCheckedChange={() => toggleEvent(event.id)}
                    className="cursor-pointer"
                  />
                  <Label htmlFor={event.id} className="text-sm font-normal cursor-pointer">
                    {event.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end border-t">
          <Button className="cursor-pointer" onClick={saveWebhook}>
            Save webhook settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}